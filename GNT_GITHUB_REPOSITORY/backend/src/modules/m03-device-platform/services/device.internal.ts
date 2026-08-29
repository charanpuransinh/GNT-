import { logger } from '@/common/logging/logger';
import { DeploymentSettings } from '../types/device.types';

// Simulated version store (would be DB/config in production)
const LATEST_VERSIONS: Record<string, string> = {
  ios: '2.1.0',
  android: '2.1.0',
  windows: '2.0.5',
  macos: '2.1.0',
  linux: '2.0.3',
  web: '2.1.0',
};

const RELEASE_NOTES: Record<string, string[]> = {
  '2.1.0': [
    'Added offline sync support',
    'Improved barcode scanning accuracy',
    'Fixed GST calculation bug',
    'Enhanced security with biometric login',
  ],
  '2.0.5': [
    'Performance improvements',
    'Bug fixes',
  ],
};

export const deviceInternal = {
  getLatestVersion(platform: string): string {
    return LATEST_VERSIONS[platform] || '1.0.0';
  },

  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const a = parts1[i] || 0;
      const b = parts2[i] || 0;
      if (a < b) return -1;
      if (a > b) return 1;
    }
    return 0;
  },

  async getUpdateSeverity(current: string, latest: string): Promise<'critical' | 'major' | 'minor' | 'patch'> {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    if (latestParts[0] > currentParts[0]) return 'critical';
    if (latestParts[1] > currentParts[1]) return 'major';
    if (latestParts[2] > currentParts[2] + 5) return 'minor';
    return 'patch';
  },

  async getReleaseNotes(version: string): Promise<string[]> {
    return RELEASE_NOTES[version] || ['General improvements and bug fixes'];
  },

  generateDownloadUrl(version: string): string {
    return `${process.env.APP_DOWNLOAD_BASE_URL || 'https://cdn.garudanextech.com'}/releases/${version}`;
  },

  getDefaultSettings(): DeploymentSettings {
    return {
      autoUpdate: false,
      updateNotifications: true,
      sessionTimeout: 30,
      forceSingleSession: false,
      offlineSync: true,
      syncInterval: 15,
    };
  },

  generateSessionExpiry(timeoutMinutes: number): Date {
    return new Date(Date.now() + timeoutMinutes * 60 * 1000);
  },
};
