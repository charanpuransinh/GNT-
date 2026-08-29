import { Request, Response } from 'express';
import { IntegrationService } from '../services/integration.service';
import { integrationSchema } from '../validators/sync.validators';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

export class IntegrationController {
  static async createIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = integrationSchema.parse(req.body);
      const integration = await IntegrationService.createIntegration({
        ...parsed,
        tenantId: req.tenantId!
      });
      res.status(201).json({ success: true, data: integration });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async getIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const integration = await IntegrationService.getIntegration(id, req.tenantId!);
      if (!integration) return res.status(404).json({ success: false, error: 'Integration not found' });
      res.json({ success: true, data: integration });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async listIntegrations(req: AuthenticatedRequest, res: Response) {
    try {
      const { provider, status } = req.query;
      const integrations = await IntegrationService.listIntegrations(req.tenantId!, {
        provider: provider as string,
        status: status as string
      });
      res.json({ success: true, data: integrations });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const integration = await IntegrationService.updateIntegration(id, req.tenantId!, req.body);
      res.json({ success: true, data: integration });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async deleteIntegration(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await IntegrationService.deleteIntegration(id, req.tenantId!);
      res.json({ success: true, message: 'Integration deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async healthCheck(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await IntegrationService.healthCheck(id, req.tenantId!);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async healthCheckAll(req: AuthenticatedRequest, res: Response) {
    try {
      const results = await IntegrationService.healthCheckAll(req.tenantId!);
      res.json({ success: true, data: results });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
