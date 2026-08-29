/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — EXPORT CONTROLLER                       ║
 * ║  Lock Artifact #7 — HTTP Request Handler for Exports         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import { ExportService } from '../services/exportService';
import { QueueService } from '../services/queueService';

export class ExportController {
  private exportService = new ExportService();
  private queueService = new QueueService();

  // ── LIST EXPORTS ──
  listExports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { status, entityType, page = '1', limit = '20', search } = req.query;

      const result = await this.exportService.listExports({
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

  // ── GET SINGLE EXPORT ──
  getExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      const job = await this.exportService.getExport(tenantId, id);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Export job not found' });
      }

      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  };

  // ── CREATE EXPORT ──
  createExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id || 'system';
      const data = req.body;

      const job = await this.exportService.createExport({
        ...data,
        tenantId,
        createdBy: userId,
      });

      res.status(201).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  };

  // ── UPDATE EXPORT ──
  updateExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;
      const updates = req.body;

      const job = await this.exportService.updateExport(tenantId, id, updates);
      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  };

  // ── DELETE EXPORT ──
  deleteExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      await this.exportService.deleteExport(tenantId, id);
      res.json({ success: true, message: 'Export job deleted' });
    } catch (err) {
      next(err);
    }
  };

  // ── EXECUTE EXPORT ──
  executeExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      await this.queueService.enqueueExport(tenantId, id);
      const job = await this.exportService.updateExport(tenantId, id, { status: 'processing' });

      res.json({ success: true, data: job, message: 'Export queued for processing' });
    } catch (err) {
      next(err);
    }
  };

  // ── GET PROGRESS ──
  getProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      const progress = await this.exportService.getProgress(tenantId, id);
      res.json({ success: true, data: progress });
    } catch (err) {
      next(err);
    }
  };

  // ── DOWNLOAD EXPORT ──
  downloadExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      const job = await this.exportService.getExport(tenantId, id);
      if (!job || !job.fileUrl) {
        return res.status(404).json({ success: false, message: 'Export file not found' });
      }

      // In production: stream from S3 / storage
      res.redirect(job.fileUrl);
    } catch (err) {
      next(err);
    }
  };

  // ── CANCEL EXPORT ──
  cancelExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      await this.queueService.cancelJob(id);
      const job = await this.exportService.updateExport(tenantId, id, { status: 'failed' });
      res.json({ success: true, data: job, message: 'Export cancelled' });
    } catch (err) {
      next(err);
    }
  };

  // ── EXPORT TEMPLATES ──
  listTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { entityType } = req.query;

      const templates = await this.exportService.listTemplates(tenantId, entityType as string);
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  };

  getTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      const template = await this.exportService.getTemplate(tenantId, id);
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
      const userId = (req as any).user?.id || 'system';

      const template = await this.exportService.createTemplate({
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
      const { id } = req.params;

      const template = await this.exportService.updateTemplate(tenantId, id, req.body);
      res.json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const { id } = req.params;

      await this.exportService.deleteTemplate(tenantId, id);
      res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
      next(err);
    }
  };
}
