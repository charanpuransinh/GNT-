import { z } from 'zod';

export const auditLogFilterSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  module: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const loginHistoryFilterSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  userId: z.string().optional(),
  status: z.enum(['success', 'failed']).optional(),
});

export const securityEventFilterSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  resolved: z.boolean().optional(),
});

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
export type LoginHistoryFilterInput = z.infer<typeof loginHistoryFilterSchema>;
export type SecurityEventFilterInput = z.infer<typeof securityEventFilterSchema>;
