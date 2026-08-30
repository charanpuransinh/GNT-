import { Request, Response } from 'express';
import { SyncService } from '../services/sync.service';
import { triggerSyncSchema, syncEntitySchema } from '../validators/sync.validators';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

export class SyncController {
  static async getConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const config = await SyncService.getConfig(id, req.tenantId!);
      res.json({ success: true, data: config });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch config';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async deleteConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await SyncService.deleteConfig(id, req.tenantId!);
      res.json({ success: true, message: 'Config deleted' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete config';
      res.status(500).json({ success: false, error: message });
    }
  }

  static async triggerSync(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = triggerSyncSchema.parse(req.body);
      const job = await SyncService.triggerSync(parsed, req.tenantId!, req.user?.id);
      res.status(202).json({ success: true, data: job });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to trigger sync';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async previewSync(req: AuthenticatedRequest, res: Response) {
    try {
      const { configId } = req.params;
      const preview = await SyncService.previewSync(configId, req.tenantId!);
      res.json({ success: true, data: preview });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to preview sync';
      res.status(500).json({ success: false, error: message });
    }
  }

  static async syncEntity(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = syncEntitySchema.parse(req.body);
      const job = await SyncService.syncEntity(parsed, req.tenantId!, req.user?.id);
      res.status(202).json({ success: true, data: job });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sync entity';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getJobStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await SyncService.getJobStatus(jobId, req.tenantId!);
      if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
      res.json({ success: true, data: job });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get job status';
      res.status(500).json({ success: false, error: message });
    }
  }

  static async listJobs(req: AuthenticatedRequest, res: Response) {
    try {
      const { syncConfigId, status, limit } = req.query;
      const jobs = await SyncService.listJobs(req.tenantId!, {
        syncConfigId: syncConfigId as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({ success: true, data: jobs });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to list jobs';
      res.status(500).json({ success: false, error: message });
    }
  }

  static async cancelJob(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await SyncService.cancelJob(jobId, req.tenantId!);
      res.json({ success: true, data: job });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel job';
      res.status(400).json({ success: false, error: message });
    }
  }
}
