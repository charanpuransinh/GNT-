import { Request, Response } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { ConflictService } from '../services/conflict.service';
import {
  conflictResolutionSchema,
  bulkConflictResolutionSchema
} from '../validators/sync.validators';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

export class ConflictController {
  constructor(private conflictService: ConflictService) {}

  async listConflicts(req: AuthenticatedRequest, res: Response) {
    try {
      const { syncJobId, entityType, status, limit } = req.query;
      const result = await this.conflictService.getAllConflicts(requireTenant(req).companyId, {
        page: 1,
        limit: limit ? parseInt(String(limit)) : 20,
        status: status as string | undefined,
        entityType: entityType as string | undefined
      });
      res.json({ success: true, data: result.conflicts, meta: result.meta });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await this.conflictService.getConflictStats(requireTenant(req).companyId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getConflict(req: AuthenticatedRequest, res: Response) {
    try {
      const conflict = await this.conflictService.getConflictById(requireTenant(req).companyId, String(req.params.id));
      if (!conflict) return res.status(404).json({ success: false, error: 'Conflict not found' });
      res.json({ success: true, data: conflict });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async resolveConflict(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = conflictResolutionSchema.parse(req.body);
      const conflict = await this.conflictService.resolveConflict(
        requireTenant(req).companyId,
        String(req.params.id),
        { resolution: parsed.resolution, mergedValue: parsed.mergedValue },
        parsed.resolvedBy
      );
      res.json({ success: true, data: conflict });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async bulkResolve(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = bulkConflictResolutionSchema.parse(req.body);
      const resolved: string[] = [];
      for (const conflictId of parsed.conflictIds) {
        await this.conflictService.resolveConflict(
          requireTenant(req).companyId,
          conflictId,
          { resolution: parsed.resolution as 'INTERNAL_WINS' | 'EXTERNAL_WINS' | 'MERGED' | 'MANUAL' },
          parsed.resolvedBy
        );
        resolved.push(conflictId);
      }
      res.json({ success: true, data: { resolved } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async autoResolve(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;
      // Auto-resolve: सारे PENDING conflicts को INTERNAL_WINS से निपटाता है।
      const conflicts = await this.conflictService.getAllConflicts(requireTenant(req).companyId, {
        page: 1,
        limit: 1000,
        status: 'PENDING'
      });
      let resolved = 0;
      for (const c of conflicts.conflicts) {
        await this.conflictService.resolveConflict(requireTenant(req).companyId, c.id, { resolution: 'INTERNAL_WINS' }, 'system');
        resolved++;
      }
      res.json({ success: true, data: { jobId, resolved } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
