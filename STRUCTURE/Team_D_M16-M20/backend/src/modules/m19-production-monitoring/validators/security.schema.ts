import { z } from 'zod';

export const auditQuerySchema = z.object({
  companyId: z.string().min(1),
  module: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const loginHistoryQuerySchema = z.object({
  companyId: z.string().min(1),
  userId: z.string().optional(),
  status: z.enum(['success', 'failed']).optional(),
});

export const securityEventQuerySchema = z.object({
  companyId: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  eventType: z.string().optional(),
  resolved: z.coerce.boolean().optional(),
});

export const anomalyCheckSchema = z.object({
  companyId: z.string().min(1),
  eventType: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userId: z.string().optional(),
});

export const logActionSchema = z.object({
  companyId: z.string().min(1),
  userId: z.string().optional(),
  action: z.string().min(1),
  module: z.string().min(1),
  resource: z.string().min(1),
  resourceId: z.string().optional(),
  beforeData: z.record(z.unknown()).optional(),
  afterData: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const healthQuerySchema = z.object({
  companyId: z.string().min(1),
});
