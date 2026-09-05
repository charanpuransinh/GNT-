import { prisma } from '@/common/config/prisma';
import { IGSTService } from '../report.internal';
import { GSTReportData, GSTReportFilters } from '../../types/report.types';

/**
 * M17 → M09 adapter (REAL) — असली gst_transaction table से data (fake empty नहीं)।
 */
export class GSTAdapter implements IGSTService {
  async getGSTTransactions(filters: GSTReportFilters): Promise<GSTReportData> {
    if (!filters.companyId) {
      return { rows: [], hsnSummary: [], summary: { totalTaxable: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0, grandTotalTax: 0 } };
    }

    const txs = await prisma.gst_transaction.findMany({
      where: {
        company_id: filters.companyId,
        ...(filters.dateFrom || filters.dateTo ? {
          transaction_date: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          },
        } : {}),
      },
      orderBy: { transaction_date: 'desc' },
      take: 500,
    });

    const rows = txs.map((t) => {
      const taxable = Number(t.taxable_amount);
      const tax = Number(t.total_tax_amount);
      return {
        invoiceId: t.reference_id ?? t.id,
        invoiceDate: t.transaction_date.toISOString().slice(0, 10),
        gstin: t.gstin ?? '',
        taxableValue: taxable,
        cgstAmount: Number(t.cgst_amount),
        sgstAmount: Number(t.sgst_amount),
        igstAmount: Number(t.igst_amount),
        totalTax: tax,
        invoiceValue: taxable + tax,
      };
    });

    return {
      rows,
      hsnSummary: [],
      summary: {
        totalTaxable: rows.reduce((s, r) => s + r.taxableValue, 0),
        totalCGST: rows.reduce((s, r) => s + r.cgstAmount, 0),
        totalSGST: rows.reduce((s, r) => s + r.sgstAmount, 0),
        totalIGST: rows.reduce((s, r) => s + r.igstAmount, 0),
        grandTotalTax: rows.reduce((s, r) => s + r.totalTax, 0),
      },
    };
  }

  async getHSNSummary() {
    return [];
  }
}
