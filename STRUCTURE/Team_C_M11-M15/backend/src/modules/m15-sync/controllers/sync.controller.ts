import { Request, Response } from 'express';
import { SyncService } from '../services/sync.service';
import {
  createSyncConfigSchema,
  updateSyncConfigSchema,
  triggerSyncSchema,
  syncEntitySchema
} from '../validators/sync.validators';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

export class SyncController {
  // ── Config CRUD ───────────────────────────────────────────

  static async createConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = createSyncConfigSchema.parse(req.body);
      const config = await SyncService.createConfig(parsed, req.tenantId!);
      res.status(201).json({ success: true, data: config });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const config = await SyncService.getConfig(id, req.tenantId!);
      if (!config) return res.status(404).json({ success: false, error: 'Config not found' });
      res.json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async listConfigs(req: AuthenticatedRequest, res: Response) {
    try {
      const { sourceSystem, status } = req.query;
      const configs = await SyncService.listConfigs(req.tenantId!, {
        sourceSystem: sourceSystem as string,
        status: status as string
      });
      res.json({ success: true, data: configs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateSyncConfigSchema.parse(req.body);
      const config = await SyncService.updateConfig(id, req.tenantId!, parsed);
      res.json({ success: true, data: config });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await SyncService.deleteConfig(id, req.tenantId!);
      res.json({ success: true, message: 'Config deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ── Sync Jobs ─────────────────────────────────────────────

  static async triggerSync(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = triggerSyncSchema.parse(req.body);
      const job = await SyncService.triggerSync(parsed, req.tenantId!, req.user?.id);
      res.status(202).json({ success: true, data: job });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async previewSync(req: AuthenticatedRequest, res: Response) {
    try {
      const { configId } = req.params;
      const preview = await SyncService.previewSync(configId, req.tenantId!);
      res.json({ success: true, data: preview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async syncEntity(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = syncEntitySchema.parse(req.body);
      const job = await SyncService.syncEntity(parsed, req.tenantId!, req.user?.id);
      res.status(202).json({ success: true, data: job });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getJobStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await SyncService.getJobStatus(jobId, req.tenantId!);
      if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
      res.json({ success: true, data: job });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
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
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async cancelJob(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await SyncService.cancelJob(jobId, req.tenantId!);
      res.json({ success: true, data: job });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getJobProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      const progress = await SyncService.getJobProgress(jobId);
      if (!progress) return res.status(404).json({ success: false, error: 'Job not found' });
      res.json({ success: true, data: progress });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ── WebSocket-style SSE Progress ──────────────────────────

  static async streamProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const unsubscribe = SyncService.onProgress((progress) => {
        if (progress.jobId === jobId) {
          res.write(`data: ${JSON.stringify(progress)}\n\n`);
          if (progress.status === 'COMPLETED' || progress.status === 'FAILED' || progress.status === 'CANCELLED') {
            unsubscribe();
            res.end();
          }
        }
      });

      req.on('close', unsubscribe);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
