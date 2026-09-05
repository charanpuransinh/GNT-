// [LOCK-7] Employee Service — tenant-scoped (company_id की बंदिश हर query पर)
import { prisma } from '@/common/config/prisma';

export class EmployeeService {
  async create(tenantId: string, data: any) {
    const employeeCode = await this.generateEmployeeCode();
    return prisma.employee.create({
      data: { ...data, tenantId, employeeCode },
      include: { department: true, documents: true }
    });
  }

  async findAll(tenantId: string, filters: any) {
    const where: any = { tenantId };
    if (filters.status) where.employmentStatus = filters.status;
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
        where, include: { department: true, _count: { select: { attendances: true, leaves: true } } },
        skip: (filters.page - 1) * filters.limit, take: filters.limit, orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ]);
    return { data, meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
  }

  async findOne(tenantId: string, id: string) {
    return prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        department: true, documents: true,
        attendances: { take: 30, orderBy: { date: 'desc' } },
        leaves: { take: 10, orderBy: { createdAt: 'desc' } },
        payrolls: { take: 12, orderBy: { year: 'desc' } }
      }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const result = await prisma.employee.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new Error('Employee not found');
    const employee = await prisma.employee.findFirst({ where: { id, tenantId }, include: { department: true } });
    if (!employee) throw new Error('Employee not found');
    return employee;
  }

  async remove(tenantId: string, id: string) {
    const result = await prisma.employee.updateMany({
      where: { id, tenantId },
      data: { employmentStatus: 'TERMINATED', dateOfExit: new Date() }
    });
    if (result.count === 0) throw new Error('Employee not found');
    return prisma.employee.findFirst({ where: { id, tenantId } });
  }

  async addDocument(tenantId: string, employeeId: string, docData: any) {
    const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId }, select: { id: true } });
    if (!emp) throw new Error('Employee not found');
    return prisma.employeeDocument.create({ data: { ...docData, employeeId } });
  }

  async getDashboardStats(tenantId: string) {
    const [total, active, onLeave, departments, newThisMonth] = await Promise.all([
      prisma.employee.count({ where: { tenantId } }),
      prisma.employee.count({ where: { tenantId, employmentStatus: 'ACTIVE' } }),
      prisma.employee.count({ where: { tenantId, employmentStatus: 'ON_LEAVE' } }),
      prisma.department.count({ where: { tenantId } }),
      prisma.employee.count({ where: { tenantId, dateOfJoining: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } })
    ]);
    return { total, active, onLeave, departments, newThisMonth };
  }

  private async generateEmployeeCode(): Promise<string> {
    const count = await prisma.employee.count();
    const year = new Date().getFullYear();
    return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
