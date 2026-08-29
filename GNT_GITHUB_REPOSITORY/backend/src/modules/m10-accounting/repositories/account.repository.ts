import { PrismaClient } from '@prisma/client';

export class AccountRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<any> {
    return this.prisma.account_master.findUnique({ where: { id } });
  }

  async findByCode(companyId: string, code: string): Promise<any> {
    return this.prisma.account_master.findFirst({
      where: { company_id: companyId, code },
    });
  }

  async findByCompany(companyId: string, type?: string): Promise<any[]> {
    return this.prisma.account_master.findMany({
      where: { company_id: companyId, is_active: true, ...(type ? { type } : {}) },
      orderBy: { code: 'asc' },
    });
  }

  async getAccountTree(companyId: string): Promise<any[]> {
    const accounts = await this.prisma.account_master.findMany({
      where: { company_id: companyId, is_active: true },
      orderBy: { code: 'asc' },
    });
    return this.buildTree(accounts);
  }

  private buildTree(accounts: any[]): any[] {
    const map: Record<string, any> = {};
    const roots: any[] = [];
    accounts.forEach((acc) => { map[acc.id] = { ...acc, children: [] }; });
    accounts.forEach((acc) => {
      if (acc.parent_id && map[acc.parent_id]) {
        map[acc.parent_id].children.push(map[acc.id]);
      } else {
        roots.push(map[acc.id]);
      }
    });
    return roots;
  }

  async updateBalance(id: string, amount: number): Promise<any> {
    return this.prisma.account_master.update({
      where: { id },
      data: {
        current_balance: { increment: amount },
        updated_at: new Date(),
      },
    });
  }
}
