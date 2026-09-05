import { PrismaClient } from '@prisma/client';

// 2026-09-05 — पूरी BRS feature में कहीं भी company की सीमा नहीं थी: createBRS
// body.company_id पर चलता था (जो भी भेजा वही मान लिया जाता), matchItem/getStatus
// सिर्फ़ brsId/id पर — यानी कोई भी दूसरी company की bank reconciliation पढ़/बदल
// सकता था, और createBRS में bank_account_id भी बिना जाँचे किसी और company के
// account से balance खींच सकता था। अब हर जगह companyId अनिवार्य है, controller
// उसे हमेशा token से भरता है।
export class BRSService {
  constructor(private prisma: PrismaClient) {}

  async createBRS(companyId: string, data: any): Promise<any> {
    const { bank_account_id, statement_date, statement_balance, ledger_entries } = data;

    const account = await this.prisma.account_master.findFirst({ where: { id: bank_account_id, company_id: companyId } });
    if (!account) throw new Error('Bank account not found for this company');

    const ledgerBalance = await this.getLedgerBalance(bank_account_id, statement_date);
    const difference = Number((Number(statement_balance) - ledgerBalance).toFixed(4));

    const brs = await this.prisma.bank_reconciliation.create({
      data: {
        company_id: companyId,
        bank_account_id,
        statement_date: new Date(statement_date),
        statement_balance,
        ledger_balance: ledgerBalance,
        difference,
        status: Math.abs(difference) < 0.01 ? 'reconciled' : 'pending',
        items: {
          create: ledger_entries.map((entry: any) => ({
            ledger_entry_id: entry.id,
            transaction_date: new Date(entry.transaction_date),
            description: entry.description,
            amount: entry.amount,
            type: entry.type,
          })),
        },
      },
      include: { items: true },
    });

    return brs;
  }

  async matchItem(companyId: string, brsId: string, ledgerEntryId: string, statementEntryId?: string): Promise<any> {
    const item = await this.prisma.bank_reconciliation_item.findFirst({
      where: {
        bank_reconciliation_id: brsId,
        ledger_entry_id: ledgerEntryId,
        brs: { company_id: companyId },
      },
    });

    if (!item) throw new Error('Reconciliation item not found');

    const updated = await this.prisma.bank_reconciliation_item.update({
      where: { id: item.id },
      data: {
        is_matched: true,
        matched_statement_entry_id: statementEntryId || null,
      },
    });

    await this.recalculateBRSStatus(brsId);
    return updated;
  }

  async getStatus(companyId: string, brsId: string): Promise<any> {
    const brs = await this.prisma.bank_reconciliation.findFirst({
      where: { id: brsId, company_id: companyId },
      include: { items: true },
    });
    if (!brs) throw new Error('BRS not found');

    const unmatched = brs.items.filter((i: any) => !i.is_matched);
    return {
      ...brs,
      unmatched_count: unmatched.length,
      matched_count: brs.items.length - unmatched.length,
    };
  }

  private async getLedgerBalance(accountId: string, asOfDate: Date): Promise<number> {
    const account = await this.prisma.account_master.findUnique({ where: { id: accountId } });
    const opening = Number(account?.opening_balance || 0);
    const agg = await this.prisma.ledger.aggregate({
      where: {
        account_id: accountId,
        transaction_date: { lte: new Date(asOfDate) },
      },
      _sum: { debit_amount: true, credit_amount: true },
    });
    return Number((opening + Number(agg._sum.debit_amount || 0) - Number(agg._sum.credit_amount || 0)).toFixed(4));
  }

  private async recalculateBRSStatus(brsId: string): Promise<void> {
    const items = await this.prisma.bank_reconciliation_item.findMany({
      where: { bank_reconciliation_id: brsId },
    });
    const allMatched = items.every((i: any) => i.is_matched);
    await this.prisma.bank_reconciliation.update({
      where: { id: brsId },
      data: {
        status: allMatched ? 'reconciled' : 'pending',
        updated_at: new Date(),
      },
    });
  }
}
