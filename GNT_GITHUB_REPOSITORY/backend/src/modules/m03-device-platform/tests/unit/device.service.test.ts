import { AppError } from '@/common/errors/error-classes';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deviceRepository } from '../../repositories/device.repository';
import { deviceInternal } from '../../services/device.internal';
import { deviceService } from '../../services/device.service';

vi.mock('../../repositories/device.repository');
vi.mock('../../services/device.internal');

describe('M03 - deviceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveSessions', () => {
    it('should return active sessions for user', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          user_id: 'user-123',
          device_name: 'iPhone 15',
          platform: 'ios',
          status: 'active',
          created_at: new Date(),
          last_active_at: new Date(),
          expires_at: new Date(Date.now() + 3600000),
        },
      ];

      vi.mocked(deviceRepository.getActiveSessionsByUserId).mockResolvedValue(mockSessions as any);

      const result = await deviceService.getActiveSessions('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].deviceName).toBe('iPhone 15');
    });
  });

  describe('terminateSession', () => {
    it('should terminate own session', async () => {
      vi.mocked(deviceRepository.getSessionById).mockResolvedValue({
        id: 'session-1',
        user_id: 'user-123',
      } as any);
      vi.mocked(deviceRepository.deleteSession).mockResolvedValue({} as any);

      await deviceService.terminateSession('user-123', 'session-1');

      expect(deviceRepository.deleteSession).toHaveBeenCalledWith('session-1');
    });

    it('should throw error for unauthorized session', async () => {
      vi.mocked(deviceRepository.getSessionById).mockResolvedValue({
        id: 'session-1',
        user_id: 'other-user',
      } as any);

      await expect(deviceService.terminateSession('user-123', 'session-1')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('checkForUpdate', () => {
    it('detects an update from a real published release (notes from the release row)', async () => {
      vi.mocked(deviceRepository.getLatestPublishedRelease).mockResolvedValue({
        platform: 'ios',
        version: '2.1.0',
        release_notes: ['New features'],
        min_supported: null,
        is_published: true,
      } as any);
      vi.mocked(deviceInternal.compareVersions).mockReturnValue(-1);
      vi.mocked(deviceInternal.getUpdateSeverity).mockResolvedValue('major');

      const result = await deviceService.checkForUpdate('ios', '2.0.0');

      expect(result.hasUpdate).toBe(true);
      expect(result.latestVersion).toBe('2.1.0');
      expect(result.severity).toBe('major');
      expect(result.releaseNotes).toEqual(['New features']);
    });

    it('no published release => honest empty answer, NOT a fake version', async () => {
      vi.mocked(deviceRepository.getLatestPublishedRelease).mockResolvedValue(null);

      const result = await deviceService.checkForUpdate('ios', '2.0.0');

      expect(result.hasUpdate).toBe(false);
      expect(result.latestVersion).toBe('2.0.0'); // == currentVersion, no "2.1.0"
      expect(result.releaseNotes).toBeUndefined();
      expect(result.forceUpdate).toBe(false);
    });

    it('current below min_supported => forceUpdate', async () => {
      vi.mocked(deviceRepository.getLatestPublishedRelease).mockResolvedValue({
        platform: 'android',
        version: '3.0.0',
        release_notes: [],
        min_supported: '2.5.0',
        is_published: true,
      } as any);
      vi.mocked(deviceInternal.compareVersions).mockImplementation((a: string, b: string) =>
        a === b ? 0 : a < b ? -1 : 1
      );
      vi.mocked(deviceInternal.getUpdateSeverity).mockResolvedValue('major');

      const result = await deviceService.checkForUpdate('android', '2.0.0');

      expect(result.hasUpdate).toBe(true);
      expect(result.forceUpdate).toBe(true);
    });
  });

  describe('registerDevice', () => {
    it('should create new device if not exists', async () => {
      vi.mocked(deviceRepository.getDeviceByUserAndName).mockResolvedValue(null);
      vi.mocked(deviceRepository.createDevice).mockResolvedValue({
        id: 'device-1',
        device_name: 'iPhone 15',
      } as any);

      const result = await deviceService.registerDevice('user-123', {
        deviceName: 'iPhone 15',
        platform: 'ios',
      });

      expect(result.deviceName).toBe('iPhone 15');
      expect(deviceRepository.createDevice).toHaveBeenCalled();
    });

    it('should update existing device', async () => {
      vi.mocked(deviceRepository.getDeviceByUserAndName).mockResolvedValue({
        id: 'device-1',
        device_name: 'iPhone 15',
      } as any);
      vi.mocked(deviceRepository.updateDevice).mockResolvedValue({
        id: 'device-1',
        device_name: 'iPhone 15 Pro',
      } as any);

      const result = await deviceService.registerDevice('user-123', {
        deviceName: 'iPhone 15',
      });

      expect(deviceRepository.updateDevice).toHaveBeenCalled();
    });
  });
});
