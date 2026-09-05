/**
 * M12 — Reporting Facade (M17 के लिए सिर्फ़-पढ़ने वाला दरवाज़ा) — tenant-scoped
 * मालिक M12 ही है; M17 सिर्फ़ यहीं से आँकड़े लेता है।
 */
import { prisma } from '@/common/config/prisma';

export interface AttendanceRow {
  employee_id: string;
  employee_name: string;
  present_days: number;
  absent_days: number;
  leave_days: number;
}

export interface SalaryRegisterRow {
  employee_id: string;
  employee_name: string;
  gross: number;
  deductions: number;
  net: number;
}

export class HRService {
  async getEmployeeCount(company_id: string): Promise<number> {
    return prisma.employee.count({ where: { tenantId: company_id } });
  }

  async getAttendanceReport(company_id: string, from: Date, to: Date): Promise<AttendanceRow[]> {
    const rows = await prisma.attendance.findMany({
      where: { tenantId: company_id, date: { gte: from, lte: to } },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    const byEmployee = new Map<string, AttendanceRow>();
    for (const r of rows) {
      const name = `${r.employee.firstName} ${r.employee.lastName}`.trim();
      let acc = byEmployee.get(r.employeeId);
      if (!acc) {
        acc = { employee_id: r.employeeId, employee_name: name, present_days: 0, absent_days: 0, leave_days: 0 };
        byEmployee.set(r.employeeId, acc);
      }
      if (r.status === 'PRESENT') acc.present_days++;
      else if (r.status === 'ABSENT') acc.absent_days++;
      else if (r.status === 'LEAVE') acc.leave_days++;
    }
    return [...byEmployee.values()];
  }

  async getSalaryRegister(company_id: string, month: number, year: number): Promise<SalaryRegisterRow[]> {
    const payrolls = await prisma.payroll.findMany({
      where: { tenantId: company_id, month, year },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    return payrolls.map(p => ({
      employee_id: p.employeeId,
      employee_name: `${p.employee.firstName} ${p.employee.lastName}`.trim(),
      gross: Number(p.totalEarnings),
      deductions: Number(p.totalDeductions),
      net: Number(p.netPay),
    }));
  }
}

export const hrService = new HRService();
