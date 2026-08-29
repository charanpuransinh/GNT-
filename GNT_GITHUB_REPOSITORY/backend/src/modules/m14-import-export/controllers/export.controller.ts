// M14 — Export Controller
// Lock: LOCK_10_CONTROLLER
import { Request, Response } from 'express';
import { ExportService } from '../services/export.service';

const exportService = new ExportService();

export class ExportController {
  async create(req: Request, res: Response) {
    try {
      const { module, entityType, format, filters, columns, sort, templateId } = req.body;
      const tenantId = (req as any).tenantId;
      const userId = (req as any).userId;

      const jobId = await exportService.createExportJob({
        module, entityType, format, filters, columns, sort, templateId,
        tenantId, userId
      });
      res.status(202).json({ success: true, jobId, message: 'Export job queued' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const tenantId = (req as any).tenantId;
      const job = await exportService.getExportJob(jobId, tenantId);
      res.json(job);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async listJobs(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const { module, entityType, status } = req.query;
      const jobs = await exportService.listExportJobs(tenantId, {
        ...(module && { module: String(module) }),
        ...(entityType && { entityType: String(entityType) }),
        ...(status && { status: status as any }),
      });
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const tenantId = (req as any).tenantId;
      await exportService.cancelExportJob(jobId, tenantId);
      res.json({ success: true, message: 'Export cancelled' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async download(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const tenantId = (req as any).tenantId;
      const file = await exportService.downloadExport(jobId, tenantId);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.send(file.buffer);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
