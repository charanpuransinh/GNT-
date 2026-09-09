import { AppError } from '@/common/errors/error-classes';
import { Prisma } from '@prisma/client';
import { deviceRepository } from '../repositories/device.repository';
import { DeploymentSettings, DeviceInfo, DeviceSession, UpdateInfo } from '../types/device.types';
import { deviceInternal } from './device.internal';

// Prisma DB rows (snake_case) → API DTOs (camelCase) mapping
type SessionRow = Prisma.active_sessionGetPayload<{}>;
type DeviceRow = Prisma.device_registryGetPayload<{}>;
type DeploymentRow = Prisma.deployment_settingsGetPayload<{}>;

function toDeviceSession(row: SessionRow): DeviceSession {
  return {
    id: row.id,
    userId: row.user_id,
    deviceId: row.device_id ?? '',
    deviceName: row.device_name ?? '',
    platform: row.platform ?? '',
    ipAddress: row.ip_address,
    location: row.location ?? undefined,
    userAgent: row.user_agent ?? '',
    status: row.status as DeviceSession['status'],
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
    expiresAt: row.expires_at,
  };
}

function toDeviceInfo(row: DeviceRow): DeviceInfo {
  return {
    id: row.id,
    userId: row.user_id,
    deviceName: row.device_name,
    model: row.model,
    platform: row.platform as DeviceInfo['platform'],
    osVersion: row.os_version,
    appVersion: row.app_version,
    pushToken: row.push_token ?? undefined,
    isTrusted: row.is_trusted,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  };
}

function toDeploymentSettings(row: DeploymentRow): DeploymentSettings {
  return {
    autoUpdate: row.auto_update,
    updateNotifications: row.update_notifications,
    sessionTimeout: row.session_timeout,
    forceSingleSession: row.force_single_session,
    offlineSync: row.offline_sync,
    syncInterval: row.sync_interval,
  };
}

export const deviceService = {
  async getActiveSessions(userId: string): Promise<DeviceSession[]> {
    const sessions = await deviceRepository.getActiveSessionsByUserId(userId);
    return sessions.map(toDeviceSession);
  },

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    const session = await deviceRepository.getSessionById(sessionId);
    if (!session || session.user_id !== userId) {
      throw new AppError('GNT-ERR-3001', 'Session not found or unauthorized', 404);
    }
    await deviceRepository.deleteSession(sessionId);
  },

  async terminateAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    await deviceRepository.deleteAllSessionsByUserId(userId, exceptSessionId);
  },

  async registerDevice(userId: string, data: Partial<DeviceInfo>): Promise<DeviceInfo> {
    const existing = await deviceRepository.getDeviceByUserAndName(userId, data.deviceName || '');
    let row: DeviceRow;
    if (existing) {
      // Update existing device
      row = await deviceRepository.updateDevice(existing.id, {
        device_name: data.deviceName ?? existing.device_name,
        model: data.model ?? existing.model,
        platform: data.platform ?? existing.platform,
        os_version: data.osVersion ?? existing.os_version,
        app_version: data.appVersion ?? existing.app_version,
        push_token: data.pushToken ?? existing.push_token,
        is_trusted: data.isTrusted ?? existing.is_trusted,
        last_seen_at: new Date(),
      });
    } else {
      row = await deviceRepository.createDevice({
        user_id: userId,
        device_name: data.deviceName || '',
        model: data.model || '',
        platform: data.platform || 'web',
        os_version: data.osVersion || '',
        app_version: data.appVersion || '',
        push_token: data.pushToken,
        is_trusted: false,
        last_seen_at: new Date(),
      });
    }
    return toDeviceInfo(row);
  },

  async getRegisteredDevices(userId: string): Promise<DeviceInfo[]> {
    const devices = await deviceRepository.getDevicesByUserId(userId);
    return devices.map(toDeviceInfo);
  },

  async checkForUpdate(platform: string, currentVersion: string): Promise<UpdateInfo> {
    // असली published release से — कोई हार्डकोडेड version नहीं।
    const release = await deviceRepository.getLatestPublishedRelease(platform);

    // इस platform के लिए कोई release publish नहीं हुई → ईमानदार जवाब,
    // नक़ली "2.1.0 available" नहीं।
    if (!release) {
      return {
        currentVersion,
        latestVersion: currentVersion,
        hasUpdate: false,
        severity: 'patch',
        releaseNotes: undefined,
        forceUpdate: false,
      };
    }

    const latestVersion = release.version;
    const hasUpdate = deviceInternal.compareVersions(currentVersion, latestVersion) < 0;
    const severity: UpdateInfo['severity'] = hasUpdate
      ? await deviceInternal.getUpdateSeverity(currentVersion, latestVersion)
      : 'patch';

    // min_supported से नीचे → forced (या critical severity)
    const belowMin =
      !!release.min_supported &&
      deviceInternal.compareVersions(currentVersion, release.min_supported) < 0;

    return {
      currentVersion,
      latestVersion,
      hasUpdate,
      severity,
      releaseNotes: hasUpdate ? (release.release_notes ?? []) : undefined,
      forceUpdate: belowMin || severity === 'critical',
    };
  },

  async getDownloadUrl(version: string): Promise<string> {
    // release में download_url हो तो वही; वरना env-based fallback
    const platforms = ['ios', 'android', 'windows', 'macos', 'linux', 'web'];
    for (const p of platforms) {
      const r = await deviceRepository.getLatestPublishedRelease(p);
      if (r?.version === version && r.download_url) return r.download_url;
    }
    return deviceInternal.generateDownloadUrl(version);
  },

  /** owner/admin — नई app release publish करना */
  async publishRelease(input: {
    platform: string;
    version: string;
    releaseNotes?: string[];
    minSupported?: string | null;
    downloadUrl?: string | null;
    isPublished?: boolean;
    createdBy?: string;
  }) {
    return deviceRepository.upsertRelease({
      platform: input.platform,
      version: input.version,
      release_notes: input.releaseNotes ?? [],
      min_supported: input.minSupported ?? null,
      download_url: input.downloadUrl ?? null,
      is_published: input.isPublished ?? true,
      created_by: input.createdBy ?? null,
    });
  },

  async listReleases(platform?: string) {
    return deviceRepository.listReleases(platform);
  },

  async getDeploymentSettings(companyId: string): Promise<DeploymentSettings> {
    const settings = await deviceRepository.getDeploymentSettings(companyId);
    return settings ? toDeploymentSettings(settings) : deviceInternal.getDefaultSettings();
  },

  async updateDeploymentSettings(
    companyId: string,
    data: Partial<DeploymentSettings>
  ): Promise<DeploymentSettings> {
    const existing = await deviceRepository.getDeploymentSettings(companyId);
    if (existing) {
      const row = await deviceRepository.updateDeploymentSettings(companyId, {
        auto_update: data.autoUpdate,
        update_notifications: data.updateNotifications,
        session_timeout: data.sessionTimeout,
        force_single_session: data.forceSingleSession,
        offline_sync: data.offlineSync,
        sync_interval: data.syncInterval,
      });
      return toDeploymentSettings(row);
    }
    const row = await deviceRepository.createDeploymentSettings({
      company_id: companyId,
      auto_update: data.autoUpdate ?? false,
      update_notifications: data.updateNotifications ?? true,
      session_timeout: data.sessionTimeout ?? 30,
      force_single_session: data.forceSingleSession ?? false,
      offline_sync: data.offlineSync ?? true,
      sync_interval: data.syncInterval ?? 15,
    });
    return toDeploymentSettings(row);
  },
};
