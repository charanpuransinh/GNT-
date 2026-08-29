/**
 * M18 — Integration Controller (HTTP Handlers)
 * Owner: D4-DELTA
 */
import { Request, Response, NextFunction } from 'express';
import { IntegrationService } from '../services/integration.service';
import {
  createIntegrationSchema,
  updateIntegrationSchema,
  integrationIdParamSchema,
  createApiKeySchema,
  testGatewaySchema,
  listIntegrationsQuerySchema,
} from '../validators/integration.schema';

export class IntegrationController {
  constructor(private readonly service: IntegrationService) {}

  async listIntegrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listIntegrationsQuerySchema.parse(req.query);
      const result = await this.service.listIntegrations(query);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = integrationIdParamSchema.parse(req.params);
      const data = await this.service.getIntegrationById(id);
      if (!data) {
        res.status(404).json({ success: false, message: 'Integration not found' });
        return;
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = createIntegrationSchema.parse(req.body);
      const data = await this.service.createIntegration(dto);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = integrationIdParamSchema.parse(req.params);
      const dto = updateIntegrationSchema.parse(req.body);
      const data = await this.service.updateIntegration(id, dto);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = integrationIdParamSchema.parse(req.params);
      const data = await this.service.deleteIntegration(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { integration_id } = testGatewaySchema.parse(req.body);
      const data = await this.service.testIntegrationConnection(integration_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getGatewayStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.query.company_id as string;
      const type = req.query.type as string | undefined;
      if (!companyId) {
        res.status(400).json({ success: false, message: 'company_id required' });
        return;
      }
      const data = await this.service.getGatewayStatus(companyId, type as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async generateApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = createApiKeySchema.parse(req.body);
      const data = await this.service.generateApiKey(dto);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listApiKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.query.company_id as string;
      if (!companyId) {
        res.status(400).json({ success: false, message: 'company_id required' });
        return;
      }
      const data = await this.service.listApiKeys(companyId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async revokeApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = integrationIdParamSchema.parse(req.params);
      await this.service.revokeApiKey(id);
      res.json({ success: true, message: 'API key revoked' });
    } catch (err) {
      next(err);
    }
  }
}
