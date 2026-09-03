// M15 Sync Module — TypeScript Types
// GNT Team C | Modular Monolith Architecture

// ───────────────────────────────────────────────
// SYNC JOB TYPES
// ───────────────────────────────────────────────

export type SyncType = 'full' | 'delta' | 'bidirectional';
export type SyncStatus = 'idle' | 'running' | 'paused' | 'failed' | 'completed';
export type SyncDirection = 'push' | 'pull' | 'bidirectional';

export interface SyncJobConfig {
  tables: string[];
  filters?: Record<string, unknown>;
  mappings?: Record<string, string>;
  batchSize?: number;
  conflictResolution?: ConflictResolutionStrategy;
}

export interface SyncJob {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  source: string;
  target: string;
  syncType: SyncType;
  status: SyncStatus;
  lastRunAt?: Date;
  nextRunAt?: Date;
  cronExpression?: string;
  config?: SyncJobConfig;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSyncJobDTO {
  name: string;
  description?: string;
  source: string;
  target: string;
  syncType: SyncType;
  cronExpression?: string;
  config?: SyncJobConfig;
}

export interface UpdateSyncJobDTO {
  name?: string;
  description?: string;
  source?: string;
  target?: string;
  syncType?: SyncType;
  cronExpression?: string;
  config?: SyncJobConfig;
  isActive?: boolean;
}

// ───────────────────────────────────────────────
// SYNC LOG TYPES
// ───────────────────────────────────────────────

export interface SyncLog {
  id: string;
  tenantId: string;
  syncJobId: string;
  direction: SyncDirection;
  status: 'success' | 'failed' | 'partial';
  recordsProcessed: number;
  recordsFailed: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  details?: SyncLogDetails;
  createdAt: Date;
}

export interface SyncLogDetails {
  tableStats?: Record<string, { processed: number; failed: number }>;
  conflicts?: string[];
  durationMs?: number;
}

// ───────────────────────────────────────────────
// SYNC QUEUE TYPES
// ───────────────────────────────────────────────

export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'conflict';

// टास्क #025 B3 — Prisma SyncQueueItem (m15_sync_queue_items) से मिलाया गया।
export interface SyncQueueItem {
  id: string;
  tenantId: string;
  syncJobId: string | null;
  entityType: string | null;
  entityId: string | null;
  operation: string;
  payload: Record<string, unknown> | null;
  status: string;
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueuePayload {
  data: Record<string, unknown>;
  checksum: string;
  version: number;
}

// ───────────────────────────────────────────────
// CONFLICT RESOLUTION TYPES
// ───────────────────────────────────────────────

// टास्क #025 B3 — Prisma SyncConflict (m15_sync_conflicts) से मिलाया गया।
export type ConflictResolutionStrategy = 'INTERNAL_WINS' | 'EXTERNAL_WINS' | 'MERGED' | 'MANUAL';
export type ConflictStatus = 'PENDING' | 'RESOLVED' | 'AUTO_RESOLVED';

export interface SyncConflict {
  id: string;
  tenantId: string;
  syncJobId: string;
  entityType: string;
  internalId: string;
  externalId: string;
  conflictType?: string;
  conflictField?: string | null;
  internalValue?: Record<string, unknown> | null;
  externalValue?: Record<string, unknown> | null;
  internalVersion?: string | null;
  externalVersion?: string | null;
  resolution?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  mergedValue?: Record<string, unknown> | null;
  status: string;
  createdAt: Date;
}

export interface ResolveConflictDTO {
  resolution: ConflictResolutionStrategy;
  mergedValue?: Record<string, unknown>;
}

// ───────────────────────────────────────────────
// BACKUP & RESTORE TYPES
// ───────────────────────────────────────────────

export type BackupType = 'full' | 'incremental' | 'differential';
export type BackupStatus = 'scheduled' | 'running' | 'completed' | 'failed';
export type StorageType = 'local' | 's3' | 'gcs' | 'azure';

export interface BackupJob {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  backupType: BackupType;
  status: BackupStatus;
  storageType: StorageType;
  storagePath?: string;
  fileSize?: bigint;
  checksum?: string;
  tablesIncluded: string[];
  retentionDays: number;
  expiresAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBackupDTO {
  name: string;
  description?: string;
  backupType: BackupType;
  storageType: StorageType;
  tablesIncluded: string[];
  retentionDays?: number;
}

export type RestoreStatus = 'queued' | 'running' | 'completed' | 'failed' | 'rolled_back';

export interface RestoreJob {
  id: string;
  tenantId: string;
  backupJobId: string;
  status: RestoreStatus;
  tablesRestored: string[];
  recordsRestored: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  rolledBackAt?: Date;
  rollbackReason?: string;
  createdAt: Date;
}

// ───────────────────────────────────────────────
// WEBHOOK TYPES
// ───────────────────────────────────────────────

export type WebhookEvent = 
  | 'sync.completed' 
  | 'sync.failed' 
  | 'backup.completed' 
  | 'backup.failed'
  | 'conflict.created'
  | 'restore.completed'
  | 'restore.failed';

export interface WebhookEndpoint {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  lastTriggeredAt?: Date;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebhookDTO {
  name: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
}

export type DeliveryStatus = 'delivered' | 'failed' | 'retrying';

export interface WebhookDelivery {
  id: string;
  tenantId: string;
  webhookId: string;
  eventType: WebhookEvent;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  deliveryStatus: DeliveryStatus;
  retryCount: number;
  createdAt: Date;
}

// ───────────────────────────────────────────────
// SYNC STATE TYPES
// ───────────────────────────────────────────────

export interface SyncState {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  lastSyncedAt: Date;
  checksum: string;
  version: number;
  source: string;
  isDeleted: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ───────────────────────────────────────────────
// API RESPONSE TYPES
// ───────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SyncDashboardStats {
  totalSyncJobs: number;
  activeSyncJobs: number;
  pendingConflicts: number;
  lastSyncAt?: Date;
  totalBackups: number;
  recentSyncLogs: SyncLog[];
  recentConflicts: SyncConflict[];
}

// ─── SyncService request/response types (टास्क #025 B3 — services के use से मिलाकर) ───

export interface SyncEntityConfigInput {
  internalEntity: string;
  externalEntity?: string;
  syncDirection?: string;
  fieldMappings?: Array<{ internalField: string; externalField: string; isKey?: boolean; transform?: string }>;
  sourceFilter?: Record<string, unknown> | null;
  targetFilter?: Record<string, unknown> | null;
  conflictResolution?: string;
  syncMode?: string | null;
  cronExpression?: string | null;
  isActive?: boolean;
}

export interface CreateSyncConfigRequest {
  configCode: string;
  name: string;
  description?: string | null;
  sourceSystem: string;
  sourceVersion?: string;
  syncDirection: string;
  connectionType: string;
  connectionConfig?: Record<string, unknown> | null;
  syncMode?: string;
  cronExpression?: string | null;
  entityConfigs: SyncEntityConfigInput[];
}

export interface UpdateSyncConfigRequest {
  name?: string;
  description?: string | null;
  syncDirection?: string;
  connectionConfig?: Record<string, unknown> | null;
  syncMode?: string;
  cronExpression?: string | null;
  status?: string;
  errorThreshold?: number;
}

export interface TriggerSyncRequest {
  syncConfigId: string;
  triggeredBy?: string;
  entityType?: string;
}

export interface SyncEntityRequest {
  syncConfigCode: string;
  entityType: string;
}

export interface SyncProgress {
  jobId?: string;
  jobNumber?: string;
  status?: string;
  totalEntities?: number;
  processedEntities?: number;
  createdCount?: number;
  updatedCount?: number;
  deletedCount?: number;
  skippedCount?: number;
  errorCount?: number;
  conflictCount?: number;
  percentComplete?: number;
  currentEntity?: string;
  startedAt?: string;
  estimatedCompletion?: string;
}

export interface SyncPreviewResponse {
  jobId?: string;
  jobNumber?: string;
  status?: string;
  estimatedRecords?: number;
  entities?: Array<{
    entityType: string;
    internalCount: number;
    externalCount: number;
    changes: Array<Record<string, unknown>>;
  }>;
}
