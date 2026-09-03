import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appService } from '../../services/app.service';
import { appRepository } from '../../repositories/app.repository';

describe.runIf(process.env.TEST_DB === '1')(
'M01 - Integration Tests', () => {
  beforeAll(() => {
    // Setup test environment
    process.env.APP_NAME = 'GNT Test';
    process.env.APP_VERSION = '1.0.0-test';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    delete process.env.APP_NAME;
    delete process.env.APP_VERSION;
  });

  describe('Config + Health integration', () => {
    it('should return consistent version across config and health', async () => {
      const config = await appService.getAppConfig();
      const health = await appService.getHealthStatus();

      expect(config.version).toBe(health.version);
    });

    it('should handle missing config gracefully', async () => {
      const originalGetConfig = appRepository.getConfig;
      const originalAppName = process.env.APP_NAME;
      appRepository.getConfig = async () => ({});
      delete process.env.APP_NAME; // fallback 'GARUDA NEXTECH' तक पहुंचने के लिए

      const config = await appService.getAppConfig();

      expect(config.appName).toBe('GARUDA NEXTECH');
      expect(config.features.offlineMode).toBe(true);

      appRepository.getConfig = originalGetConfig;
      process.env.APP_NAME = originalAppName;
    });
  });
});
