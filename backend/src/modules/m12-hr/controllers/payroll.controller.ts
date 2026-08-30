// [LOCK-6] Payroll Controller
import { Request, Response } from 'express';
import { PayrollService } from '../services/payroll.service';
import { HrEventPublisher } from '../events/hr.events';

export class PayrollController {
  private service = new PayrollService();
  private events = new HrEventPublisher();

  async generate(req: Request, res: Response) {
    try {
      const { month, year, employeeIds } = req.body;
      const payrolls = await this.service.generate(month, year, employeeIds);
      for (const payroll of payrolls) {
        await this.events.publish('PAYROLL_GENERATED', {
          payrollId: payroll.id, employeeId: payroll.employeeId, amount: payroll.netSalary,
          month, year, targetModule: 'M11'
        });
      }
      res.status(201).json({ success: true, data: payrolls });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getByEmployee(req: Request, res: Response) {
    try {
      const payrolls = await this.service.getByEmployee(req.params.employeeId);
      res.json({ success: true, data: payrolls });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async processPayment(req: Request, res: Response) {
    try {
      const payroll = await this.service.markAsPaid(req.params.id, req.body);
      await this.events.publish('PAYROLL_PAID', {
        payrollId: payroll.id, employeeId: payroll.employeeId, amount: payroll.netSalary,
        paymentRef: payroll.paymentRef, targetModule: 'M11'
      });
      res.json({ success: true, data: payroll });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getMonthlySummary(req: Request, res: Response) {
    try {
      const { month, year } = req.body; // moved to body
      const summary = await this.service.getMonthlySummary(Number(month), Number(year));
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
