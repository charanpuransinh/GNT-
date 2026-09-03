// M15 Sync Module — Routes (टास्क #025 B3: असली static controllers से मिलाया गया)
// पुराने m15 middleware (authenticate/requireTenant/validateRequest) हटा दिए गए —
// मुख्य app की #009 chain हर /api/v1 रास्ते पर पहले ही चलती है।
import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';
import { SyncController } from '../controllers/sync.controller';
import { ConflictController } from '../controllers/conflict.controller';
import { BackupController } from '../controllers/backup.controller';
import { WebhookController } from '../controllers/webhook.controller';
import { BackupService } from '../services/backup.service';
import { WebhookService } from '../services/webhook.service';
import { ConflictService } from '../services/conflict.service';
import { EventEmitter } from '../events/sync.emitter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const eventEmitter = new EventEmitter();
const backupService = new BackupService(prisma, eventEmitter);
const webhookService = new WebhookService(prisma, eventEmitter);
const conflictService = new ConflictService(prisma, eventEmitter);
const backupController = new BackupController(backupService);
const webhookController = new WebhookController(webhookService);
const conflictController = new ConflictController(conflictService);

const router = Router();
const auth = (req: Request): AuthenticatedRequest => req as AuthenticatedRequest;

// ── SYNC CONFIGS (static SyncController) ──
router.post('/configs', (req: Request, res: Response) => SyncController.createConfig(auth(req), res));
router.get('/configs', (req: Request, res: Response) => SyncController.listConfigs(auth(req), res));
router.get('/configs/:id', (req: Request, res: Response) => SyncController.getConfig(auth(req), res));
router.put('/configs/:id', (req: Request, res: Response) => SyncController.updateConfig(auth(req), res));
router.delete('/configs/:id', (req: Request, res: Response) => SyncController.deleteConfig(auth(req), res));
router.post('/configs/:id/trigger', (req: Request, res: Response) => SyncController.triggerSync(auth(req), res));
router.post('/configs/:id/preview', (req: Request, res: Response) => SyncController.previewSync(auth(req), res));
router.post('/sync-entity', (req: Request, res: Response) => SyncController.syncEntity(auth(req), res));

// ── SYNC JOBS ──
router.get('/jobs', (req: Request, res: Response) => SyncController.listJobs(auth(req), res));
router.get('/jobs/:id', (req: Request, res: Response) => SyncController.getJobStatus(auth(req), res));
router.post('/jobs/:id/cancel', (req: Request, res: Response) => SyncController.cancelJob(auth(req), res));
router.get('/jobs/:id/progress', (req: Request, res: Response) => SyncController.getJobProgress(auth(req), res));

// ── CONFLICTS (instance ConflictController) ──
router.get('/conflicts', (req: Request, res: Response) => conflictController.listConflicts(auth(req), res));
router.get('/conflicts/stats', (req: Request, res: Response) => conflictController.getStats(auth(req), res));
router.get('/conflicts/:id', (req: Request, res: Response) => conflictController.getConflict(auth(req), res));
router.post('/conflicts/:id/resolve', (req: Request, res: Response) => conflictController.resolveConflict(auth(req), res));
router.post('/conflicts/bulk-resolve', (req: Request, res: Response) => conflictController.bulkResolve(auth(req), res));
router.post('/conflicts/auto-resolve/:jobId', (req: Request, res: Response) => conflictController.autoResolve(auth(req), res));

// ── BACKUP & RESTORE (instance) ──
router.get('/backups', (req, res, next) => backupController.getAllBackups(req, res, next));
router.get('/backups/:id', (req, res, next) => backupController.getBackupById(req, res, next));
router.post('/backups', (req, res, next) => backupController.createBackup(req, res, next));
router.delete('/backups/:id', (req, res, next) => backupController.deleteBackup(req, res, next));
router.post('/backups/:id/restore', (req, res, next) => backupController.restoreBackup(req, res, next));
router.get('/restores', (req, res, next) => backupController.getRestoreJobs(req, res, next));
router.post('/restores/:id/rollback', (req, res, next) => backupController.rollbackRestore(req, res, next));

// ── WEBHOOKS (instance; service अब M18-गेट stub है) ──
router.get('/webhooks', (req, res, next) => webhookController.getAllEndpoints(req, res, next));
router.post('/webhooks', (req, res, next) => webhookController.createEndpoint(req, res, next));
router.put('/webhooks/:id', (req, res, next) => webhookController.updateEndpoint(req, res, next));
router.delete('/webhooks/:id', (req, res, next) => webhookController.deleteEndpoint(req, res, next));
router.patch('/webhooks/:id/toggle', (req, res, next) => webhookController.toggleEndpoint(req, res, next));
router.get('/webhooks/:id/deliveries', (req, res, next) => webhookController.getDeliveries(req, res, next));
router.post('/webhooks/:id/test', (req, res, next) => webhookController.testEndpoint(req, res, next));

export default router;
