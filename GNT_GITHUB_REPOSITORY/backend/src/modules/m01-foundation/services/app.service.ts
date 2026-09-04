import { appRepository } from '../repositories/app.repository';
import { appInternal } from './app.internal';
import { AppConfig, HealthStatus, SystemInfo } from '../types/app.types';
import { logger } from '@/common/logging/logger';

export const appService = {
  async getAppConfig(): Promise<AppConfig> {
    const rawConfig = await appRepository.getConfig();
    return appInternal.validateAndEnrichConfig(rawConfig);
  },

  async getHealthStatus(): Promise<HealthStatus> {
    const [dbHealth, cacheHealth, storageHealth] = await Promise.all([
      appRepository.checkDatabaseConnection(),
      appRepository.checkCacheConnection(),
      appRepository.checkStorageConnection(),
    ]);

    // M01 — health status तीन हालतों में:
    //   healthy  = सब ठीक
    //   degraded = कुछ ठीक, कुछ नहीं (सेवा चल तो रही है, पर पूरी नहीं)
    //   down     = database ही नहीं मिल रहा — इसके बिना कुछ नहीं चलता
    //
    // पुराना कोड: `allHealthy ? 'healthy' : anyDown ? 'degraded' : 'down'`
    // उसमें `anyDown` ठीक `allHealthy` का उल्टा था, इसलिए 'down' कभी पहुँच में
    // आता ही नहीं था — तीनों मर जाने पर भी 'degraded' ही मिलता। यानी निगरानी
    // सिस्टम पूरी ख़राबी कभी बता ही नहीं सकता था।
    const allHealthy = dbHealth && cacheHealth && storageHealth;

    return {
      status: allHealthy ? 'healthy' : dbHealth ? 'degraded' : 'down',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      checks: {
        database: dbHealth,
        cache: cacheHealth,
        storage: storageHealth,
      },
    };
  },

  async getSystemInfo(): Promise<SystemInfo> {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();

    return {
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(totalMem / 1024 / 1024),
        percentage: Math.round((memUsage.heapUsed / totalMem) * 100),
      },
      cpuLoad: 0, // Would use os.loadavg() in real implementation
      activeConnections: await appRepository.getActiveConnectionCount(),
    };
  },

  async checkMaintenanceMode(): Promise<{ maintenanceMode: boolean; message?: string }> {
    const config = await appRepository.getConfig();
    return {
      maintenanceMode: config.maintenanceMode || false,
      message: config.maintenanceMode
        ? 'System is under scheduled maintenance. Please try again later.'
        : undefined,
    };
  },
};
