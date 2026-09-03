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
        res.status(400).json({ error: 'Validation failed', details: error.issues });
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
        res.status(400).json({ error: 'Validation failed', details: error.issues });
        return;
      }
      res.status(500).json({ error: 'Anomaly check failed' });
    }
  }

  async resolveEvent(req: Request, res: Response): Promise<void> {
    try {
      const eventId = String(req.params.eventId);
      const companyId = req.tenant?.companyId ?? (req.user?.companyId as string);
      if (!companyId) {
        res.status(400).json({ error: 'company_id required' });
        return;
      }
      const done = await this.securityService.resolveSecurityEvent(eventId, companyId);
      if (!done) {
        // दूसरी कंपनी की event या है ही नहीं — दोनों हाल में 404 (जानकारी लीक न हो)
        res.status(404).json({ error: 'Security event not found' });
        return;
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to resolve event' });
    }
  }
}
