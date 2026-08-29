import { Request, Response } from 'express';
import { SecurityInternal } from '../services/security.internal';
import { securityEventQuerySchema, anomalyCheckSchema } from '../validators/security.schema';
import { ZodError } from 'zod';

export class SecurityController {
  constructor(private readonly securityInternal: SecurityInternal) {}

  async getSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const filters = securityEventQuerySchema.parse(req.query);
      const result = await this.securityInternal.getSecurityEvents({
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
      const result = await this.securityInternal.detectAnomaly(input);
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
      await this.securityInternal.resolveSecurityEvent(eventId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to resolve event' });
    }
  }
}
