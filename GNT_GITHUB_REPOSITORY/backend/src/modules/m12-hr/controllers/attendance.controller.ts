// [LOCK-3] Attendance Controller
import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

export class AttendanceController {
  private service = new AttendanceService();

  async checkIn(req: Request, res: Response) {
    try {
      // accept employeeId, location, notes in POST body to avoid leaking filters in URL
      const { employeeId, location, notes } = req.body;
      const record = await this.service.checkIn(employeeId, { location, notes });
      res.status(201).json({ success: true, data: record });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async checkOut(req: Request, res: Response) {
    try {
      const { employeeId, notes } = req.body;
      const record = await this.service.checkOut(employeeId, notes);
      res.json({ success: true, data: record });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getByEmployee(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      // prefer POST with startDate/endDate in body.filters; fall back to query for compat
      const { startDate, endDate } = (req.body && req.body.filters) || req.query;
      const records = await this.service.getByEmployee(employeeId, {
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
      // accept sensitive filters via POST body (month/year/departmentId); support query for backward compatibility
      const { month, year, departmentId } = req.body || req.query;
      const report = await this.service.getMonthlyReport(Number(month), Number(year), departmentId as string);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async bulkUpload(req: Request, res: Response) {
    try {
      const result = await this.service.bulkUpload(req.body.records);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
