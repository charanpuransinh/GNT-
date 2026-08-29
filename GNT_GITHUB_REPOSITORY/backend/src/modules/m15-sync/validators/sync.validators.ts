import { z } from 'zod';

export const fieldMappingSchema = z.object({
  internalField: z.string().min(1),
  externalField: z.string().min(1),
  transform: z.string().optional(),
  isKey: z.boolean().default(false)
});

export const syncEntityConfigSchema = z.object({
  internalEntity: z.string().min(1),
  externalEntity: z.string().min(1),
  fieldMappings: z.array(fieldMappingSchema).min(1),
  syncDirection: z.enum(['BIDIRECTIONAL', 'TO_EXTERNAL', 'FROM_EXTERNAL']).default('BIDIRECTIONAL'),
  sourceFilter: z.record(z.unknown()).optional(),
  targetFilter: z.record(z.unknown()).optional(),
  conflictResolution: z.enum(['INTERNAL_WINS', 'EXTERNAL_WINS', 'TIMESTAMP_WINS', 'MANUAL']).default('INTERNAL_WINS'),
  syncMode: z.string().optional(),
  cronExpression: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const createSyncConfigSchema = z.object({
  configCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  sourceSystem: z.enum(['INTERNAL', 'TALLY', 'ZOHO_BOOKS', 'QUICKBOOKS', 'SALESFORCE', 'SHOPIFY', 'RAZORPAY', 'GST_PORTAL']),
  sourceVersion: z.string().optional(),
  syncDirection: z.enum(['BIDIRECTIONAL', 'TO_EXTERNAL', 'FROM_EXTERNAL']),
  connectionType: z.enum(['API', 'DATABASE', 'FILE', 'WEBHOOK', 'SFTP']),
  connectionConfig: z.record(z.unknown()),
  syncMode: z.enum(['MANUAL', 'SCHEDULED', 'REALTIME']).default('MANUAL'),
  cronExpression: z.string().optional(),
  entityConfigs: z.array(syncEntityConfigSchema).min(1)
});

export const updateSyncConfigSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  syncDirection: z.enum(['BIDIRECTIONAL', 'TO_EXTERNAL', 'FROM_EXTERNAL']).optional(),
  connectionConfig: z.record(z.unknown()).optional(),
  syncMode: z.enum(['MANUAL', 'SCHEDULED', 'REALTIME']).optional(),
  cronExpression: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ERROR', 'DISABLED']).optional(),
  errorThreshold: z.number().int().min(1).max(20).optional()
});

export const triggerSyncSchema = z.object({
  syncConfigId: z.string().cuid(),
  entityType: z.string().optional(),
  triggeredBy: z.enum(['USER', 'SCHEDULE', 'WEBHOOK', 'RETRY', 'API']).default('USER')
});

export const syncEntitySchema = z.object({
  syncConfigCode: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  direction: z.enum(['TO_EXTERNAL', 'FROM_EXTERNAL']).optional(),
  force: z.boolean().default(false)
});

export const conflictResolutionSchema = z.object({
  conflictId: z.string().cuid(),
  resolution: z.enum(['INTERNAL_WINS', 'EXTERNAL_WINS', 'MERGED', 'MANUAL']),
  mergedValue: z.record(z.unknown()).optional(),
  resolutionNotes: z.string().optional(),
  resolvedBy: z.string().min(1)
});

export const bulkConflictResolutionSchema = z.object({
  conflictIds: z.array(z.string().cuid()).min(1),
  resolution: z.enum(['INTERNAL_WINS', 'EXTERNAL_WINS', 'IGNORED']),
  resolvedBy: z.string().min(1)
});

export const backupJobSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  scope: z.enum(['FULL', 'MODULE', 'ENTITY']),
  moduleCode: z.string().optional(),
  entityFilter: z.record(z.unknown()).optional(),
  compressionType: z.enum(['GZIP', 'ZIP', 'NONE']).default('GZIP')
});

export const integrationSchema = z.object({
  integrationCode: z.string().min(2).max(50).regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  provider: z.enum(['TALLY', 'ZOHO', 'QUICKBOOKS', 'SALESFORCE', 'RAZORPAY', 'GST_PORTAL', 'SHOPIFY']),
  providerVersion: z.string().optional(),
  authType: z.enum(['OAUTH2', 'API_KEY', 'BASIC', 'CERTIFICATE']),
  authConfig: z.record(z.unknown()),
  baseUrl: z.string().url().optional(),
  apiVersion: z.string().optional(),
  endpoints: z.record(z.unknown()).optional(),
  rateLimitConfig: z.object({
    requestsPerMinute: z.number().int().positive(),
    burstLimit: z.number().int().positive()
  }).optional()
});
