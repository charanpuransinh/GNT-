// [LOCK-11] Payroll Service — schema (Payroll model) के असली fields से मिलाया गया
import { PrismaClient } from '@prisma/client';
import { requireTenant } from '@/common/middleware/require-tenant';
const prisma = new PrismaClient();

export class PayrollService {
  async generate(month: number, year: number, employeeIds?: string[]) {
    const where: Record<string, unknown> = { employmentStatus: 'ACTIVE' };
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
          tenantId: emp.tenantId,
        },
      });
      payrolls.push(payroll);
    }
    return payrolls;
  }

  async getByEmployee(employeeId: string) {
    return prisma.payroll.findMany({ where: { employeeId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
  }

  async markAsPaid(id: string, data: { paymentTransactionId: string; notes?: string }) {
    return prisma.payroll.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date(), paymentTransactionId: data.paymentTransactionId, payslipGeneratedAt: new Date() },
    });
  }

  async getMonthlySummary(month: number, year: number) {
    const agg = await prisma.payroll.aggregate({
      where: { month, year },
      _sum: { basicSalary: true, hra: true, pfEmployee: true, tds: true, netPay: true },
      _count: true,
    });
    const byStatus = await prisma.payroll.groupBy({
      by: ['status'], where: { month, year }, _count: true, _sum: { netPay: true },
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
