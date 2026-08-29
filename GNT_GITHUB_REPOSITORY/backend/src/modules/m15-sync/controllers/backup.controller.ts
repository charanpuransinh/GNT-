// M15 Sync Module — Backup Controller
// GNT Team C | Modular Monolith Architecture

import { Request, Response, NextFunction } from 'express';
import { BackupService } from '../services/backup.service';
import { AppError } from '../utils/sync.errors';

export class BackupController {
  constructor(private backupService: BackupService) {}

  async getAllBackups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.backupService.getAllBackups(tenantId, { page, limit });
      res.json({ success: true, data: result.backups, meta: result.meta });
    } catch (err) { next(err); }
  }

  async getBackupById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const backup = await this.backupService.getBackupById(tenantId, req.params.id);
      if (!backup) throw new AppError('BACKUP_NOT_FOUND', 'Backup not found', 404);
      res.json({ success: true, data: backup });
    } catch (err) { next(err); }
  }

  async createBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const backup = await this.backupService.createBackup(tenantId, req.body);
      res.status(202).json({ success: true, data: backup });
    } catch (err) { next(err); }
  }

  async deleteBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      await this.backupService.deleteBackup(tenantId, req.params.id);
      res.json({ success: true, data: null });
    } catch (err) { next(err); }
  }

  async restoreBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const restoreJob = await this.backupService.restoreBackup(tenantId, req.params.id);
      res.status(202).json({ success: true, data: restoreJob });
    } catch (err) { next(err); }
  }

  async getRestoreJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.backupService.getRestoreJobs(tenantId, { page, limit });
      res.json({ success: true, data: result.jobs, meta: result.meta });
    } catch (err) { next(err); }
  }

  async rollbackRestore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const job = await this.backupService.rollbackRestore(tenantId, req.params.id, req.body.reason);
      res.json({ success: true, data: job });
    } catch (err) { next(err); }
  }
}
