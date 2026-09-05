import { accountingService } from '@/modules/m10-accounting';
import { prisma } from '@/common/config/prisma';
import { IAccountingService } from '../report.internal';
import {
  AccountingReportData,
  AccountingReportFilters,
  AccountingReportRow,
  AgingRow,
  CashflowSummary,
} from '../../types/report.types';

/**
 * M17 → M10 adapter (टास्क #012)
 * IAccountingService को implement करता है; ledger की असली entries facade से,
 * बाक़ी (trial/cashflow/aging) अभी खाली — समीक्षक AI के नियम अनुसार झूठा डेटा नहीं।
 */
export class AccountingAdapter implements IAccountingService {
  async getLedgerEntries(filters: AccountingReportFilters): Promise<AccountingReportData> {
    if (!filters.companyId) {
      return { rows: [], cashflow: this.emptyCashflow(), aging: [] };
    }
    const rows = await accountingService.getLedgerEntries(
      filters.companyId,
      filters.dateFrom ? new Date(filters.dateFrom) : new Date(0),
      filters.dateTo ? new Date(filters.dateTo) : new Date()
    );

    const mapped: AccountingReportRow[] = rows.map((r) => ({
      entryId: r.id,
      date: r.date.toISOString(),
      ledgerName: r.account_id,
      voucherType: '',
      voucherNo: '',
      debit: r.debit,
      credit: r.credit,
      narration: r.narration,
    }));

    return { rows: mapped, cashflow: this.emptyCashflow(), aging: [] };
  }

  async getTrialBalance(): Promise<{ ledgerName: string; debit: number; credit: number }[]> {
    // TODO(#016): facade में trial balance आने पर
    return [];
  }

  async getCashflow(filters: AccountingReportFilters): Promise<CashflowSummary> {
    if (!filters.companyId) return this.emptyCashflow();
    const from = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0);
    const to = filters.dateTo ? new Date(filters.dateTo) : new Date();
    const entries = await prisma.ledger.findMany({
      where: { company_id: filters.companyId, transaction_date: { gte: from, lte: to } },
    });
    const totalInflow = entries.reduce((s, e) => s + Number(e.credit_amount), 0);
    const totalOutflow = entries.reduce((s, e) => s + Number(e.debit_amount), 0);
    return {
      openingBalance: 0,
      totalInflow,
      totalOutflow,
      netFlow: totalInflow - totalOutflow,
      closingBalance: totalInflow - totalOutflow,
    };
  }

  async getAgingReport(): Promise<AgingRow[]> {
    // TODO(#016): facade का getAgingReport अभी खाली है
    return [];
  }

  private emptyCashflow(): CashflowSummary {
    return { openingBalance: 0, totalInflow: 0, totalOutflow: 0, netFlow: 0, closingBalance: 0 };
  }
}
