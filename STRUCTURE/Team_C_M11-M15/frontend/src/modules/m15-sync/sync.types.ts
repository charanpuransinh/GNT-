export interface FieldMapping {
  internalField: string;
  externalField: string;
  transform?: string;
  isKey: boolean;
}

export interface SyncEntityConfig {
  id: string;
  internalEntity: string;
  externalEntity: string;
  fieldMappings: FieldMapping[];
  syncDirection: string;
  sourceFilter?: Record<string, unknown>;
  targetFilter?: Record<string, unknown>;
  conflictResolution: string;
  syncMode?: string;
  cronExpression?: string;
  isActive: boolean;
}

export interface SyncConfig {
  id: string;
  configCode: string;
  name: string;
  description?: string;
  sourceSystem: string;
  sourceVersion?: string;
  syncDirection: string;
  connectionType: string;
  connectionConfig: Record<string, unknown>;
  syncMode: string;
  cronExpression?: string;
  status: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncJobId?: string;
  consecutiveErrors: number;
  errorThreshold: number;
  entityConfigs: SyncEntityConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface SyncJob {
  id: string;
  jobNumber: string;
  syncConfigId: string;
  syncConfig?: { id: string; name: string; configCode: string };
  triggeredBy: string;
  triggeredByUser?: string;
  entityType?: string;
  status: string;
  totalEntities: number;
  processedEntities: number;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  skippedCount: number;
  errorCount: number;
  conflictCount: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  resultSummary?: Record<string, unknown>;
  errorSummary?: Record<string, unknown>;
  createdAt: string;
}

export interface SyncConflict {
  id: string;
  syncJobId: string;
  entityType: string;
  internalId: string;
  externalId: string;
  conflictType: string;
  conflictField?: string;
  internalValue?: Record<string, unknown>;
  externalValue?: Record<string, unknown>;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  mergedValue?: Record<string, unknown>;
  resolutionNotes?: string;
  status: string;
  createdAt: string;
}

export interface SyncProgress {
  jobId: string;
  jobNumber: string;
  status: string;
  totalEntities: number;
  processedEntities: number;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  skippedCount: number;
  errorCount: number;
  conflictCount: number;
  percentComplete: number;
  currentEntity?: string;
  startedAt?: string;
  estimatedCompletion?: string;
}

export interface ExternalIntegration {
  id: string;
  integrationCode: string;
  name: string;
  description?: string;
  provider: string;
  providerVersion?: string;
  authType: string;
  baseUrl?: string;
  apiVersion?: string;
  status: string;
  lastHealthCheck?: string;
  healthStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupJob {
  id: string;
  jobNumber: string;
  name: string;
  description?: string;
  scope: string;
  moduleCode?: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  fileUrl?: string;
  fileSize?: number;
  compressionType: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface ConflictStats {
  total: number;
  pending: number;
  resolved: number;
  autoResolved: number;
  byEntityType: Record<string, number>;
}
