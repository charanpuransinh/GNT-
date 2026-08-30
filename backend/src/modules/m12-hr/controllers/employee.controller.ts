// Employee controller — safer error handling
import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { HrEventPublisher } from '../events/hr.events';

export class EmployeeController {
  private service = new EmployeeService();
  private events = new HrEventPublisher();

  async create(req: Request, res: Response) {
    try {
      const employee = await this.service.create(req.body);
      await this.events.publish('EMPLOYEE_CREATED', { employeeId: employee.id, email: employee.email });
      res.status(201).json({ success: true, data: employee });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create employee';
      res.status(400).json({ success: false, error: message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status, departmentId, search } = req.query;
      const result = await this.service.findAll({ page: Number(page), limit: Number(limit), status: status as string, departmentId: departmentId as string, search: search as string });
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch employees';
      res.status(500).json({ success: false, error: message });
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const employee = await this.service.findOne(req.params.id);
      if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
      res.json({ success: true, data: employee });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch employee';
      res.status(500).json({ success: false, error: message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const employee = await this.service.update(req.params.id, req.body);
      await this.events.publish('EMPLOYEE_UPDATED', { employeeId: employee.id, changes: Object.keys(req.body) });
      res.json({ success: true, data: employee });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update employee';
      res.status(400).json({ success: false, error: message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await this.service.remove(req.params.id);
      await this.events.publish('EMPLOYEE_DELETED', { employeeId: req.params.id });
      res.json({ success: true, message: 'Employee deleted' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete employee';
      res.status(400).json({ success: false, error: message });
    }
  }

  async uploadDocument(req: Request, res: Response) {
    try {
      const doc = await this.service.addDocument(req.params.id, req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload document';
      res.status(400).json({ success: false, error: message });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await this.service.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch stats';
      res.status(500).json({ success: false, error: message });
    }
  }
}
