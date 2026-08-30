import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

export class AttendanceController {
  private service = new AttendanceService();

  async checkIn(req: Request, res: Response) {
    try {
      const { employeeId, location, notes } = req.body;
      const record = await this.service.checkIn(employeeId, { location, notes });
      res.status(201).json({ success: true, data: record });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to check in';
      res.status(400).json({ success: false, error: message });
    }
  }

  async checkOut(req: Request, res: Response) {
    try {
      const { employeeId, notes } = req.body;
      const record = await this.service.checkOut(employeeId, notes);
      res.json({ success: true, data: record });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to check out';
      res.status(400).json({ success: false, error: message });
    }
  }

  async getByEmployee(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.body; // moved sensitive filters to body
      const records = await this.service.getByEmployee(employeeId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json({ success: true, data: records });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch attendance';
      res.status(500).json({ success: false, error: message });
    }
  }

  async getMonthlyReport(req: Request, res: Response) {
    try {
      const { month, year, departmentId } = req.body; // moved to body
      const report = await this.service.getMonthlyReport(Number(month), Number(year), departmentId as string);
      res.json({ success: true, data: report });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate monthly report';
      res.status(500).json({ success: false, error: message });
    }
  }

  async bulkUpload(req: Request, res: Response) {
    try {
      const result = await this.service.bulkUpload(req.body.records);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload attendance records';
      res.status(400).json({ success: false, error: message });
    }
  }
}
