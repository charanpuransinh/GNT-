import { DeploymentSettings } from '../types/device.types';

// यहाँ पहले हार्डकोडेड LATEST_VERSIONS / RELEASE_NOTES थे जो callers को नक़ली
// version ("2.1.0") देते थे। हटा दिए — असली version अब `m03_app_releases` table
// से आता है (`deviceRepository.getLatestPublishedRelease`)। नीचे सिर्फ़ शुद्ध
// (stateless) helpers हैं।

export const deviceInternal = {
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

  async getUpdateSeverity(
    current: string,
    latest: string
  ): Promise<'critical' | 'major' | 'minor' | 'patch'> {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    if (latestParts[0] > currentParts[0]) return 'critical';
    if (latestParts[1] > currentParts[1]) return 'major';
    if (latestParts[2] > currentParts[2] + 5) return 'minor';
    return 'patch';
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
