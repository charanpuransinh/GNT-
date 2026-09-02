// GNT M20 — FX Repository (OWNER ONLY for fx_rate)
// Owner: D4-DELTA

import { PrismaClient, fx_rate } from '@prisma/client';

export class FXRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findLatest(
    companyId: string,
    baseCurrency: string,
    targetCurrency: string,
    asOf?: Date
  ): Promise<fx_rate | null> {
    return this.prisma.fx_rate.findFirst({
      where: {
        company_id: companyId,
        base_currency: baseCurrency,
        target_currency: targetCurrency,
        ...(asOf ? { effective_date: { lte: asOf } } : {}),
      },
      orderBy: { effective_date: 'desc' },
    });
  }

  async findAllByCompany(companyId: string, baseCurrency?: string): Promise<fx_rate[]> {
    const where: any = { company_id: companyId };
    if (baseCurrency) where.base_currency = baseCurrency;
    return this.prisma.fx_rate.findMany({
      where,
      orderBy: { effective_date: 'desc' },
      take: 100,
    });
  }

  async create(data: Omit<fx_rate, 'id' | 'created_at'>): Promise<fx_rate> {
    return this.prisma.fx_rate.create({ data });
  }

  async upsertRate(
    companyId: string,
    baseCurrency: string,
    targetCurrency: string,
    rate: number,
    source: string,
    effectiveDate: Date
  ): Promise<fx_rate> {
    return this.prisma.fx_rate.upsert({
      where: {
        company_id_base_currency_target_currency_effective_date: {
          company_id: companyId,
          base_currency: baseCurrency,
          target_currency: targetCurrency,
          effective_date: effectiveDate,
        },
      },
      create: {
        company_id: companyId,
        base_currency: baseCurrency,
        target_currency: targetCurrency,
        rate,
        source,
        effective_date: effectiveDate,
      },
      update: { rate, source, effective_date: effectiveDate },
    });
  }
}
