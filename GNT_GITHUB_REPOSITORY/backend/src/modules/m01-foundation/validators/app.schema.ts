import { z } from 'zod';

export const getConfigQuerySchema = z.object({}).strict();

export const healthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'down']),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  version: z.string(),
  checks: z.object({
    database: z.boolean(),
    cache: z.boolean(),
    storage: z.boolean(),
  }),
});

export const systemInfoResponseSchema = z.object({
  platform: z.string(),
  nodeVersion: z.string(),
  memoryUsage: z.object({
    used: z.number(),
    total: z.number(),
    percentage: z.number(),
  }),
  cpuLoad: z.number(),
  activeConnections: z.number(),
});

export const maintenanceStatusSchema = z.object({
  maintenanceMode: z.boolean(),
  message: z.string().optional(),
});
