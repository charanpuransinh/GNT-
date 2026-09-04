import { PrismaClient } from "@prisma/client";

// `data: any` की जगह असली आकार — नाम की ग़लती अब compile पर पकड़ी जाएगी
export interface CreateBranchData {
  companyId: string;
  name: string;
  code: string;
  address?: string | null;
  isActive?: boolean;
}

export class BranchRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async findByCompany(companyId: string) { return this.prisma.branch_master.findMany({ where: { company_id: companyId, deleted_at: null }, orderBy: { created_at: "desc" } }); }
  async create(data: CreateBranchData) { return this.prisma.branch_master.create({ data: { company_id: data.companyId, name: data.name, code: data.code, address: data.address ?? null, is_active: data.isActive ?? true } }); }
  async softDelete(id: string, companyId: string) { return this.prisma.branch_master.update({ where: { id, company_id: companyId }, data: { deleted_at: new Date(), is_active: false } }); }
  async countByCompany(companyId: string) { return this.prisma.branch_master.count({ where: { company_id: companyId, deleted_at: null } }); }
}