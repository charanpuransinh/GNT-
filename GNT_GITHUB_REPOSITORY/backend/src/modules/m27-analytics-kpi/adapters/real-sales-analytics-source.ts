/**
 * M27 — adapters/real-sales-analytics-source.ts
 * WIRED (2026-09-12): real AnalyticsDataSource for sourceEntity
 * "sales_invoice", querying the REAL `SalesInvoice` table directly
 * (companyId, invoiceDate, grandTotal — verified field names). This is the
 * same "direct read-only query against the public schema for reporting"
 * pattern M17's own SalesAdapter already uses (see its header comment) —
 * not a new precedent, not a private-table violation.
 *
 * Only one source is wired here to demonstrate real integration end to
 * end; `analyticsQueryService.registerSource()` is the extension point for
 * additional sourceEntity values (HR, accounting, inventory, ...) — left
 * for future work rather than guessed wholesale across a dozen modules.
 */

import { prisma } from '@/common/config/prisma';
import type { AnalyticsDataSource } from '../analytics/analytics-query.service';
import type { MetricDataPoint } from '../analytics/metrics.service';

export class RealSalesAnalyticsSource implements AnalyticsDataSource {
  async fetchSeries(
    tenantId: string,
    _sourceEntity: string,
    sourceField: string | undefined,
    fromDate: string,
    toDate: string,
  ): Promise<MetricDataPoint[]> {
    const invoices = await prisma.salesInvoice.findMany({
      where: { companyId: tenantId, invoiceDate: { gte: new Date(fromDate), lte: new Date(toDate) } },
      select: { invoiceDate: true, grandTotal: true, netAmount: true, totalTax: true },
      orderBy: { invoiceDate: 'asc' },
    });

    const field = sourceField === 'netAmount' ? 'netAmount' : sourceField === 'totalTax' ? 'totalTax' : 'grandTotal';

    return invoices.map((inv) => ({
      timestamp: inv.invoiceDate.toISOString().slice(0, 10),
      value: Number(inv[field]),
    }));
  }
}

export const realSalesAnalyticsSource = new RealSalesAnalyticsSource();
