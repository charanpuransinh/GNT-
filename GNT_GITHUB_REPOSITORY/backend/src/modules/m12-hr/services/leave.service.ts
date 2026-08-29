// [LOCK-9] Leave Service
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class LeaveService {
  async apply(data: any) {
    const days = this.calculateDays(data.startDate, data.endDate);
    const balance = await this.getBalance(data.employeeId);
    const field = data.type.toLowerCase();
    if (balance && (balance as any)[field] < days) {
      throw new Error(`Insufficient ${data.type} leave balance`);
    }
    return prisma.leave.create({ data: { ...data, days, status: 'PENDING' } });
  }

  async approve(id: string, approvedBy: string, rejectionReason?: string) {
    const leave = await prisma.leave.update({ where: { id }, data: { status: 'APPROVED', approvedBy, approvedAt: new Date() } });
    await prisma.leaveBalance.updateMany({ where: { employeeId: leave.employeeId }, data: { used: { increment: leave.days } } });
    await prisma.employee.update({ where: { id: leave.employeeId }, data: { status: 'ON_LEAVE' } });
    return leave;
  }

  async reject(id: string, approvedBy: string, rejectionReason: string) {
    return prisma.leave.update({ where: { id }, data: { status: 'REJECTED', approvedBy, approvedAt: new Date(), rejectionReason } });
  }

  async getByEmployee(employeeId: string) {
    return prisma.leave.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
  }

  async getBalance(employeeId: string) {
    const year = new Date().getFullYear();
    let balance = await prisma.leaveBalance.findUnique({ where: { employeeId_year: { employeeId, year } } });
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: { employeeId, year, annual: 20, sick: 10, casual: 5, unpaid: 0 }
      });
    }
    return balance;
  }

  async getPendingApprovals(approverId?: string) {
    return prisma.leave.findMany({
      where: { status: 'PENDING' },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  private calculateDays(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
}
