import { PrismaClient } from "@prisma/client";

export class CompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) { return this.prisma.company_master.findUnique({ where: { id } }); }
  async update(id: string, data: any) { return this.prisma.company_master.update({ where: { id }, data: { ...data, updatedAt: new Date() } }); }
  async findFinancialYears(companyId: string) { return this.prisma.financial_year.findMany({ where: { companyId }, orderBy: { startDate: "desc" } }); }
  async createFY(data: any) { return this.prisma.financial_year.create({ data }); }
  async deactivateAllFY(companyId: string) { return this.prisma.financial_year.updateMany({ where: { companyId }, data: { isActive: false } }); }
  async activateFY(id: string) { return this.prisma.financial_year.update({ where: { id }, data: { isActive: true } }); }
  async findRoles(companyId: string) { return this.prisma.role_master.findMany({ where: { companyId }, include: { permissions: true } }); }
  async findRoleById(id: string) { return this.prisma.role_master.findUnique({ where: { id } }); }
  async updateRolePermissions(roleId: string, permissions: string[]) {
    return this.prisma.role_master.update({ where: { id: roleId }, data: { permissions: { set: permissions.map((id: string) => ({ id })) } } });
  }
  async findUsers(companyId: string) { return this.prisma.user_master.findMany({ where: { companyId }, include: { role: true } }); }
  async findUserById(id: string) { return this.prisma.user_master.findUnique({ where: { id } }); }
  async createUser(data: any) { return this.prisma.user_master.create({ data }); }
  async toggleUserStatus(id: string, isActive: boolean) { return this.prisma.user_master.update({ where: { id }, data: { isActive } }); }
}