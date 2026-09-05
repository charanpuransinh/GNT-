import { prisma } from '@/common/config/prisma';
import { IPurchaseService } from '../report.internal';
import { PurchaseReportData, PurchaseReportFilters } from '../../types/report.types';

/**
 * M17 → M07 adapter (REAL) — असली purchase_invoice table से data (fake empty नहीं)।
 */
export class PurchaseAdapter implements IPurchaseService {
  async getPurchaseRegister(filters: PurchaseReportFilters): Promise<PurchaseReportData> {
    if (!filters.companyId) {
      return { rows: [], summary: { totalPOs: 0, totalAmount: 0, totalReceived: 0, totalPending: 0 } };
    }

    const invoices = await prisma.purchase_invoice.findMany({
      where: {
        company_id: filters.companyId,
        ...(filters.dateFrom || filters.dateTo ? {
          invoice_date: {
            ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
            ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
          },
        } : {}),
      },
      include: { items: true },
      orderBy: { invoice_date: 'desc' },
      take: 500,
    });

    const supplierIds = [...new Set(invoices.map((i) => i.supplier_id))];
    const suppliers = await prisma.party_master.findMany({ where: { id: { in: supplierIds } } });
    const supplierName = new Map(suppliers.map((s) => [s.id, s.name]));

    const rows = invoices.flatMap((inv) =>
      inv.items.map((item) => {
        const amount = Number(item.amount ?? inv.total_amount ?? 0);
        return {
          poId: inv.id,
          poDate: inv.invoice_date.toISOString().slice(0, 10),
          supplierName: supplierName.get(inv.supplier_id) ?? 'Unknown',
          status: String(inv.status),
          productName: item.product_id ?? 'Item',
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount,
          receivedQty: 0,
          pendingQty: Number(item.quantity),
        };
      })
    );

    return {
      rows,
      summary: {
        totalPOs: invoices.length,
        totalAmount: rows.reduce((s, r) => s + r.amount, 0),
        totalReceived: rows.reduce((s, r) => s + r.receivedQty, 0),
        totalPending: rows.reduce((s, r) => s + r.pendingQty, 0),
      },
    };
  }
}
