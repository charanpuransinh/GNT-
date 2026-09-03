import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deviceService } from '../../services/device.service';
import { deviceRepository } from '../../repositories/device.repository';
import { deviceInternal } from '../../services/device.internal';
import { AppError } from '@/common/errors/error-classes';

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

      await expect(
        deviceService.terminateSession('user-123', 'session-1')
      ).rejects.toThrow(AppError);
    });
  });

  describe('checkForUpdate', () => {
    it('should detect available update', async () => {
      vi.mocked(deviceInternal.getLatestVersion).mockReturnValue('2.1.0');
      vi.mocked(deviceInternal.compareVersions).mockReturnValue(-1);
      vi.mocked(deviceInternal.getUpdateSeverity).mockResolvedValue('major');
      vi.mocked(deviceInternal.getReleaseNotes).mockResolvedValue(['New features']);

      const result = await deviceService.checkForUpdate('ios', '2.0.0');

      expect(result.hasUpdate).toBe(true);
      expect(result.latestVersion).toBe('2.1.0');
      expect(result.severity).toBe('major');
    });

    it('should return no update when on latest', async () => {
      vi.mocked(deviceInternal.getLatestVersion).mockReturnValue('2.0.0');
      vi.mocked(deviceInternal.compareVersions).mockReturnValue(0);

      const result = await deviceService.checkForUpdate('ios', '2.0.0');

      expect(result.hasUpdate).toBe(false);
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
        device_name: 'iPhone 15',
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
        device_name: 'iPhone 15',
      });

      expect(deviceRepository.updateDevice).toHaveBeenCalled();
    });
  });
});
