/**
 * M28 — adapters/real-report-data-provider.ts
 * WIRED (2026-09-12): ReportDataProvider backed by the real, wired M27
 * `analyticsService.computeMetric()`. One row per requested metric key
 * (columns = metric keys); a metric with no registered M27 data source
 * comes back as value 0 (M27's own documented behavior — "return empty
 * rather than guessing a query"), not an error.
 */

import { analyticsService } from '@/modules/m27-analytics-kpi';
import type { ReportDataProvider } from '../reports/report-builder';

export class RealReportDataProvider implements ReportDataProvider {
  async fetchRows(
    tenantId: string,
    sourceMetricKeys: string[],
    fromDate: string,
    toDate: string,
  ): Promise<Record<string, unknown>[]> {
    const results = await analyticsService.computeMany(tenantId, sourceMetricKeys, fromDate, toDate);
    const row: Record<string, unknown> = {};
    for (const r of results) row[r.metricKey] = r.value;
    return [row];
  }
}

export const realReportDataProvider = new RealReportDataProvider();
