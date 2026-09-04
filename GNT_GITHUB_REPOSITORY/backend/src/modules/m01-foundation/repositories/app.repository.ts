import { prisma } from '@/common/config/env-config';
import { cacheConfig } from '@/common/config/cache-config';
import Redis from 'ioredis';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AppConfig } from '../types/app.types';
import { logger } from '@/common/logging/logger';

export const appRepository = {
  async getConfig(): Promise<Partial<AppConfig>> {
    // M01 does not own DB tables — reads from environment or shared config store
    // In production, this would read from a centralized config service
    return {
      appName: process.env.APP_NAME,
      version: process.env.APP_VERSION,
      environment: process.env.NODE_ENV as AppConfig['environment'],
      features: JSON.parse(process.env.FEATURE_FLAGS || '{}'),
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      companyName: process.env.COMPANY_NAME,
      branding: process.env.BRANDING_LOGO
        ? {
            logoUrl: process.env.BRANDING_LOGO,
            primaryColor: process.env.BRANDING_COLOR,
          }
        : undefined,
    };
  },

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error });
      return false;
    }
  },

  async checkCacheConnection(): Promise<boolean> {
    const redis = new Redis(cacheConfig.url || 'redis://localhost:6379', { lazyConnect: true });
    try {
      await redis.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check failed', { error });
      return false;
    } finally {
      // टास्क #024 — D2: हर जाँच का अपना client ज़रूर बंद हो (connection leak नहीं)
      redis.disconnect();
    }
  },

  async checkStorageConnection(): Promise<boolean> {
    // पहले यह हमेशा `true` लौटाता था — कुछ जाँचता ही नहीं था। यानी storage
    // पूरी तरह मरा हो तब भी health check "ठीक है" बताता। नक़ली जाँच, असली
    // ख़राबी से भी ज़्यादा ख़तरनाक है।
    //
    // अब असल में जाँचता है: storage फ़ोल्डर मौजूद है, और उसमें लिखा-पढ़ा-मिटाया
    // जा सकता है (सिर्फ़ मौजूद होना काफ़ी नहीं — disk भर जाए या permission
    // बदल जाए तो फ़ोल्डर रहेगा पर लिखना नाकाम होगा)।
    const dir = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage');
    const probe = path.join(dir, `.health-${process.pid}-${Date.now()}`);
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(probe, 'ok');
      const back = await fs.readFile(probe, 'utf8');
      if (back !== 'ok') {
        logger.error('Storage health check failed', { reason: 'लिखा हुआ वापस नहीं मिला', dir });
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Storage health check failed', { error, dir });
      return false;
    } finally {
      // जाँच की फ़ाइल हर हाल में हटे — नाकाम होने पर भी कूड़ा न बचे
      await fs.unlink(probe).catch(() => {});
    }
  },

  async getActiveConnectionCount(): Promise<number> {
    // पहले यह हमेशा 0 लौटाता था ("Would query connection pool") — यानी निगरानी
    // का पन्ना बनावटी संख्या दिखाता था। अब postgres से असल में गिनता है कि इसी
    // database पर कितने connection खुले हैं।
    //
    // -1 का मतलब "गिन नहीं सका" — 0 नहीं, क्योंकि 0 का मतलब होता है "कोई
    // connection नहीं", और वो झूठ होगा। ख़राबी को शून्य बताना ही असली ख़तरा है।
    try {
      const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*)::bigint AS count
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;
      return Number(rows[0]?.count ?? -1);
    } catch (error) {
      logger.error('Active connection count failed', { error });
      return -1;
    }
  },
};
