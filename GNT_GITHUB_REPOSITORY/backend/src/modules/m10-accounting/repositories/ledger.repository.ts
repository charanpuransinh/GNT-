import { PrismaClient } from '@prisma/client';

export class LedgerRepository {
  constructor(private prisma: PrismaClient) {}

  async getLedgerEntries(accountId: string, fromDate?: Date, toDate?: Date, partyId?: string): Promise<any[]> {
    return this.prisma.ledger.findMany({
      where: {
        account_id: accountId,
        ...(fromDate && toDate ? { transaction_date: { gte: fromDate, lte: toDate } } : {}),
        ...(partyId ? { party_id: partyId } : {}),
      },
      orderBy: { transaction_date: 'asc' },
    });
  }

  async getBalanceAsOfDate(accountId: string, asOfDate?: Date): Promise<number> {
    const account = await this.prisma.account_master.findUnique({ where: { id: accountId } });
    const opening = Number(account?.opening_balance || 0);
    const agg = await this.prisma.ledger.aggregate({
      where: {
        account_id: accountId,
        ...(asOfDate ? { transaction_date: { lte: asOfDate } } : {}),
      },
      _sum: { debit_amount: true, credit_amount: true },
    });
    return Number((opening + Number(agg._sum.debit_amount || 0) - Number(agg._sum.credit_amount || 0)).toFixed(4));
  }

  async getLedgerSumsByAccount(companyId: string, asOfDate?: Date): Promise<Record<string, { debit: number; credit: number }>> {
    const rows = await this.prisma.ledger.groupBy({
      by: ['account_id'],
      where: {
        company_id: companyId,
        ...(asOfDate ? { transaction_date: { lte: asOfDate } } : {}),
      },
      _sum: { debit_amount: true, credit_amount: true },
    });
    const map: Record<string, { debit: number; credit: number }> = {};
    for (const r of rows) {
      map[r.account_id] = {
        debit: Number(r._sum.debit_amount || 0),
        credit: Number(r._sum.credit_amount || 0),
      };
    }
    return map;
  }
}
