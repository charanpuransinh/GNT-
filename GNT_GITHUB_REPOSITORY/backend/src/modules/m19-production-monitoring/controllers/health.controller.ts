import { Request, Response } from 'express';
import { HealthService } from '../services/health.service';
import { healthQuerySchema } from '../validators/security.schema';
import { ZodError } from 'zod';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = healthQuerySchema.parse(req.query);
      const result = await this.healthService.checkSystemHealth(companyId);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to check system health' });
    }
  }

  async getDatabaseHealth(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.healthService.checkDatabaseHealth();
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Database health check failed' });
    }
  }

  async getServicesHealth(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.healthService.checkAllServices();
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Services health check failed' });
    }
  }
}
