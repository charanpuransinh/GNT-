import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { auditQuerySchema, loginHistoryQuerySchema } from '../validators/security.schema';
import { ZodError } from 'zod';

export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters = auditQuerySchema.parse(req.query);
      const result = await this.auditService.queryAuditLogs({
        ...filters,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      });
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.issues });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }

  async getLoginHistory(req: Request, res: Response): Promise<void> {
    try {
      const filters = loginHistoryQuerySchema.parse(req.query);
      const result = await this.auditService.getLoginHistory(
        filters.companyId, filters.userId, filters.status,
      );
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.issues });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch login history' });
    }
  }

  async getPermissionChanges(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, userId } = req.query as { companyId: string; userId?: string };
      if (!companyId) {
        res.status(400).json({ error: 'companyId required' });
        return;
      }
      const result = await this.auditService.queryAuditLogs({
        companyId, module: 'permissions', ...(userId && { userId }), page: 1, limit: 100,
      });
      res.json(result.data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch permission changes' });
    }
  }
}
