import { Prisma, PrismaClient } from '@prisma/client';
import { AccountingInternalEngine } from './accounting.internal';
import { LedgerRepository } from '../repositories/ledger.repository';

export class LedgerService {
  constructor(private repo: LedgerRepository, private prisma: PrismaClient) {}

  // `data: any` सीधे Prisma में जा रहा था — field का नाम ग़लत होता तो tsc चुप
  // रहता और लेखा-प्रविष्टि बनाते वक़्त फ़ेल होती। अब generated type लगा है।
  async createEntry(data: Prisma.ledgerUncheckedCreateInput): Promise<any> {
    return this.prisma.ledger.create({ data });
  }

  async getLedgerByAccount(companyId: string, accountId: string, fromDate?: Date, toDate?: Date, partyId?: string): Promise<any[]> {
    return this.repo.getLedgerEntries(companyId, accountId, fromDate, toDate, partyId);
  }

  async getAccountBalance(companyId: string, accountId: string, asOfDate?: Date): Promise<number> {
    return this.repo.getBalanceAsOfDate(companyId, accountId, asOfDate);
  }

  // ── मालिक का हार्ड रूल (2026-09-05): हर party का ledger/बैलेंस self-contained ──
  async getPartyLedger(companyId: string, partyId: string, fromDate?: Date, toDate?: Date): Promise<any[]> {
    return this.repo.getPartyLedger(companyId, partyId, fromDate, toDate);
  }

  async getPartyBalance(companyId: string, partyId: string, asOfDate?: Date): Promise<number> {
    return this.repo.getPartyBalance(companyId, partyId, asOfDate);
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
