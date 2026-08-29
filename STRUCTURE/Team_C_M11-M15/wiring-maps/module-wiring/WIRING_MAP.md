# M15 Sync Module — Wiring Map

## API Endpoints

### Sync Configs
| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| POST | /api/m15/sync/configs | SyncController.createConfig | Create sync configuration |
| GET | /api/m15/sync/configs | SyncController.listConfigs | List all configs |
| GET | /api/m15/sync/configs/:id | SyncController.getConfig | Get config by ID |
| PATCH | /api/m15/sync/configs/:id | SyncController.updateConfig | Update config |
| DELETE | /api/m15/sync/configs/:id | SyncController.deleteConfig | Delete config |

### Sync Jobs
| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| POST | /api/m15/sync/trigger | SyncController.triggerSync | Trigger a sync job |
| POST | /api/m15/sync/sync-entity | SyncController.syncEntity | Sync single entity |
| GET | /api/m15/sync/preview/:configId | SyncController.previewSync | Preview changes |
| GET | /api/m15/sync/jobs | SyncController.listJobs | List jobs |
| GET | /api/m15/sync/jobs/:jobId | SyncController.getJobStatus | Job status |
| GET | /api/m15/sync/jobs/:jobId/progress | SyncController.getJobProgress | Job progress |
| GET | /api/m15/sync/jobs/:jobId/stream | SyncController.streamProgress | SSE progress stream |
| POST | /api/m15/sync/jobs/:jobId/cancel | SyncController.cancelJob | Cancel job |

### Conflicts
| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | /api/m15/conflicts | ConflictController.listConflicts | List conflicts |
| GET | /api/m15/conflicts/stats | ConflictController.getStats | Conflict statistics |
| GET | /api/m15/conflicts/:id | ConflictController.getConflict | Get conflict |
| POST | /api/m15/conflicts/:id/resolve | ConflictController.resolveConflict | Resolve conflict |
| POST | /api/m15/conflicts/bulk-resolve | ConflictController.bulkResolve | Bulk resolve |
| POST | /api/m15/conflicts/auto-resolve/:jobId | ConflictController.autoResolve | Auto-resolve |

### Backups
| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| POST | /api/m15/backups | BackupController.createBackup | Create backup |
| GET | /api/m15/backups | BackupController.listBackups | List backups |
| GET | /api/m15/backups/:id | BackupController.getBackup | Get backup |
| DELETE | /api/m15/backups/:id | BackupController.deleteBackup | Delete backup |
| GET | /api/m15/backups/:id/download | BackupController.downloadBackup | Download backup |

### Integrations
| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| POST | /api/m15/integrations | IntegrationController.createIntegration | Create integration |
| GET | /api/m15/integrations | IntegrationController.listIntegrations | List integrations |
| GET | /api/m15/integrations/:id | IntegrationController.getIntegration | Get integration |
| PATCH | /api/m15/integrations/:id | IntegrationController.updateIntegration | Update integration |
| DELETE | /api/m15/integrations/:id | IntegrationController.deleteIntegration | Delete integration |
| GET | /api/m15/integrations/:id/health | IntegrationController.healthCheck | Health check |
| GET | /api/m15/integrations/health/all | IntegrationController.healthCheckAll | Health check all |

## Cross-Module Calls (via sync.internal.ts)

| M15 Needs | Calls Module | Endpoint | Purpose |
|-----------|-------------|----------|---------|
| Fetch items | M05 | GET /api/m05/items | Inventory sync |
| Fetch customers | M06 | GET /api/m06/customers | Customer sync |
| Fetch invoices | M07 | GET /api/m07/invoices | Invoice sync |
| Create invoice | M07 | POST /api/m07/invoices | Push to internal |
| Fetch ledgers | M08 | GET /api/m08/ledgers | Ledger sync |
| Fetch payments | M11 | GET /api/m11/payments | Payment sync |
| Fetch employees | M12 | GET /api/m12/employees | HR sync |
| Trigger automation | M13 | POST /api/m13/rules/:code/trigger | Post-sync actions |
| Export data | M14 | GET /api/m14/exports | Backup data export |

## Event Registry

| Event Type | Publisher | Subscribers | Purpose |
|------------|-----------|-------------|---------|
| SYNC_STARTED | M15 | M13 (Automation) | Log sync start |
| SYNC_COMPLETED | M15 | M13, M14 | Post-sync export |
| SYNC_FAILED | M15 | M13 (Alerts) | Alert on failure |
| SYNC_CONFLICT_DETECTED | M15 | M13 | Alert on conflicts |
| BACKUP_COMPLETED | M15 | M13 | Log backup completion |
| INTEGRATION_HEALTH_CHANGED | M15 | M13 | Alert on degraded health |

## Database Schema

| Model | Purpose |
|-------|---------|
| SyncConfig | Master sync configuration per external system |
| SyncEntityConfig | Per-entity mapping within a sync config |
| SyncJob | Individual sync execution tracking |
| SyncEntityLog | Per-entity action log within a job |
| SyncConflict | Detected conflicts awaiting resolution |
| ExternalIntegration | Third-party system credentials & settings |
| SyncState | Incremental sync watermark/cursor |
| BackupJob | Backup execution tracking |

## Frontend Routes

| Route | Page | Component |
|-------|------|-----------|
| /sync/monitor | SyncMonitorPage | SyncStatusCard, SyncJobTracker |
| /sync/configs | SyncConfigPage | SyncConfigForm |
| /sync/conflicts | RestoreConflictPage | ConflictResolver |
| /sync/backups | BackupEnginePage | BackupScheduler |
