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

export interface SyncQueueItem {
  id: string;
  tenantId: string;
  syncJobId: string;
  operation: SyncDirection;
  entityType: string;
  entityId: string;
  payload: QueuePayload;
  status: QueueItemStatus;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface QueuePayload {
  data: Record<string, unknown>;
  checksum: string;
  version: number;
}

// ───────────────────────────────────────────────
// CONFLICT RESOLUTION TYPES
// ───────────────────────────────────────────────

export type ConflictResolutionStrategy = 'local_wins' | 'remote_wins' | 'merge' | 'manual';
export type ConflictStatus = 'open' | 'resolved' | 'ignored';

export interface SyncConflict {
  id: string;
  tenantId: string;
  syncJobId: string;
  syncLogId?: string;
  entityType: string;
  entityId: string;
  localVersion: Record<string, unknown>;
  remoteVersion: Record<string, unknown>;
  resolvedVersion?: Record<string, unknown>;
  resolution?: ConflictResolutionStrategy;
  resolvedBy?: string;
  resolvedAt?: Date;
  status: ConflictStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolveConflictDTO {
  resolution: ConflictResolutionStrategy;
  resolvedVersion?: Record<string, unknown>;
  notes?: string;
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
