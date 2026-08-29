import { z } from 'zod';

export const appConfigSchema = z.object({
  appName: z.string().min(1, 'App name is required').max(100, 'App name too long'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format (x.x.x)'),
  environment: z.enum(['development', 'staging', 'production']),
  features: z.record(z.boolean()),
  maintenanceMode: z.boolean(),
  companyName: z.string().optional(),
  branding: z
    .object({
      logoUrl: z.string().url().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      favicon: z.string().url().optional(),
    })
    .optional(),
});

export const healthStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'down']),
  timestamp: z.string().datetime(),
  uptime: z.number().nonnegative(),
  version: z.string(),
  checks: z.object({
    database: z.boolean(),
    cache: z.boolean(),
    storage: z.boolean(),
  }),
});

export const systemInfoSchema = z.object({
  platform: z.string(),
  nodeVersion: z.string(),
  memoryUsage: z.object({
    used: z.number(),
    total: z.number(),
    percentage: z.number().min(0).max(100),
  }),
  cpuLoad: z.number().min(0).max(100),
  activeConnections: z.number().nonnegative(),
});

export type AppConfigInput = z.infer<typeof appConfigSchema>;
export type HealthStatusInput = z.infer<typeof healthStatusSchema>;
export type SystemInfoInput = z.infer<typeof systemInfoSchema>;
