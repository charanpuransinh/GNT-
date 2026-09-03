// [LOCK-10] Department Service
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class DepartmentService {
  async create(data: any) { return prisma.department.create({ data }); }
  async findAll() {
    return prisma.department.findMany({
      include: { _count: { select: { employees: true } }, employees: { where: { employmentStatus: 'ACTIVE' }, select: { id: true } } }
    });
  }
  async update(id: string, data: any) { return prisma.department.update({ where: { id }, data }); }
  async remove(id: string) {
    const count = await prisma.employee.count({ where: { departmentId: id, employmentStatus: 'ACTIVE' } });
    if (count > 0) throw new Error('Cannot delete department with active employees');
    return prisma.department.delete({ where: { id } });
  }
  async getDepartmentTree() {
    const depts = await prisma.department.findMany({
      include: { employees: { where: { employmentStatus: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, designation: true } } }
    });
    return depts.map(d => ({ ...d, employeeCount: d.employees.length, employees: d.employees }));
  }
}
