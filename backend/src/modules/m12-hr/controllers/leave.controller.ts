// [LOCK-4] Leave Controller
import { Request, Response } from 'express';
import { LeaveService } from '../services/leave.service';
import { HrEventPublisher } from '../events/hr.events';

export class LeaveController {
  private service = new LeaveService();
  private events = new HrEventPublisher();

  async apply(req: Request, res: Response) {
    try {
      const leave = await this.service.apply(req.body);
      await this.events.publish('LEAVE_APPLIED', { leaveId: leave.id, employeeId: leave.employeeId, days: leave.days });
      res.status(201).json({ success: true, data: leave });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to apply leave';
      res.status(400).json({ success: false, error: message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approvedBy, rejectionReason } = req.body;
      const leave = await this.service.approve(id, approvedBy, rejectionReason);
      await this.events.publish('LEAVE_APPROVED', { leaveId: leave.id, employeeId: leave.employeeId });
      res.json({ success: true, data: leave });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to approve leave';
      res.status(400).json({ success: false, error: message });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approvedBy, rejectionReason } = req.body;
      const leave = await this.service.reject(id, approvedBy, rejectionReason);
      await this.events.publish('LEAVE_REJECTED', { leaveId: leave.id, employeeId: leave.employeeId, reason: rejectionReason });
      res.json({ success: true, data: leave });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reject leave';
      res.status(400).json({ success: false, error: message });
    }
  }

  async getByEmployee(req: Request, res: Response) {
    try {
      const leaves = await this.service.getByEmployee(req.params.employeeId);
      res.json({ success: true, data: leaves });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch leaves';
      res.status(500).json({ success: false, error: message });
    }
  }

  async getBalance(req: Request, res: Response) {
    try {
      const balance = await this.service.getBalance(req.params.employeeId);
      res.json({ success: true, data: balance });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch balance';
      res.status(500).json({ success: false, error: message });
    }
  }

  async getPendingApprovals(req: Request, res: Response) {
    try {
      // moved approver id into body
      const approverId = req.body.approverId as string | undefined;
      const leaves = await this.service.getPendingApprovals(approverId);
      res.json({ success: true, data: leaves });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch pending approvals';
      res.status(500).json({ success: false, error: message });
    }
  }
}
