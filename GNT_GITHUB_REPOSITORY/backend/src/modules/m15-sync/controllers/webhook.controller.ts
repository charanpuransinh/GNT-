// M15 Sync Module — Webhook Controller
// GNT Team C | Modular Monolith Architecture

import { Request, Response, NextFunction } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { WebhookService } from '../services/webhook.service';
import { AppError } from '../utils/sync.errors';

export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  async getAllEndpoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req).companyId;
      const result = await this.webhookService.getAllEndpoints(tenantId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async createEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req).companyId;
      const endpoint = await this.webhookService.createEndpoint(tenantId, req.body);
      res.status(201).json({ success: true, data: endpoint });
    } catch (err) { next(err); }
  }

  async updateEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req).companyId;
      const endpoint = await this.webhookService.updateEndpoint(tenantId, String(req.params.id), req.body);
      res.json({ success: true, data: endpoint });
    } catch (err) { next(err); }
  }

  async deleteEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req).companyId;
      await this.webhookService.deleteEndpoint(tenantId, String(req.params.id));
      res.json({ success: true, data: null });
    } catch (err) { next(err); }
  }

  async toggleEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req).companyId;
      const endpoint = await this.webhookService.toggleEndpoint(tenantId, String(req.params.id));
      res.json({ success: true, data: endpoint });
    } catch (err) { next(err); }
  }

  async getDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req).companyId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.webhookService.getDeliveries(tenantId, String(req.params.id), { page, limit });
      res.json({ success: true, data: result.deliveries, meta: result.meta });
    } catch (err) { next(err); }
  }

  async testEndpoint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = requireTenant(req).companyId;
      const result = await this.webhookService.testEndpoint(tenantId, String(req.params.id));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}
