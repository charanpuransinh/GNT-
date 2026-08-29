import { z } from 'zod';

export const registerDeviceSchema = z.object({
  deviceName: z.string().min(1).max(100),
  model: z.string().max(100),
  platform: z.enum(['ios', 'android', 'windows', 'macos', 'linux', 'web']),
  osVersion: z.string().max(50),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  pushToken: z.string().optional(),
});

export const updateDeviceSchema = z.object({
  deviceName: z.string().min(1).max(100).optional(),
  pushToken: z.string().optional(),
  isTrusted: z.boolean().optional(),
});

export const deploymentSettingsSchema = z.object({
  autoUpdate: z.boolean(),
  updateNotifications: z.boolean(),
  sessionTimeout: z.number().min(5).max(120),
  forceSingleSession: z.boolean(),
  offlineSync: z.boolean(),
  syncInterval: z.number().min(1).max(60),
});

export const checkUpdateQuerySchema = z.object({
  platform: z.enum(['ios', 'android', 'windows', 'macos', 'linux', 'web']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
});
