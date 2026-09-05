// [LOCK-6] Payroll Controller — tenant-scoped
import { Request, Response } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { PayrollService } from '../services/payroll.service';
import { HrEventPublisher } from '../events/hr.events';

export class PayrollController {
  private service = new PayrollService();
  private events = new HrEventPublisher();

  async generate(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const { month, year, employeeIds } = req.body;
      const payrolls = await this.service.generate(tenantId, month, year, employeeIds);
      for (const payroll of payrolls) {
        await this.events.publish('PAYROLL_GENERATED', {
          payrollId: payroll.id, employeeId: payroll.employeeId, amount: payroll.netPay,
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
      const tenantId = requireTenant(req).companyId;
      const payrolls = await this.service.getByEmployee(tenantId, String(req.params.employeeId));
      res.json({ success: true, data: payrolls });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async processPayment(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const payroll = await this.service.markAsPaid(tenantId, String(req.params.id), req.body);
      await this.events.publish('PAYROLL_PAID', {
        payrollId: payroll.id, employeeId: payroll.employeeId, amount: payroll.netPay,
        paymentRef: payroll.paymentTransactionId, targetModule: 'M11'
      });
      res.json({ success: true, data: payroll });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getMonthlySummary(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const { month, year } = req.body || req.query;
      const summary = await this.service.getMonthlySummary(tenantId, Number(month), Number(year));
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
