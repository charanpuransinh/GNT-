// [LOCK-11] Payroll Service — tenant-scoped (schema Payroll model के असली fields से)
import { prisma } from '@/common/config/prisma';

export class PayrollService {
  async generate(tenantId: string, month: number, year: number, employeeIds?: string[]) {
    const where: Record<string, unknown> = { tenantId, employmentStatus: 'ACTIVE' };
    if (employeeIds?.length) where.id = { in: employeeIds };
    const employees = await prisma.employee.findMany({ where: where as never, include: { department: true } });
    const payrolls = [];
    for (const emp of employees) {
      const existing = await prisma.payroll.findUnique({ where: { employeeId_month_year: { employeeId: emp.id, month, year } } });
      if (existing) continue;
      const basicSalary = Number(emp.basicSalary);
      const hra = basicSalary * 0.1;
      const pfEmployee = basicSalary * 0.05;
      const tds = this.calculateTax(basicSalary);
      const totalEarnings = basicSalary + hra;
      const totalDeductions = pfEmployee + tds;
      const netPay = totalEarnings - totalDeductions;
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: emp.id,
          payrollNumber: `PAY-${year}-${String(month).padStart(2, '0')}-${emp.id}`,
          month,
          year,
          periodStart: new Date(year, month - 1, 1),
          periodEnd: new Date(year, month, 0),
          daysWorked: 0,
          daysLeave: 0,
          daysAbsent: 0,
          daysHoliday: 0,
          basicSalary,
          hra,
          totalEarnings,
          pfEmployee,
          tds,
          totalDeductions,
          netPay,
          status: 'DRAFT',
          tenantId,
        },
      });
      payrolls.push(payroll);
    }
    return payrolls;
  }

  async getByEmployee(tenantId: string, employeeId: string) {
    return prisma.payroll.findMany({ where: { employeeId, tenantId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
  }

  async markAsPaid(tenantId: string, id: string, data: { paymentTransactionId: string; notes?: string }) {
    const result = await prisma.payroll.updateMany({
      where: { id, tenantId },
      data: { status: 'PAID', paidAt: new Date(), paymentTransactionId: data.paymentTransactionId, payslipGeneratedAt: new Date() },
    });
    if (result.count === 0) throw new Error('Payroll not found');
    const payroll = await prisma.payroll.findFirst({ where: { id, tenantId } });
    if (!payroll) throw new Error('Payroll not found');
    return payroll;
  }

  async getMonthlySummary(tenantId: string, month: number, year: number) {
    const agg = await prisma.payroll.aggregate({
      where: { tenantId, month, year },
      _sum: { basicSalary: true, hra: true, pfEmployee: true, tds: true, netPay: true },
      _count: true,
    });
    const byStatus = await prisma.payroll.groupBy({
      by: ['status'], where: { tenantId, month, year }, _count: true, _sum: { netPay: true },
    });
    return {
      totalEmployees: agg._count,
      totalBase: Number(agg._sum.basicSalary ?? 0),
      totalHRA: Number(agg._sum.hra ?? 0),
      totalDeductions: Number(agg._sum.pfEmployee ?? 0) + Number(agg._sum.tds ?? 0),
      totalNet: Number(agg._sum.netPay ?? 0),
      byStatus,
    };
  }

  private calculateTax(salary: number): number {
    const annual = salary * 12;
    if (annual <= 50000) return salary * 0.05;
    if (annual <= 100000) return salary * 0.1;
    if (annual <= 200000) return salary * 0.2;
    return salary * 0.3;
  }
}
