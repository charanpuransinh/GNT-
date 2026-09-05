// [LOCK-8] Attendance Service — tenant-scoped
import { prisma } from '@/common/config/prisma';

export class AttendanceService {
  private async assertEmployeeOwned(tenantId: string, employeeId: string): Promise<void> {
    const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId }, select: { id: true } });
    if (!emp) throw new Error('Employee not found');
  }

  async checkIn(tenantId: string, employeeId: string, data: { location?: string; notes?: string }) {
    await this.assertEmployeeOwned(tenantId, employeeId);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } }
    });
    if (existing) throw new Error('Already checked in today');
    const now = new Date();
    const status = now.getHours() > 9 ? 'LATE' : 'PRESENT';
    return prisma.attendance.create({
      data: { employeeId, date: today, checkIn: now, status, checkInLocation: data.location as never, remarks: data.notes, tenantId }
    });
  }

  async checkOut(tenantId: string, employeeId: string, notes?: string) {
    await this.assertEmployeeOwned(tenantId, employeeId);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const record = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } }
    });
    if (!record) throw new Error('No check-in found for today');
    if (record.checkOut) throw new Error('Already checked out');
    const now = new Date();
    const checkIn = new Date(record.checkIn!);
    const workHours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    const overtimeHours = workHours > 8 ? workHours - 8 : 0;
    const result = await prisma.attendance.updateMany({
      where: { id: record.id, tenantId },
      data: { checkOut: now, workingHours: Math.round(workHours * 100) / 100, overtimeHours: Math.round(overtimeHours * 100) / 100, remarks: notes || record.remarks }
    });
    if (result.count === 0) throw new Error('Attendance record not found');
    return prisma.attendance.findFirst({ where: { id: record.id, tenantId } });
  }

  async getByEmployee(tenantId: string, employeeId: string, range: { startDate?: Date; endDate?: Date }) {
    const where: any = { employeeId, tenantId };
    if (range.startDate || range.endDate) {
      where.date = {};
      if (range.startDate) where.date.gte = range.startDate;
      if (range.endDate) where.date.lte = range.endDate;
    }
    return prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });
  }

  async getMonthlyReport(tenantId: string, month: number, year: number, departmentId?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const where: any = { tenantId, date: { gte: startDate, lte: endDate } };
    if (departmentId) where.employee = { departmentId, tenantId };
    const records = await prisma.attendance.findMany({
      where, include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } }
    });
    const summary = records.reduce((acc: any, r) => {
      const key = r.employeeId;
      if (!acc[key]) acc[key] = { employee: r.employee, present: 0, absent: 0, late: 0, halfDay: 0, totalHours: 0, overtime: 0 };
      acc[key][r.status.toLowerCase()]++;
      acc[key].totalHours += r.workingHours || 0;
      acc[key].overtime += r.overtimeHours || 0;
      return acc;
    }, {});
    return Object.values(summary);
  }

  async bulkUpload(tenantId: string, records: any[]) {
    const created = await prisma.attendance.createMany({
      data: records.map(r => ({ ...r, tenantId })),
      skipDuplicates: true
    });
    return { created: created.count };
  }
}
