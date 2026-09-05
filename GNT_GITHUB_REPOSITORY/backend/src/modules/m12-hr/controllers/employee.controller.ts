// [LOCK-2] Employee Controller — tenant-scoped
import { Request, Response } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { EmployeeService } from '../services/employee.service';
import { HrEventPublisher } from '../events/hr.events';

export class EmployeeController {
  private service = new EmployeeService();
  private events = new HrEventPublisher();

  async create(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const employee = await this.service.create(tenantId, req.body);
      await this.events.publish('EMPLOYEE_CREATED', { employeeId: employee.id, email: employee.email });
      res.status(201).json({ success: true, data: employee });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const { page = 1, limit = 20, status, departmentId, search } = req.query;
      const result = await this.service.findAll(tenantId, {
        page: Number(page), limit: Number(limit),
        status: status as string, departmentId: departmentId as string, search: search as string
      });
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const employee = await this.service.findOne(tenantId, String(req.params.id));
      if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
      res.json({ success: true, data: employee });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const employee = await this.service.update(tenantId, String(req.params.id), req.body);
      await this.events.publish('EMPLOYEE_UPDATED', { employeeId: employee.id, changes: Object.keys(req.body) });
      res.json({ success: true, data: employee });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      await this.service.remove(tenantId, String(req.params.id));
      await this.events.publish('EMPLOYEE_DELETED', { employeeId: String(req.params.id) });
      res.json({ success: true, message: 'Employee deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async uploadDocument(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const doc = await this.service.addDocument(tenantId, String(req.params.id), req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const stats = await this.service.getDashboardStats(tenantId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
