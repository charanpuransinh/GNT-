// GNT M20 — Customs Repository (OWNER ONLY for customs_rule)
// Owner: D4-DELTA

import { PrismaClient, customs_rule } from '@prisma/client';

export class CustomsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveRules(companyId: string, hsnCode: string, asOf: Date = new Date()): Promise<customs_rule[]> {
    return this.prisma.customs_rule.findMany({
      where: {
        company_id: companyId,
        hsn_code: hsnCode,
        effective_from: { lte: asOf },
        OR: [
          { effective_to: null },
          { effective_to: { gte: asOf } },
        ],
      },
      orderBy: { effective_from: 'desc' },
    });
  }

  async findLatestRule(companyId: string, hsnCode: string, asOf: Date = new Date()): Promise<customs_rule | null> {
    return this.prisma.customs_rule.findFirst({
      where: {
        company_id: companyId,
        hsn_code: hsnCode,
        effective_from: { lte: asOf },
        OR: [
          { effective_to: null },
          { effective_to: { gte: asOf } },
        ],
      },
      orderBy: { effective_from: 'desc' },
    });
  }

  async create(data: Omit<customs_rule, 'id' | 'created_at' | 'updated_at'>): Promise<customs_rule> {
    return this.prisma.customs_rule.create({ data });
  }

  async update(id: string, data: Partial<customs_rule>): Promise<customs_rule> {
    return this.prisma.customs_rule.update({ where: { id }, data });
  }

  async delete(id: string): Promise<customs_rule> {
    return this.prisma.customs_rule.delete({ where: { id } });
  }
}
