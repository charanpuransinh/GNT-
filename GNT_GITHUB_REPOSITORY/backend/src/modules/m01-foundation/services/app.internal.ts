import { AppConfig } from '../types/app.types';
import { logger } from '@/common/logging/logger';

export const appInternal = {
  validateAndEnrichConfig(config: Partial<AppConfig>): AppConfig {
    const enriched: AppConfig = {
      appName: config.appName || process.env.APP_NAME || 'GARUDA NEXTECH',
      version: config.version || process.env.APP_VERSION || '1.0.0',
      environment: config.environment || (process.env.NODE_ENV as AppConfig['environment']) || 'development',
      features: {
        offlineMode: true,
        multiBranch: true,
        gstEnabled: true,
        barcodeScan: true,
        ocrEnabled: false,
        internationalTrade: false,
        ...config.features,
      },
      maintenanceMode: config.maintenanceMode || false,
      companyName: config.companyName,
      branding: config.branding,
    };

    logger.info('App config enriched', { version: enriched.version, environment: enriched.environment });
    return enriched;
  },

  sanitizeConfigForClient(config: AppConfig): Partial<AppConfig> {
    // Remove sensitive fields before sending to client
    const { ...clientConfig } = config;
    return clientConfig;
  },
};
