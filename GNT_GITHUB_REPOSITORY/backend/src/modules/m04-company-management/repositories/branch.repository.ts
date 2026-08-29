import { PrismaClient } from "@prisma/client";

export class BranchRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async findByCompany(companyId: string) { return this.prisma.branch_master.findMany({ where: { companyId, deletedAt: null }, orderBy: { createdAt: "desc" } }); }
  async create(data: any) { return this.prisma.branch_master.create({ data }); }
  async softDelete(id: string, companyId: string) { return this.prisma.branch_master.update({ where: { id, companyId }, data: { deletedAt: new Date(), isActive: false } }); }
  async countByCompany(companyId: string) { return this.prisma.branch_master.count({ where: { companyId, deletedAt: null } }); }
}