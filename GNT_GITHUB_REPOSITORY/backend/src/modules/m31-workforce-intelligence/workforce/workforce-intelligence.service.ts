/**
 * M31 — workforce/workforce-intelligence.service.ts
 * OWN: Workforce intelligence orchestration — the top-level entry point
 * that composes forecast + capacity planning + KPIs.
 */

import { WorkforceForecastService } from './workforce-forecast.service';
import { CapacityPlanningService, capacityPlanningService, CapacityInput, CapacityGap } from './capacity-planning.service';
import { WorkforceKpiService } from '../analytics/workforce-kpi.service';

export interface WorkforceIntelligenceReport {
  tenantId: string;
  capacityGaps: CapacityGap[];
  kpis: Awaited<ReturnType<WorkforceKpiService['snapshot']>>;
  generatedAt: string;
}

export class WorkforceIntelligenceService {
  constructor(
    private readonly forecastService: WorkforceForecastService,
    private readonly kpiService: WorkforceKpiService,
    private readonly capacityPlanning: CapacityPlanningService = capacityPlanningService,
  ) {}

  async buildReport(tenantId: string, capacityInputs: CapacityInput[]): Promise<WorkforceIntelligenceReport> {
    const capacityGaps = this.capacityPlanning.evaluate(capacityInputs);
    const kpis = await this.kpiService.snapshot(tenantId);

    return {
      tenantId,
      capacityGaps,
      kpis,
      generatedAt: new Date().toISOString(),
    };
  }
}
