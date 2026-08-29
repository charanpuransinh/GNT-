// [LOCK-11] Payroll Service
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class PayrollService {
  async generate(month: number, year: number, employeeIds?: string[]) {
    const where: any = { status: 'ACTIVE' };
    if (employeeIds?.length) where.id = { in: employeeIds };
    const employees = await prisma.employee.findMany({ where, include: { department: true } });
    const payrolls = [];
    for (const emp of employees) {
      const existing = await prisma.payroll.findUnique({ where: { employeeId_month_year: { employeeId: emp.id, month, year } } });
      if (existing) continue;
      const baseSalary = emp.salary;
      const allowances = baseSalary * 0.1;
      const deductions = baseSalary * 0.05;
      const tax = this.calculateTax(baseSalary);
      const netSalary = baseSalary + allowances - deductions - tax;
      const payroll = await prisma.payroll.create({
        data: { employeeId: emp.id, month, year, baseSalary, allowances, deductions, tax, netSalary, paymentStatus: 'PENDING' }
      });
      payrolls.push(payroll);
    }
    return payrolls;
  }

  async getByEmployee(employeeId: string) {
    return prisma.payroll.findMany({ where: { employeeId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
  }

  async markAsPaid(id: string, data: { paymentDate: Date; paymentRef: string; notes?: string }) {
    return prisma.payroll.update({
      where: { id },
      data: { paymentStatus: 'PROCESSED', paymentDate: data.paymentDate, paymentRef: data.paymentRef, notes: data.notes }
    });
  }

  async getMonthlySummary(month: number, year: number) {
    const agg = await prisma.payroll.aggregate({
      where: { month, year },
      _sum: { baseSalary: true, allowances: true, deductions: true, tax: true, netSalary: true },
      _count: true
    });
    const byStatus = await prisma.payroll.groupBy({
      by: ['paymentStatus'], where: { month, year }, _count: true, _sum: { netSalary: true }
    });
    return { totalEmployees: agg._count, totalBase: agg._sum.baseSalary, totalAllowances: agg._sum.allowances, totalDeductions: agg._sum.deductions, totalTax: agg._sum.tax, totalNet: agg._sum.netSalary, byStatus };
  }

  private calculateTax(salary: any): number {
    const annual = Number(salary) * 12;
    if (annual <= 50000) return Number(salary) * 0.05;
    if (annual <= 100000) return Number(salary) * 0.1;
    if (annual <= 200000) return Number(salary) * 0.2;
    return Number(salary) * 0.3;
  }
}
