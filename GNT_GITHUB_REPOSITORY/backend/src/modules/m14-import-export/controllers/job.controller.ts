// M14 — Job Controller
import { Request, Response } from 'express';
import { requireTenant, requireUser } from '@/common/middleware/require-tenant';
import { JobService } from '../services/job.service';

const jobService = new JobService();

export class JobController {
  async dashboard(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const data = await jobService.getDashboard(tenantId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async cleanup(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const days = parseInt(req.query.days as string) || 30;
      const result = await jobService.cleanupOldJobs(tenantId, days);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
