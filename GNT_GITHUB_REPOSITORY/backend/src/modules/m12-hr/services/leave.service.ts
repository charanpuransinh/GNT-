// [LOCK-9] Leave Service — tenant-scoped
import { prisma } from '@/common/config/prisma';

export class LeaveService {
  private async assertEmployeeOwned(tenantId: string, employeeId: string): Promise<void> {
    const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId }, select: { id: true } });
    if (!emp) throw new Error('Employee not found');
  }

  async apply(tenantId: string, data: any) {
    await this.assertEmployeeOwned(tenantId, data.employeeId);
    const leaveType = await prisma.leaveType.findFirst({ where: { id: data.leaveTypeId, tenantId } });
    if (!leaveType) throw new Error('Leave type not found');
    if (!data.reason) throw new Error('Reason required');
    const days = this.calculateDays(data.startDate, data.endDate);
    const leaveNumber = await this.generateLeaveNumber();
    return prisma.leave.create({
      data: {
        employeeId: data.employeeId,
        leaveTypeId: leaveType.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        daysRequested: days,
        reason: data.reason,
        status: 'PENDING',
        tenantId,
        leaveNumber,
      },
    });
  }

  async approve(tenantId: string, id: string, approvedById: string) {
    const result = await prisma.leave.updateMany({
      where: { id, tenantId },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() }
    });
    if (result.count === 0) throw new Error('Leave not found');
    const leave = await prisma.leave.findFirst({ where: { id, tenantId } });
    if (!leave) throw new Error('Leave not found');
    await prisma.leaveBalance.updateMany({ where: { employeeId: leave.employeeId }, data: { used: { increment: Number(leave.daysRequested) } } });
    await prisma.employee.updateMany({ where: { id: leave.employeeId, tenantId }, data: { employmentStatus: 'ON_LEAVE' } });
    return leave;
  }

  async reject(tenantId: string, id: string, approvedById: string, rejectionReason: string) {
    const result = await prisma.leave.updateMany({
      where: { id, tenantId },
      data: { status: 'REJECTED', approvedById, approvedAt: new Date(), rejectionReason }
    });
    if (result.count === 0) throw new Error('Leave not found');
    const rejected = await prisma.leave.findFirst({ where: { id, tenantId } });
    if (!rejected) throw new Error('Leave not found');
    return rejected;
  }

  async getByEmployee(tenantId: string, employeeId: string) {
    return prisma.leave.findMany({ where: { employeeId, tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getBalance(tenantId: string, employeeId: string) {
    const year = new Date().getFullYear();
    let balance = await prisma.leaveBalance.findUnique({ where: { employeeId_year: { employeeId, year } } });
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: { employeeId, year, annual: 20, sick: 10, casual: 5, unpaid: 0 }
      });
    }
    return balance;
  }

  async getPendingApprovals(tenantId: string, approverId?: string) {
    return prisma.leave.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  private calculateDays(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  private async generateLeaveNumber(): Promise<string> {
    const count = await prisma.leave.count();
    const year = new Date().getFullYear();
    return `LEV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
