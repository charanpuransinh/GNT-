// [LOCK-4] Leave Controller — tenant-scoped
import { Request, Response } from 'express';
import { requireTenant, requireUser } from '@/common/middleware/require-tenant';
import { LeaveService } from '../services/leave.service';
import { HrEventPublisher } from '../events/hr.events';

export class LeaveController {
  private service = new LeaveService();
  private events = new HrEventPublisher();

  async apply(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const leave = await this.service.apply(tenantId, req.body);
      await this.events.publish('LEAVE_APPLIED', { leaveId: leave.id, employeeId: leave.employeeId, days: leave.daysRequested });
      res.status(201).json({ success: true, data: leave });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const id = String(req.params.id);
      // approver की पहचान auth token से — body से कभी नहीं (किसी और के नाम से approve रोकने के लिए)
      const approvedById = requireUser(req).id;
      const leave = await this.service.approve(tenantId, id, approvedById);
      await this.events.publish('LEAVE_APPROVED', { leaveId: leave.id, employeeId: leave.employeeId });
      res.json({ success: true, data: leave });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const id = String(req.params.id);
      const approvedById = requireUser(req).id;
      const rejectionReason = req.body?.rejectionReason as string | undefined;
      const leave = await this.service.reject(tenantId, id, approvedById, rejectionReason ?? 'Rejected');
      await this.events.publish('LEAVE_REJECTED', { leaveId: leave.id, employeeId: leave.employeeId, reason: rejectionReason });
      res.json({ success: true, data: leave });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getByEmployee(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const leaves = await this.service.getByEmployee(tenantId, String(req.params.employeeId));
      res.json({ success: true, data: leaves });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getBalance(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const balance = await this.service.getBalance(tenantId, String(req.params.employeeId));
      res.json({ success: true, data: balance });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPendingApprovals(req: Request, res: Response) {
    try {
      const tenantId = requireTenant(req).companyId;
      const leaves = await this.service.getPendingApprovals(tenantId, req.body?.approverId as string | undefined);
      res.json({ success: true, data: leaves });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
