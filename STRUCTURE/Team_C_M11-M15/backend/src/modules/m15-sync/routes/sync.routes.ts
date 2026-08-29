// M15 Sync Module — Routes
// GNT Team C | Modular Monolith Architecture

import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { ConflictController } from '../controllers/conflict.controller';
import { BackupController } from '../controllers/backup.controller';
import { WebhookController } from '../controllers/webhook.controller';
import { SyncService } from '../services/sync.service';
import { ConflictService } from '../services/conflict.service';
import { BackupService } from '../services/backup.service';
import { WebhookService } from '../services/webhook.service';
import { SyncQueueService } from '../services/sync-queue.service';
import { SyncRepository } from '../repositories/sync.repository';
import { SyncStateRepository } from '../repositories/sync-state.repository';
import { EventEmitter } from '../events/sync.emitter';
import { PrismaClient } from '@prisma/client';
import { validateRequest } from '../middleware/sync.validate';
import { authenticate, requireTenant } from '../middleware/sync.auth';
import {
  createSyncJobSchema, updateSyncJobSchema,
  resolveConflictSchema, createBackupSchema,
  createWebhookSchema, updateWebhookSchema
} from '../utils/sync.schemas';

const prisma = new PrismaClient();
const eventEmitter = new EventEmitter();

// Repositories
const syncRepo = new SyncRepository(prisma);
const stateRepo = new SyncStateRepository(prisma);

// Services
const syncService = new SyncService(prisma, syncRepo, stateRepo, eventEmitter);
const queueService = new SyncQueueService(prisma);
const conflictService = new ConflictService(prisma, eventEmitter);
const backupService = new BackupService(prisma, eventEmitter);
const webhookService = new WebhookService(prisma, eventEmitter);

// Controllers
const syncController = new SyncController(syncService, queueService);
const conflictController = new ConflictController(conflictService);
const backupController = new BackupController(backupService);
const webhookController = new WebhookController(webhookService);

const router = Router();

// ── GLOBAL MIDDLEWARE ─────────────────────────
router.use(authenticate);
router.use(requireTenant);

// ═══════════════════════════════════════════════
// SYNC JOBS
// ═══════════════════════════════════════════════

router.get('/jobs', (req, res, next) => syncController.getAllJobs(req, res, next));
router.get('/jobs/:id', (req, res, next) => syncController.getJobById(req, res, next));
router.post('/jobs', validateRequest(createSyncJobSchema), (req, res, next) => syncController.createJob(req, res, next));
router.put('/jobs/:id', validateRequest(updateSyncJobSchema), (req, res, next) => syncController.updateJob(req, res, next));
router.delete('/jobs/:id', (req, res, next) => syncController.deleteJob(req, res, next));
router.patch('/jobs/:id/toggle', (req, res, next) => syncController.toggleJob(req, res, next));

// ═══════════════════════════════════════════════
// SYNC EXECUTION & LOGS
// ═══════════════════════════════════════════════

router.post('/jobs/:id/run', (req, res, next) => syncController.runSyncNow(req, res, next));
router.get('/jobs/:id/logs', (req, res, next) => syncController.getSyncLogs(req, res, next));

// ═══════════════════════════════════════════════
// SYNC QUEUE
// ═══════════════════════════════════════════════

router.get('/queue', (req, res, next) => syncController.getQueueItems(req, res, next));
router.post('/queue/:id/retry', (req, res, next) => syncController.retryQueueItem(req, res, next));

// ═══════════════════════════════════════════════
// CONFLICT RESOLUTION
// ═══════════════════════════════════════════════

router.get('/conflicts', (req, res, next) => conflictController.getAllConflicts(req, res, next));
router.get('/conflicts/stats', (req, res, next) => conflictController.getConflictStats(req, res, next));
router.get('/conflicts/:id', (req, res, next) => conflictController.getConflictById(req, res, next));
router.post('/conflicts/:id/resolve', validateRequest(resolveConflictSchema), (req, res, next) => conflictController.resolveConflict(req, res, next));
router.post('/conflicts/:id/ignore', (req, res, next) => conflictController.ignoreConflict(req, res, next));

// ═══════════════════════════════════════════════
// BACKUP & RESTORE
// ═══════════════════════════════════════════════

router.get('/backups', (req, res, next) => backupController.getAllBackups(req, res, next));
router.get('/backups/:id', (req, res, next) => backupController.getBackupById(req, res, next));
router.post('/backups', validateRequest(createBackupSchema), (req, res, next) => backupController.createBackup(req, res, next));
router.delete('/backups/:id', (req, res, next) => backupController.deleteBackup(req, res, next));
router.post('/backups/:id/restore', (req, res, next) => backupController.restoreBackup(req, res, next));
router.get('/restores', (req, res, next) => backupController.getRestoreJobs(req, res, next));
router.post('/restores/:id/rollback', (req, res, next) => backupController.rollbackRestore(req, res, next));

// ═══════════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════════

router.get('/webhooks', (req, res, next) => webhookController.getAllEndpoints(req, res, next));
router.post('/webhooks', validateRequest(createWebhookSchema), (req, res, next) => webhookController.createEndpoint(req, res, next));
router.put('/webhooks/:id', validateRequest(updateWebhookSchema), (req, res, next) => webhookController.updateEndpoint(req, res, next));
router.delete('/webhooks/:id', (req, res, next) => webhookController.deleteEndpoint(req, res, next));
router.patch('/webhooks/:id/toggle', (req, res, next) => webhookController.toggleEndpoint(req, res, next));
router.get('/webhooks/:id/deliveries', (req, res, next) => webhookController.getDeliveries(req, res, next));
router.post('/webhooks/:id/test', (req, res, next) => webhookController.testEndpoint(req, res, next));

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════

router.get('/dashboard', (req, res, next) => syncController.getDashboardStats(req, res, next));

export default router;
