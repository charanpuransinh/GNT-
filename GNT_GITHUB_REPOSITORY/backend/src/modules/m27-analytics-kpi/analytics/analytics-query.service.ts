/**
 * M27 — analytics/analytics-query.service.ts
 * OWN: Optimized analytics queries.
 *
 * WIRED (2026-09-12): one real source is registered by default —
 * "sales_invoice" (adapters/real-sales-analytics-source.ts), a direct
 * read-only query against the real SalesInvoice table (same pattern M17's
 * own SalesAdapter already uses). `registerSource()` remains the extension
 * point for additional sources (HR, accounting, inventory, ...) — not
 * exhaustively wired across every module in this pass.
 */

import { MetricDefinition, MetricDataPoint } from './metrics.service';

export interface AnalyticsDataSource {
  fetchSeries(
    tenantId: string,
    sourceEntity: string,
    sourceField: string | undefined,
    fromDate: string,
    toDate: string,
  ): Promise<MetricDataPoint[]>;
}

export class AnalyticsQueryService {
  private sources = new Map<string, AnalyticsDataSource>();

  registerSource(sourceEntity: string, source: AnalyticsDataSource): void {
    this.sources.set(sourceEntity, source);
  }

  async fetchForMetric(
    definition: MetricDefinition,
    fromDate: string,
    toDate: string,
  ): Promise<MetricDataPoint[]> {
    const source = this.sources.get(definition.sourceEntity);
    if (!source) {
      // No verified source adapter — return empty rather than guessing a query.
      return [];
    }
    return source.fetchSeries(definition.tenantId, definition.sourceEntity, definition.sourceField, fromDate, toDate);
  }
}

export const analyticsQueryService = new AnalyticsQueryService();

import { realSalesAnalyticsSource } from '../adapters/real-sales-analytics-source';
analyticsQueryService.registerSource('sales_invoice', realSalesAnalyticsSource);
