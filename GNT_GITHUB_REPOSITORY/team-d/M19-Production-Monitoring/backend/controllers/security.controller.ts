import { Request, Response } from 'express';
import { SecurityService } from '../services/security.service';
import { securityEventQuerySchema, anomalyCheckSchema } from '../validators/security.schema';
import { ZodError } from 'zod';

export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  async getSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const filters = securityEventQuerySchema.parse(req.query);
      const result = await this.securityService.getSecurityEvents({
        ...filters,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      });
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch security events' });
    }
  }

  async triggerAnomalyCheck(req: Request, res: Response): Promise<void> {
    try {
      const input = anomalyCheckSchema.parse(req.body);
      const result = await this.securityService.reportEvent(input);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Anomaly check failed' });
    }
  }

  async resolveEvent(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      await this.securityService.resolveSecurityEvent(eventId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to resolve event' });
    }
  }
}
