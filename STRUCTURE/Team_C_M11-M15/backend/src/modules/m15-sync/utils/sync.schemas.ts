// M15 Sync Module — Zod Validation Schemas
// GNT Team C | Modular Monolith Architecture

import { z } from 'zod';

export const createSyncJobSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  source: z.string().min(1),
  target: z.string().min(1),
  syncType: z.enum(['full', 'delta', 'bidirectional']),
  cronExpression: z.string().optional(),
  config: z.object({
    tables: z.array(z.string()),
    filters: z.record(z.unknown()).optional(),
    mappings: z.record(z.string()).optional(),
    batchSize: z.number().min(1).max(1000).optional(),
    conflictResolution: z.enum(['local_wins', 'remote_wins', 'merge', 'manual']).optional()
  }).optional()
});

export const updateSyncJobSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  source: z.string().min(1).optional(),
  target: z.string().min(1).optional(),
  syncType: z.enum(['full', 'delta', 'bidirectional']).optional(),
  cronExpression: z.string().optional(),
  config: z.object({
    tables: z.array(z.string()),
    filters: z.record(z.unknown()).optional(),
    mappings: z.record(z.string()).optional(),
    batchSize: z.number().min(1).max(1000).optional(),
    conflictResolution: z.enum(['local_wins', 'remote_wins', 'merge', 'manual']).optional()
  }).optional(),
  isActive: z.boolean().optional()
});

export const resolveConflictSchema = z.object({
  resolution: z.enum(['local_wins', 'remote_wins', 'merge', 'manual']),
  resolvedVersion: z.record(z.unknown()).optional(),
  notes: z.string().optional()
});

export const createBackupSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  backupType: z.enum(['full', 'incremental', 'differential']),
  storageType: z.enum(['local', 's3', 'gcs', 'azure']),
  tablesIncluded: z.array(z.string()).min(1),
  retentionDays: z.number().min(1).max(365).optional()
});

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  secret: z.string().min(16),
  events: z.array(z.enum([
    'sync.completed', 'sync.failed',
    'backup.completed', 'backup.failed',
    'conflict.created',
    'restore.completed', 'restore.failed'
  ])).min(1)
});

export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  secret: z.string().min(16).optional(),
  events: z.array(z.string()).min(1).optional()
});
