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

  async getTrialBalance(filters: AccountingReportFilters): Promise<{ ledgerName: string; debit: number; credit: number }[]> {
    if (!filters.companyId) return [];
    // M10 ledger से असली trial balance (account_id पर debit/credit जोड़) — tenant-scoped
    const groups = await prisma.ledger.groupBy({
      by: ['account_id'],
      where: { company_id: filters.companyId },
      _sum: { debit_amount: true, credit_amount: true },
    });
    return groups.map((g) => ({
      ledgerName: g.account_id,
      debit: Number(g._sum.debit_amount ?? 0),
      credit: Number(g._sum.credit_amount ?? 0),
    }));
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

  async getAgingReport(filters: AccountingReportFilters): Promise<AgingRow[]> {
    if (!filters.companyId) return [];
    // असली receivables aging: unpaid/partial sales invoices ka outstanding, dueDate से age bucket
    const invoices = await prisma.salesInvoice.findMany({
      where: { companyId: filters.companyId, paymentStatus: { in: ['unpaid', 'partial'] } },
    });
    if (invoices.length === 0) return [];

    const customerIds = [...new Set(invoices.map((i) => i.customerId))];
    const parties = await prisma.party_master.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(parties.map((p) => [p.id, p.name]));

    const now = Date.now();
    const byCustomer = new Map<string, AgingRow>();
    for (const inv of invoices) {
      const outstanding = Number(inv.grandTotal) - Number(inv.amountPaid);
      if (outstanding <= 0) continue;
      const daysOverdue = Math.floor((now - inv.dueDate.getTime()) / 86400000);
      const bucket: keyof Pick<AgingRow, 'days0_30' | 'days31_60' | 'days61_90' | 'days91_plus'> =
        daysOverdue <= 30 ? 'days0_30' : daysOverdue <= 60 ? 'days31_60' : daysOverdue <= 90 ? 'days61_90' : 'days91_plus';
      let row = byCustomer.get(inv.customerId);
      if (!row) {
        row = { partyName: nameById.get(inv.customerId) ?? inv.customerId, totalOutstanding: 0, days0_30: 0, days31_60: 0, days61_90: 0, days91_plus: 0 };
        byCustomer.set(inv.customerId, row);
      }
      row[bucket] += outstanding;
      row.totalOutstanding += outstanding;
    }
    return [...byCustomer.values()];
  }

  private emptyCashflow(): CashflowSummary {
    return { openingBalance: 0, totalInflow: 0, totalOutflow: 0, netFlow: 0, closingBalance: 0 };
  }
}
