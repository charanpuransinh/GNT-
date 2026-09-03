// M11 Payment Module - Ledger Entry Repository
// Links to M10 Finance module via PUBLIC API only

import { PrismaClient, Prisma, PaymentLedgerEntry } from '@prisma/client';
import { requireTenant } from '@/common/middleware/require-tenant';
import { Decimal } from '@prisma/client/runtime/library';

export class LedgerRepository {
  constructor(private prisma: PrismaClient) {}

  async findByTransaction(transactionId: string, tenantId: string): Promise<PaymentLedgerEntry[]> {
    return this.prisma.paymentLedgerEntry.findMany({
      where: { transactionId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(entries: {
    transactionId: string;
    accountCode: string;
    debitAmount: Decimal;
    creditAmount: Decimal;
    narration: string;
    entryDate: Date;
    fiscalYearId?: string;
  }[], tenantId: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.paymentLedgerEntry.createMany({
      data: entries.map(entry => ({
        tenantId,
        transactionId: entry.transactionId,
        accountCode: entry.accountCode,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        narration: entry.narration,
        entryDate: entry.entryDate,
        fiscalYearId: entry.fiscalYearId || null,
        createdBy: userId,
        updatedBy: userId,
      })),
    });
  }

  async getAccountBalance(accountCode: string, tenantId: string, fiscalYearId?: string): Promise<Decimal> {
    const result = await this.prisma.paymentLedgerEntry.aggregate({
      where: { accountCode, tenantId, fiscalYearId: fiscalYearId || undefined },
      _sum: { debitAmount: true, creditAmount: true },
    });

    const debits = result._sum.debitAmount || new Decimal(0);
    const credits = result._sum.creditAmount || new Decimal(0);
    return debits.sub(credits);
  }
}
