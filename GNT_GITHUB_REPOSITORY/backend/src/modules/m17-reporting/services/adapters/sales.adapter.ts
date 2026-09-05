import { prisma } from '@/common/config/prisma';
import { ISalesService } from '../report.internal';
import { SalesReportData, SalesReportFilters } from '../../types/report.types';

/**
 * M17 → M08 adapter (REAL) — असली sales_invoice table से data (fake empty नहीं)।
 * M08 की reporting facade की ज़रूरत नहीं — public schema se direct READ-ONLY।
 */
export class SalesAdapter implements ISalesService {
  async getSalesRegister(filters: SalesReportFilters): Promise<SalesReportData> {
    const companyId = filters.companyId;
    if (!companyId) {
      return { rows: [], summary: this.emptySummary() };
    }

    const invoices = await prisma.salesInvoice.findMany({
      where: {
        companyId,
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.dateFrom || filters.dateTo ? {
          invoiceDate: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          },
        } : {}),
      },
      include: { items: true },
      orderBy: { invoiceDate: 'desc' },
      take: 500,
    });

    const customerIds = [...new Set(invoices.map((i) => i.customerId))];
    const customers = await prisma.party_master.findMany({ where: { id: { in: customerIds } } });
    const customerName = new Map(customers.map((c) => [c.id, c.name]));

    const rows = invoices.flatMap((inv) =>
      inv.items.map((item) => {
        const taxable = Number(item.netAmount);
        const tax = Number(item.taxAmount);
        return {
          invoiceId: inv.id,
          invoiceDate: inv.invoiceDate.toISOString().slice(0, 10),
          customerName: customerName.get(inv.customerId) ?? 'Unknown',
          productName: item.productId ?? 'Item',
          quantity: Number(item.quantity),
          unitPrice: Number(item.rate),
          grossAmount: Number(item.amount),
          discount: Number(item.discountAmount),
          taxableAmount: taxable,
          cgst: tax / 2,
          sgst: tax / 2,
          igst: 0,
          totalTax: tax,
          totalAmount: taxable + tax,
          marginPercent: 0,
        };
      })
    );

    return {
      rows,
      summary: {
        totalInvoices: invoices.length,
        totalQuantity: rows.reduce((s, r) => s + r.quantity, 0),
        totalGross: rows.reduce((s, r) => s + r.grossAmount, 0),
        totalDiscount: rows.reduce((s, r) => s + r.discount, 0),
        totalTax: rows.reduce((s, r) => s + r.totalTax, 0),
        totalRevenue: rows.reduce((s, r) => s + r.totalAmount, 0),
        avgMargin: 0,
      },
    };
  }

  private emptySummary(): SalesReportData['summary'] {
    return {
      totalInvoices: 0, totalQuantity: 0, totalGross: 0, totalDiscount: 0,
      totalTax: 0, totalRevenue: 0, avgMargin: 0,
    };
  }
}
