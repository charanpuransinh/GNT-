// [LOCK-3] Attendance Controller — tenant-scoped
import { Request, Response } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { AttendanceService } from '../services/attendance.service';

export class AttendanceController {
  private service = new AttendanceService();

  async checkIn(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const { employeeId, location, notes } = req.body;
      const record = await this.service.checkIn(tenantId, employeeId, { location, notes });
      res.status(201).json({ success: true, data: record });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async checkOut(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const { employeeId, notes } = req.body;
      const record = await this.service.checkOut(tenantId, employeeId, notes);
      res.json({ success: true, data: record });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getByEmployee(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const employeeId = String(req.params.employeeId);
      const { startDate, endDate } = (req.body && req.body.filters) || req.query;
      const records = await this.service.getByEmployee(tenantId, employeeId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json({ success: true, data: records });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMonthlyReport(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const { month, year, departmentId } = req.body || req.query;
      const report = await this.service.getMonthlyReport(tenantId, Number(month), Number(year), departmentId as string);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async bulkUpload(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const result = await this.service.bulkUpload(tenantId, req.body.records);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
