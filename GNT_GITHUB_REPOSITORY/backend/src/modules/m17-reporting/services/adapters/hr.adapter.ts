import { prisma } from '@/common/config/prisma';
import { IHRService } from '../report.internal';
import { HRReportFilters } from '../../types/report.types';

/**
 * M17 → M12 adapter (REAL) — M12 के असली employee/payroll/attendance tables से data।
 * M12 की facade की ज़रूरत नहीं — public schema se direct READ-ONLY (M12 DeepSeek का module)।
 */
export class HRAdapter implements IHRService {
  async getAttendanceReport(filters: HRReportFilters) {
    if (!filters.companyId) return [];
    const month = filters.month ? Number(filters.month) : new Date().getMonth() + 1;
    const year = filters.year ?? new Date().getFullYear();

    const rows = await prisma.attendance.findMany({
      where: { tenantId: filters.companyId, date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });

    const byEmp = new Map<string, { name: string; present: number; absent: number; leave: number; half: number }>();
    for (const r of rows) {
      const key = r.employeeId;
      if (!byEmp.has(key)) byEmp.set(key, { name: `${r.employee.firstName} ${r.employee.lastName}`, present: 0, absent: 0, leave: 0, half: 0 });
      const agg = byEmp.get(key)!;
      const s = String(r.status).toUpperCase();
      if (s === 'PRESENT' || s === 'LATE') agg.present++;
      else if (s === 'ABSENT') agg.absent++;
      else if (s === 'ON_LEAVE') agg.leave++;
      else if (s === 'HALF_DAY') agg.half++;
    }

    return [...byEmp.entries()].map(([employeeId, a]) => ({
      employeeId,
      employeeName: a.name,
      department: '',
      month: `${year}-${String(month).padStart(2, '0')}`,
      presentDays: a.present,
      absentDays: a.absent,
      leaveDays: a.leave,
      halfDays: a.half,
      overtimeHours: 0,
    }));
  }

  async getSalaryRegister(filters: HRReportFilters) {
    if (!filters.companyId) return [];
    const payrolls = await prisma.payroll.findMany({
      where: {
        tenantId: filters.companyId,
        ...(filters.month && { month: Number(filters.month) }),
        ...(filters.year && { year: filters.year }),
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 500,
    });

    return payrolls.map((p) => ({
      employeeId: p.employeeId,
      employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
      basicSalary: Number(p.basicSalary),
      hra: Number(p.hra),
      da: 0,
      otherAllowances: 0,
      grossSalary: Number(p.totalEarnings),
      pfDeduction: Number(p.pfEmployee),
      esiDeduction: 0,
      tds: Number(p.tds),
      otherDeductions: 0,
      netSalary: Number(p.netPay),
    }));
  }

  async getEmployeeCount(): Promise<number> {
    return prisma.employee.count();
  }
}
