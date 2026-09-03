import { PrismaClient } from "@prisma/client";

export class CompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) { return this.prisma.company_master.findUnique({ where: { id } }); }
  async update(id: string, data: any) { return this.prisma.company_master.update({ where: { id }, data: { ...data, updatedAt: new Date() } }); }
  async findFinancialYears(companyId: string) { return this.prisma.financial_year.findMany({ where: { company_id: companyId }, orderBy: { start_date: "desc" } }); }
  async createFY(data: any) { return this.prisma.financial_year.create({ data: { company_id: data.companyId, start_date: new Date(data.startDate), end_date: new Date(data.endDate), prefix: data.prefix, is_active: data.isActive ?? false } }); }
  async deactivateAllFY(companyId: string) { return this.prisma.financial_year.updateMany({ where: { company_id: companyId }, data: { is_active: false } }); }
  async activateFY(id: string) { return this.prisma.financial_year.update({ where: { id }, data: { is_active: true } }); }
  async findRoles(companyId: string) { return this.prisma.role_master.findMany({ where: { company_id: companyId }, include: { role_permission: { include: { permission_master: true } } } }); }
  async findRoleById(id: string) { return this.prisma.role_master.findUnique({ where: { id } }); }
  async updateRolePermissions(roleId: string, permissions: string[]) {
    return this.prisma.role_master.update({
      where: { id: roleId },
      data: {
        role_permission: {
          deleteMany: {},
          create: permissions.map((id: string) => ({ permission_id: id })),
        },
      },
    });
  }
  async findUsers(companyId: string) { return this.prisma.user_master.findMany({ where: { company_id: companyId }, include: { user_role: { include: { role_master: true } } } }); }
  async findUserById(id: string) { return this.prisma.user_master.findUnique({ where: { id } }); }
  async createUser(data: any) { return this.prisma.user_master.create({ data }); }
  async toggleUserStatus(id: string, isActive: boolean) { return this.prisma.user_master.update({ where: { id }, data: { is_active: isActive } }); }
}
