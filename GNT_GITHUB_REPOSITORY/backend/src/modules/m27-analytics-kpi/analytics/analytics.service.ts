/**
 * M27 — analytics/analytics.service.ts
 * OWN: Business analytics orchestration.
 */

import { MetricsService, metricsService, MetricDefinition } from './metrics.service';
import { AnalyticsQueryService, analyticsQueryService } from './analytics-query.service';

export interface AnalyticsResult {
  metricKey: string;
  label: string;
  value: number;
  aggregation: string;
  computedAt: string;
}

export class AnalyticsService {
  constructor(
    private readonly metrics: MetricsService = metricsService,
    private readonly queryService: AnalyticsQueryService = analyticsQueryService,
  ) {}

  async computeMetric(
    tenantId: string,
    metricKey: string,
    fromDate: string,
    toDate: string,
  ): Promise<AnalyticsResult | null> {
    const definition = this.metrics.getDefinition(tenantId, metricKey);
    if (!definition) return null;

    const series = await this.queryService.fetchForMetric(definition, fromDate, toDate);
    const values = series.map((p) => p.value);
    const value = this.metrics.calculate(values, definition.aggregation);

    return {
      metricKey: definition.metricKey,
      label: definition.label,
      value,
      aggregation: definition.aggregation,
      computedAt: new Date().toISOString(),
    };
  }

  async computeMany(
    tenantId: string,
    metricKeys: string[],
    fromDate: string,
    toDate: string,
  ): Promise<AnalyticsResult[]> {
    const results = await Promise.all(
      metricKeys.map((key) => this.computeMetric(tenantId, key, fromDate, toDate)),
    );
    return results.filter((r): r is AnalyticsResult => r !== null);
  }
}

export const analyticsService = new AnalyticsService();
