/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — IMPORT CONTROLLER                       ║
 * ║  Lock Artifact #6 — HTTP Request Handler for Imports           ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import { ImportService } from '../services/importService';
import { QueueService } from '../services/queueService';
import { ImportJob, ImportTemplate, ImportPreview, ImportProgress } from '../types/importExport.types';

export class ImportController {
  private importService = new ImportService();
  private queueService = new QueueService();

  // ── LIST IMPORTS ──
  listImports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { status, entityType, page = '1', limit = '20', search } = req.query;

      const result = await this.importService.listImports({
        tenantId,
        status: status as string,
        entityType: entityType as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
      });

      res.json({
        success: true,
        data: result.items,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (err) {
      next(err);
    }
  };

  // ── GET SINGLE IMPORT ──
  getImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      const job = await this.importService.getImport(tenantId, id);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Import job not found' });
      }

      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  };

  // ── CREATE IMPORT ──
  createImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id || 'system';
      const data = req.body;

      const job = await this.importService.createImport({
        ...data,
        tenantId,
        createdBy: userId,
      });

      res.status(201).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  };

  // ── UPDATE IMPORT ──
  updateImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);
      const updates = req.body;

      const job = await this.importService.updateImport(tenantId, id, updates);
      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  };

  // ── DELETE IMPORT ──
  deleteImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      await this.importService.deleteImport(tenantId, id);
      res.json({ success: true, message: 'Import job deleted' });
    } catch (err) {
      next(err);
    }
  };

  // ── UPLOAD FILE ──
  uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const uploadResult = await this.importService.handleUpload(tenantId, file);
      res.json({ success: true, data: uploadResult });
    } catch (err) {
      next(err);
    }
  };

  // ── PREVIEW IMPORT ──
  previewImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      const preview = await this.importService.generatePreview(tenantId, id);
      res.json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  };

  // ── VALIDATE IMPORT ──
  validateImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      const validation = await this.importService.validateImport(tenantId, id);
      res.json({ success: true, data: validation });
    } catch (err) {
      next(err);
    }
  };

  // ── EXECUTE IMPORT ──
  executeImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      // Queue the import job for async processing
      await this.queueService.enqueueImport(tenantId, id);

      const job = await this.importService.updateImport(tenantId, id, { status: 'processing' });
      res.json({ success: true, data: job, message: 'Import queued for processing' });
    } catch (err) {
      next(err);
    }
  };

  // ── DRY RUN ──
  executeDryRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      const result = await this.importService.executeDryRun(tenantId, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  // ── GET PROGRESS ──
  getProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      const progress = await this.importService.getProgress(tenantId, id);
      res.json({ success: true, data: progress });
    } catch (err) {
      next(err);
    }
  };

  // ── GET ERRORS ──
  getErrors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);
      const { page = '1', limit = '50' } = req.query;

      const errors = await this.importService.getErrors(tenantId, id, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json({ success: true, data: errors });
    } catch (err) {
      next(err);
    }
  };

  // ── DOWNLOAD ERROR REPORT ──
  downloadErrorReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      const report = await this.importService.generateErrorReport(tenantId, id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="import-errors-${id}.csv"`);
      res.send(report);
    } catch (err) {
      next(err);
    }
  };

  // ── CANCEL IMPORT ──
  cancelImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      await this.queueService.cancelJob(id);
      const job = await this.importService.updateImport(tenantId, id, { status: 'failed' });
      res.json({ success: true, data: job, message: 'Import cancelled' });
    } catch (err) {
      next(err);
    }
  };

  // ── RETRY IMPORT ──
  retryImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      await this.queueService.enqueueImport(tenantId, id);
      const job = await this.importService.updateImport(tenantId, id, {
        status: 'pending',
        processedRows: 0,
        successRows: 0,
        failedRows: 0,
        errors: [],
      });

      res.json({ success: true, data: job, message: 'Import retry queued' });
    } catch (err) {
      next(err);
    }
  };

  // ── IMPORT TEMPLATES ──
  listTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { entityType } = req.query;

      const templates = await this.importService.listTemplates(tenantId, entityType as string);
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  };

  getTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      const template = await this.importService.getTemplate(tenantId, id);
      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }
      res.json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  };

  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.user?.id || 'system';

      const template = await this.importService.createTemplate({
        ...req.body,
        tenantId,
        createdBy: userId,
      });
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      const template = await this.importService.updateTemplate(tenantId, id, req.body);
      res.json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const id = String(req.params.id);

      await this.importService.deleteTemplate(tenantId, id);
      res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
      next(err);
    }
  };
}
