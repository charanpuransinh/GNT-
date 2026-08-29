// [LOCK-8] Attendance Service
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class AttendanceService {
  async checkIn(employeeId: string, data: { location?: string; notes?: string }) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } }
    });
    if (existing) throw new Error('Already checked in today');
    const now = new Date();
    const status = now.getHours() > 9 ? 'LATE' : 'PRESENT';
    return prisma.attendance.create({
      data: { employeeId, date: today, checkIn: now, status, location: data.location, notes: data.notes }
    });
  }

  async checkOut(employeeId: string, notes?: string) {
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
    return prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: now, workHours: Math.round(workHours * 100) / 100, overtimeHours: Math.round(overtimeHours * 100) / 100, notes: notes || record.notes }
    });
  }

  async getByEmployee(employeeId: string, range: { startDate?: Date; endDate?: Date }) {
    const where: any = { employeeId };
    if (range.startDate || range.endDate) {
      where.date = {};
      if (range.startDate) where.date.gte = range.startDate;
      if (range.endDate) where.date.lte = range.endDate;
    }
    return prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });
  }

  async getMonthlyReport(month: number, year: number, departmentId?: string) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const where: any = { date: { gte: startDate, lte: endDate } };
    if (departmentId) where.employee = { departmentId };
    const records = await prisma.attendance.findMany({
      where, include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } }
    });
    const summary = records.reduce((acc: any, r) => {
      const key = r.employeeId;
      if (!acc[key]) acc[key] = { employee: r.employee, present: 0, absent: 0, late: 0, halfDay: 0, totalHours: 0, overtime: 0 };
      acc[key][r.status.toLowerCase()]++;
      acc[key].totalHours += r.workHours || 0;
      acc[key].overtime += r.overtimeHours || 0;
      return acc;
    }, {});
    return Object.values(summary);
  }

  async bulkUpload(records: any[]) {
    const created = await prisma.attendance.createMany({ data: records, skipDuplicates: true });
    return { created: created.count };
  }
}
