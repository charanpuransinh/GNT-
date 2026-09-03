// M14 — Import Controller
// Lock: LOCK_09_CONTROLLER
import { Request, Response } from 'express';
import { requireTenant, requireUser } from '@/common/middleware/require-tenant';
import { ImportService } from '../services/import.service';
import { TemplateService } from '../services/template.service';

const importService = ImportService;
const templateService = new TemplateService();

export class ImportController {
  async upload(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      const { module, entityType, templateId, mappingOverride, dryRun } = req.body;
      const tenantId = requireTenant(req).companyId;
      const userId = requireUser(req).id;

      let mapping = mappingOverride ? JSON.parse(mappingOverride) : undefined;
      if (templateId && !mapping) {
        const tpl = await templateService.getTemplateById(templateId, tenantId);
        mapping = tpl.mappings as never;
      }

      const jobId = await importService.createImportJob({
        fileBuffer: file.buffer,
        fileType: file.mimetype.includes('csv') ? 'csv' : file.mimetype.includes('sheet') ? 'xlsx' : 'json',
        module,
        entityType,
        templateId,
        mappingOverride: mapping,
        tenantId,
        userId,
        options: { dryRun: dryRun === 'true' }
      });

      res.status(202).json({ success: true, jobId, message: 'Import job queued' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async validate(req: Request, res: Response) {
    try {
      const jobId = String(req.params.jobId);
      const tenantId = requireTenant(req).companyId;
      const result = await importService.validateImport(jobId, tenantId as unknown as never);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getJob(req: Request, res: Response) {
    try {
      const jobId = String(req.params.jobId);
      const tenantId = requireTenant(req).companyId;
      const job = await importService.getImportJob(jobId, tenantId as unknown as never);
      res.json(job);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async listJobs(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const { module, entityType, status } = req.query;
      const jobs = await importService.listImportJobs(tenantId, {
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
      const jobId = String(req.params.jobId);
      const tenantId = requireTenant(req).companyId;
      await importService.cancelImportJob(jobId, tenantId as unknown as never);
      res.json({ success: true, message: 'Job cancelled' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async retry(req: Request, res: Response) {
    try {
      const jobId = String(req.params.jobId);
      const tenantId = requireTenant(req).companyId;
      const newJobId = await importService.retryImportJob(jobId, tenantId);
      res.json({ success: true, jobId: newJobId, message: 'Job retried' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
