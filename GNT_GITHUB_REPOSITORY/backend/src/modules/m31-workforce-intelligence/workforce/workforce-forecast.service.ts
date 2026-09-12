/**
 * M31 — workforce/workforce-forecast.service.ts
 * OWN: Forecast workforce demand.
 * Backs table: workforce_forecast (proposed, tenant-owned).
 *
 * VERIFICATION NEEDED: real M30 forecast provider — this depends on M30's
 * public ForecastService/ForecastProvider contract, not its internals.
 */

export interface WorkforceDemandPoint {
  date: string;
  predictedHeadcountNeeded: number;
}

export interface WorkforceForecastProvider {
  forecastDemand(tenantId: string, departmentId: string, horizonDays: number): Promise<WorkforceDemandPoint[]>;
}

export class WorkforceForecastService {
  constructor(private readonly provider: WorkforceForecastProvider) {}

  async forecast(tenantId: string, departmentId: string, horizonDays: number): Promise<WorkforceDemandPoint[]> {
    return this.provider.forecastDemand(tenantId, departmentId, horizonDays);
  }
}
