import { z } from 'zod';

export const deviceSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deviceId: z.string().uuid(),
  deviceName: z.string().min(1).max(100),
  platform: z.enum(['ios', 'android', 'windows', 'macos', 'linux', 'web']),
  ipAddress: z.union([z.ipv4(), z.ipv6()]),
  location: z.string().optional(),
  userAgent: z.string(),
  status: z.enum(['active', 'idle', 'expired']),
  createdAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const deviceInfoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deviceName: z.string().min(1).max(100),
  model: z.string().max(100),
  platform: z.enum(['ios', 'android', 'windows', 'macos', 'linux', 'web']),
  osVersion: z.string().max(50),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  pushToken: z.string().optional(),
  isTrusted: z.boolean(),
  lastSeenAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const updateInfoSchema = z.object({
  currentVersion: z.string(),
  latestVersion: z.string(),
  hasUpdate: z.boolean(),
  severity: z.enum(['critical', 'major', 'minor', 'patch']),
  releaseNotes: z.array(z.string()).optional(),
  downloadUrl: z.string().url().optional(),
  forceUpdate: z.boolean(),
});

export const deploymentSettingsSchema = z.object({
  autoUpdate: z.boolean(),
  updateNotifications: z.boolean(),
  sessionTimeout: z.number().min(5).max(120),
  forceSingleSession: z.boolean(),
  offlineSync: z.boolean(),
  syncInterval: z.number().min(1).max(60),
});

export type DeviceSessionInput = z.infer<typeof deviceSessionSchema>;
export type DeviceInfoInput = z.infer<typeof deviceInfoSchema>;
export type UpdateInfoInput = z.infer<typeof updateInfoSchema>;
export type DeploymentSettingsInput = z.infer<typeof deploymentSettingsSchema>;
