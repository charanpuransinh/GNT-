// [LOCK-10] Department Service — tenant-scoped
import { prisma } from '@/common/config/prisma';

export class DepartmentService {
  async create(tenantId: string, data: any) {
    return prisma.department.create({ data: { ...data, tenantId } });
  }

  async findAll(tenantId: string) {
    return prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { employees: true } }, employees: { where: { employmentStatus: 'ACTIVE' }, select: { id: true } } }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const result = await prisma.department.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new Error('Department not found');
    return prisma.department.findFirst({ where: { id, tenantId } });
  }

  async remove(tenantId: string, id: string) {
    const count = await prisma.employee.count({ where: { tenantId, departmentId: id, employmentStatus: 'ACTIVE' } });
    if (count > 0) throw new Error('Cannot delete department with active employees');
    const result = await prisma.department.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new Error('Department not found');
  }

  async getDepartmentTree(tenantId: string) {
    const depts = await prisma.department.findMany({
      where: { tenantId },
      include: { employees: { where: { employmentStatus: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, designation: true } } }
    });
    return depts.map(d => ({ ...d, employeeCount: d.employees.length, employees: d.employees }));
  }
}
