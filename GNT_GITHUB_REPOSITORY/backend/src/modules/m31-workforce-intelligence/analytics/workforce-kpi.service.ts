/**
 * M31 — analytics/workforce-kpi.service.ts
 * OWN: Workforce KPIs.
 * Backs table: workforce_forecast (shared with workforce-forecast.service.ts).
 */

export interface WorkforceKpiSnapshot {
  tenantId: string;
  headcount: number;
  openRequirements: number;
  avgTimeToHireDays: number | null;
  attritionRatePct: number | null;
}

export interface WorkforceKpiDataSource {
  getHeadcount(tenantId: string): Promise<number>;
  getOpenRequirements(tenantId: string): Promise<number>;
  getTimeToHireSamples(tenantId: string): Promise<number[]>;
  getAttritionRate(tenantId: string): Promise<number | null>;
}

export class WorkforceKpiService {
  constructor(private readonly dataSource: WorkforceKpiDataSource) {}

  async snapshot(tenantId: string): Promise<WorkforceKpiSnapshot> {
    const [headcount, openRequirements, timeToHireSamples, attritionRatePct] = await Promise.all([
      this.dataSource.getHeadcount(tenantId),
      this.dataSource.getOpenRequirements(tenantId),
      this.dataSource.getTimeToHireSamples(tenantId),
      this.dataSource.getAttritionRate(tenantId),
    ]);

    const avgTimeToHireDays = timeToHireSamples.length > 0
      ? timeToHireSamples.reduce((a, b) => a + b, 0) / timeToHireSamples.length
      : null;

    return { tenantId, headcount, openRequirements, avgTimeToHireDays, attritionRatePct };
  }
}
