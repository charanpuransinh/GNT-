// [LOCK-5] Department Controller — tenant-scoped
import { Request, Response } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { DepartmentService } from '../services/department.service';

export class DepartmentController {
  private service = new DepartmentService();

  async create(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const dept = await this.service.create(tenantId, req.body);
      res.status(201).json({ success: true, data: dept });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const depts = await this.service.findAll(tenantId);
      res.json({ success: true, data: depts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const dept = await this.service.update(tenantId, String(req.params.id), req.body);
      res.json({ success: true, data: dept });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      await this.service.remove(tenantId, String(req.params.id));
      res.json({ success: true, message: 'Department deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getTree(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const tree = await this.service.getDepartmentTree(tenantId);
      res.json({ success: true, data: tree });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
