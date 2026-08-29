import { PrismaClient } from '@prisma/client';
import { AccountingInternalEngine } from './accounting.internal';
import { LedgerRepository } from '../repositories/ledger.repository';

export class LedgerService {
  constructor(private repo: LedgerRepository, private prisma: PrismaClient) {}

  async createEntry(data: any): Promise<any> {
    return this.prisma.ledger.create({ data });
  }

  async getLedgerByAccount(accountId: string, fromDate?: Date, toDate?: Date, partyId?: string): Promise<any[]> {
    return this.repo.getLedgerEntries(accountId, fromDate, toDate, partyId);
  }

  async getAccountBalance(accountId: string, asOfDate?: Date): Promise<number> {
    return this.repo.getBalanceAsOfDate(accountId, asOfDate);
  }

  async getTrialBalance(companyId: string, asOfDate?: Date): Promise<any[]> {
    const accounts = await this.prisma.account_master.findMany({
      where: { company_id: companyId, is_active: true },
    });
    const sums = await this.repo.getLedgerSumsByAccount(companyId, asOfDate);
    return AccountingInternalEngine.computeTrialBalance(accounts as any, sums);
  }

  async getProfitLoss(companyId: string, fromDate: Date, toDate: Date): Promise<any> {
    const accounts = await this.prisma.account_master.findMany({
      where: { company_id: companyId, type: { in: ['income', 'expense'] } },
    });
    const sums = await this.repo.getLedgerSumsByAccount(companyId, toDate);
    return AccountingInternalEngine.computeProfitLoss(accounts as any, sums, fromDate, toDate);
  }

  async getBalanceSheet(companyId: string, asOfDate: Date): Promise<any> {
    const accounts = await this.prisma.account_master.findMany({
      where: { company_id: companyId, type: { in: ['asset', 'liability', 'equity'] } },
    });
    const sums = await this.repo.getLedgerSumsByAccount(companyId, asOfDate);
    return AccountingInternalEngine.computeBalanceSheet(accounts as any, sums, asOfDate);
  }
}
