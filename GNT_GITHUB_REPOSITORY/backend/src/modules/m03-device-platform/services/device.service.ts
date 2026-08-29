import { deviceRepository } from '../repositories/device.repository';
import { deviceInternal } from './device.internal';
import {
  DeviceSession,
  DeviceInfo,
  UpdateInfo,
  DeploymentSettings,
} from '../types/device.types';
import { AppError } from '@/common/errors/error-classes';

export const deviceService = {
  async getActiveSessions(userId: string): Promise<DeviceSession[]> {
    return deviceRepository.getActiveSessionsByUserId(userId);
  },

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    const session = await deviceRepository.getSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError('GNT-ERR-3001', 'Session not found or unauthorized', 404);
    }
    await deviceRepository.deleteSession(sessionId);
  },

  async terminateAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    await deviceRepository.deleteAllSessionsByUserId(userId, exceptSessionId);
  },

  async registerDevice(userId: string, data: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const existing = await deviceRepository.getDeviceByUserAndName(userId, data.deviceName || '');
    if (existing) {
      // Update existing device
      return deviceRepository.updateDevice(existing.id, {
        ...data,
        lastSeenAt: new Date(),
      });
    }

    return deviceRepository.createDevice({
      ...data,
      userId,
      isTrusted: false,
      lastSeenAt: new Date(),
    });
  },

  async getRegisteredDevices(userId: string): Promise<DeviceInfo[]> {
    return deviceRepository.getDevicesByUserId(userId);
  },

  async checkForUpdate(platform: string, currentVersion: string): Promise<UpdateInfo> {
    const latestVersion = await deviceInternal.getLatestVersion(platform);
    const hasUpdate = deviceInternal.compareVersions(currentVersion, latestVersion) < 0;

    let severity: UpdateInfo['severity'] = 'patch';
    if (hasUpdate) {
      severity = await deviceInternal.getUpdateSeverity(currentVersion, latestVersion);
    }

    return {
      currentVersion,
      latestVersion,
      hasUpdate,
      severity,
      releaseNotes: hasUpdate ? await deviceInternal.getReleaseNotes(latestVersion) : undefined,
      forceUpdate: severity === 'critical',
    };
  },

  async getDownloadUrl(version: string): Promise<string> {
    return deviceInternal.generateDownloadUrl(version);
  },

  async getDeploymentSettings(companyId: string): Promise<DeploymentSettings> {
    const settings = await deviceRepository.getDeploymentSettings(companyId);
    return settings || deviceInternal.getDefaultSettings();
  },

  async updateDeploymentSettings(
    companyId: string,
    data: Partial<DeploymentSettings>
  ): Promise<DeploymentSettings> {
    const existing = await deviceRepository.getDeploymentSettings(companyId);
    if (existing) {
      return deviceRepository.updateDeploymentSettings(companyId, data);
    }
    return deviceRepository.createDeploymentSettings({ ...data, companyId });
  },
};
