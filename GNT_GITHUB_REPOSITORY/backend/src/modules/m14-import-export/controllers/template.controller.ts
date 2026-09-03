import { Request, Response } from 'express';
import { TemplateService } from '../services/template.service';

export class TemplateController {
  static async create(req: Request, res: Response) {
    try {
      const template = await new TemplateService().create(req.body);
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const template = await new TemplateService().update(id, req.body);
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await new TemplateService().delete(id);
      res.json({ success: true, message: 'Template deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const template = await new TemplateService().getById(id);
      if (!template) return res.status(404).json({ error: 'Template not found' });
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { tenantId, entityType } = req.query;
      const templates = await new TemplateService().list(
        tenantId as string,
        entityType as string
      );
      res.json({ success: true, data: templates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getDefault(req: Request, res: Response) {
    try {
      const { tenantId, entityType } = req.query;
      const template = await new TemplateService().getDefault(
        tenantId as string,
        entityType as string
      );
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
