import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appService } from '../../services/app.service';
import { appRepository } from '../../repositories/app.repository';

vi.mock('../../repositories/app.repository');

describe('M01 - appService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAppConfig', () => {
    it('should return enriched config with default feature flags', async () => {
      vi.mocked(appRepository.getConfig).mockResolvedValue({
        appName: 'Test App',
        version: '1.0.0',
        environment: 'development',
        features: { ocrEnabled: true },
        maintenanceMode: false,
      });

      const result = await appService.getAppConfig();

      expect(result.appName).toBe('Test App');
      expect(result.version).toBe('1.0.0');
      expect(result.environment).toBe('development');
      expect(result.features.offlineMode).toBe(true);
      expect(result.features.multiBranch).toBe(true);
      expect(result.features.gstEnabled).toBe(true);
      expect(result.features.ocrEnabled).toBe(true);
      expect(result.maintenanceMode).toBe(false);
    });

    it('should use environment fallback when config is empty', async () => {
      vi.mocked(appRepository.getConfig).mockResolvedValue({});

      const result = await appService.getAppConfig();

      expect(result.appName).toBe('GARUDA NEXTECH');
      expect(result.version).toBe('1.0.0');
      expect(result.environment).toBe('development');
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy when all checks pass', async () => {
      vi.mocked(appRepository.checkDatabaseConnection).mockResolvedValue(true);
      vi.mocked(appRepository.checkCacheConnection).mockResolvedValue(true);
      vi.mocked(appRepository.checkStorageConnection).mockResolvedValue(true);

      const result = await appService.getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.checks.database).toBe(true);
      expect(result.checks.cache).toBe(true);
      expect(result.checks.storage).toBe(true);
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return degraded when one check fails', async () => {
      vi.mocked(appRepository.checkDatabaseConnection).mockResolvedValue(true);
      vi.mocked(appRepository.checkCacheConnection).mockResolvedValue(false);
      vi.mocked(appRepository.checkStorageConnection).mockResolvedValue(true);

      const result = await appService.getHealthStatus();

      expect(result.status).toBe('degraded');
      expect(result.checks.cache).toBe(false);
    });

    it('should return degraded when all checks fail', async () => {
      vi.mocked(appRepository.checkDatabaseConnection).mockResolvedValue(false);
      vi.mocked(appRepository.checkCacheConnection).mockResolvedValue(false);
      vi.mocked(appRepository.checkStorageConnection).mockResolvedValue(false);

      const result = await appService.getHealthStatus();

      expect(result.status).toBe('degraded');
    });
  });

  describe('checkMaintenanceMode', () => {
    it('should return maintenance status when enabled', async () => {
      vi.mocked(appRepository.getConfig).mockResolvedValue({
        maintenanceMode: true,
      });

      const result = await appService.checkMaintenanceMode();

      expect(result.maintenanceMode).toBe(true);
      expect(result.message).toContain('maintenance');
    });

    it('should return no message when maintenance is disabled', async () => {
      vi.mocked(appRepository.getConfig).mockResolvedValue({
        maintenanceMode: false,
      });

      const result = await appService.checkMaintenanceMode();

      expect(result.maintenanceMode).toBe(false);
      expect(result.message).toBeUndefined();
    });
  });
});
