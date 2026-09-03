// M11 Payment Module - Ledger Entry Repository
// Links to M10 Finance module via PUBLIC API only
// (टास्क #025 B4: PaymentLedgerEntry के असली fields — entryType/amount/fiscalYear/period)

import { PrismaClient, Prisma, PaymentLedgerEntry } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class LedgerRepository {
  constructor(private prisma: PrismaClient) {}

  async findByTransaction(transactionId: string, tenantId: string): Promise<PaymentLedgerEntry[]> {
    return this.prisma.paymentLedgerEntry.findMany({
      where: { transactionId, tenantId },
      orderBy: { postedAt: 'asc' },
    });
  }

  async create(
    entries: {
      transactionId: string;
      accountCode: string;
      debitAmount: Decimal;
      creditAmount: Decimal;
      narration: string;
      entryDate: Date;
      fiscalYearId?: string;
    }[],
    tenantId: string,
    _userId: string,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.paymentLedgerEntry.createMany({
      data: entries.map((entry) => {
        const isDebit = entry.debitAmount.greaterThan(0);
        return {
          tenantId,
          transactionId: entry.transactionId,
          entryType: isDebit ? 'DEBIT' : 'CREDIT',
          accountCode: entry.accountCode,
          amount: isDebit ? entry.debitAmount : entry.creditAmount,
          contraAccount: entry.narration || null,
          fiscalYear: entry.fiscalYearId || String(entry.entryDate.getFullYear()),
          period: `${String(entry.entryDate.getMonth() + 1).padStart(2, '0')}-${entry.entryDate.getFullYear()}`,
          postedAt: entry.entryDate,
        };
      }),
    });
  }

  async getAccountBalance(accountCode: string, tenantId: string, fiscalYearId?: string): Promise<Decimal> {
    const result = await this.prisma.paymentLedgerEntry.aggregate({
      where: { accountCode, tenantId, fiscalYear: fiscalYearId || undefined },
      _sum: { amount: true },
    });
    // ledger entryType DEBIT/CREDIT से balance निकालने के लिए दो aggregate चाहिए
    const debits = await this.prisma.paymentLedgerEntry.aggregate({
      where: { accountCode, tenantId, entryType: 'DEBIT' },
      _sum: { amount: true },
    });
    const credits = await this.prisma.paymentLedgerEntry.aggregate({
      where: { accountCode, tenantId, entryType: 'CREDIT' },
      _sum: { amount: true },
    });
    const d = debits._sum.amount || new Decimal(0);
    const c = credits._sum.amount || new Decimal(0);
    return d.sub(c);
  }
}
