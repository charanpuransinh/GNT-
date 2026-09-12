/**
 * M27 — reports/kpi.service.ts
 * OWN: KPI calculations and targets.
 * Backs tables: kpi_definition, kpi_target (proposed, tenant-owned).
 */

import { AnalyticsService, analyticsService } from '../analytics/analytics.service';

export interface KpiDefinition {
  kpiId: string;
  tenantId: string;
  metricKey: string;
  targetValue: number;
  warningThresholdPct: number; // e.g. 90 means warn at 90% of target
}

export interface KpiEvaluation {
  kpiId: string;
  currentValue: number;
  targetValue: number;
  achievedPct: number;
  status: 'ON_TRACK' | 'WARNING' | 'BREACHED';
  evaluatedAt: string;
}

export class KpiService {
  constructor(private readonly analytics: AnalyticsService = analyticsService) {}

  async evaluate(definition: KpiDefinition, fromDate: string, toDate: string): Promise<KpiEvaluation | null> {
    const result = await this.analytics.computeMetric(definition.tenantId, definition.metricKey, fromDate, toDate);
    if (!result) return null;

    const achievedPct = definition.targetValue !== 0 ? (result.value / definition.targetValue) * 100 : 0;
    let status: KpiEvaluation['status'] = 'ON_TRACK';
    if (achievedPct < definition.warningThresholdPct) status = 'WARNING';
    if (achievedPct < 0) status = 'BREACHED';

    return {
      kpiId: definition.kpiId,
      currentValue: result.value,
      targetValue: definition.targetValue,
      achievedPct,
      status,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const kpiService = new KpiService();
