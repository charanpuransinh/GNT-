import { PrismaClient } from "@prisma/client";

export class BranchRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async findByCompany(companyId: string) { return this.prisma.branch_master.findMany({ where: { company_id: companyId, deleted_at: null }, orderBy: { created_at: "desc" } }); }
  async create(data: any) { return this.prisma.branch_master.create({ data }); }
  async softDelete(id: string, companyId: string) { return this.prisma.branch_master.update({ where: { id, company_id: companyId }, data: { deleted_at: new Date(), is_active: false } }); }
  async countByCompany(companyId: string) { return this.prisma.branch_master.count({ where: { company_id: companyId, deleted_at: null } }); }
}