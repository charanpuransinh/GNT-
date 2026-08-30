import { Request, Response } from 'express';
import { ConflictService } from '../services/conflict.service';
import { conflictResolutionSchema, bulkConflictResolutionSchema } from '../validators/sync.validators';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

export class ConflictController {
  static async listConflicts(req: AuthenticatedRequest, res: Response) {
    try {
      const { syncJobId, entityType, status, limit } = req.query;
      const conflicts = await ConflictService.listConflicts(req.tenantId!, {
        syncJobId: syncJobId as string,
        entityType: entityType as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      });
      res.json({ success: true, data: conflicts });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to list conflicts';
      res.status(500).json({ success: false, error: message });
    }
  }

  static async getConflict(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const conflict = await ConflictService.getConflict(id, req.tenantId!);
      if (!conflict) return res.status(404).json({ success: false, error: 'Conflict not found' });
      res.json({ success: true, data: conflict });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get conflict';
      res.status(500).json({ success: false, error: message });
    }
  }

  static async resolveConflict(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = conflictResolutionSchema.parse(req.body);
      const conflict = await ConflictService.resolveConflict(parsed, req.tenantId!);
      res.json({ success: true, data: conflict });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to resolve conflict';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async bulkResolve(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = bulkConflictResolutionSchema.parse(req.body);
      const result = await ConflictService.bulkResolve(parsed, req.tenantId!);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to bulk resolve conflicts';
      res.status(400).json({ success: false, error: message });
    }
  }

  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { syncJobId } = req.query;
      const stats = await ConflictService.getConflictStats(req.tenantId!, syncJobId as string);
      res.json({ success: true, data: stats });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get stats';
      res.status(500).json({ success: false, error: message });
    }
  }

  static async autoResolve(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      const resolved = await ConflictService.autoResolveConflicts(jobId, req.tenantId!);
      res.json({ success: true, data: { resolved } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to auto-resolve conflicts';
      res.status(500).json({ success: false, error: message });
    }
  }
}
