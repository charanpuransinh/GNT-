// [LOCK-7] Employee Service
import { prisma } from '../db';

export class EmployeeService {
  async create(data: any) {
    const employeeCode = await this.generateEmployeeCode();
    return prisma.employee.create({
      data: { ...data, employeeCode },
      include: { department: true, documents: true }
    });
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { employeeCode: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where, include: { department: true, _count: { select: { attendance: true, leaves: true } } },
        skip: (filters.page - 1) * filters.limit, take: filters.limit, orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ]);
    return { data, meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
  }

  async findOne(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        department: true, documents: true,
        attendance: { take: 30, orderBy: { date: 'desc' } },
        leaves: { take: 10, orderBy: { createdAt: 'desc' } },
        payrolls: { take: 12, orderBy: { year: 'desc' } }
      }
    });
  }

  async update(id: string, data: any) {
    return prisma.employee.update({ where: { id }, data, include: { department: true } });
  }

  async remove(id: string) {
    return prisma.employee.update({ where: { id }, data: { status: 'TERMINATED', exitDate: new Date() } });
  }

  async addDocument(employeeId: string, docData: any) {
    return prisma.employeeDocument.create({ data: { ...docData, employeeId } });
  }

  async getDashboardStats() {
    const [total, active, onLeave, departments, newThisMonth] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.department.count(),
      prisma.employee.count({ where: { joinDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } })
    ]);
    return { total, active, onLeave, departments, newThisMonth };
  }

  private async generateEmployeeCode(): Promise<string> {
    const count = await prisma.employee.count();
    const year = new Date().getFullYear();
    return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
