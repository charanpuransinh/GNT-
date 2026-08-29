export interface DeviceSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  ipAddress: string;
  location?: string;
  userAgent: string;
  status: 'active' | 'idle' | 'expired';
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
}

export interface DeviceInfo {
  id: string;
  userId: string;
  deviceName: string;
  model: string;
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web';
  osVersion: string;
  appVersion: string;
  pushToken?: string;
  isTrusted: boolean;
  lastSeenAt: Date;
  createdAt: Date;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  severity: 'critical' | 'major' | 'minor' | 'patch';
  releaseNotes?: string[];
  downloadUrl?: string;
  forceUpdate: boolean;
}

export interface DeploymentSettings {
  autoUpdate: boolean;
  updateNotifications: boolean;
  sessionTimeout: number;
  forceSingleSession: boolean;
  offlineSync: boolean;
  syncInterval: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}
