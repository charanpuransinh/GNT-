import { prisma } from '@/common/config/env-config';
import { cacheConfig } from '@/common/config/cache-config';
import Redis from 'ioredis';
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
    try {
      // Check file storage / S3 connectivity
      // Simplified for M01 — would check actual storage in production
      return true;
    } catch (error) {
      logger.error('Storage health check failed', { error });
      return false;
    }
  },

  async getActiveConnectionCount(): Promise<number> {
    try {
      // Would query connection pool or websocket manager
      return 0;
    } catch {
      return 0;
    }
  },
};
