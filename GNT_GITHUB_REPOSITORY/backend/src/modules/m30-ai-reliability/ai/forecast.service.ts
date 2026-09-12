/**
 * M30 — ai/forecast.service.ts
 * OWN: Forecasting.
 */

import { AiDataGuard, aiDataGuard, AiRequestContext } from './ai-data-guard';

export interface ForecastRequest {
  tenantId: string;
  seriesFields: Record<string, unknown>[];
  allowedFields: string[];
  horizonDays: number;
}

export interface ForecastPoint {
  date: string;
  predictedValue: number;
  confidenceLow?: number;
  confidenceHigh?: number;
}

export interface ForecastProvider {
  forecast(series: Record<string, unknown>[], horizonDays: number): Promise<ForecastPoint[]>;
}

export class ForecastService {
  constructor(
    private readonly provider: ForecastProvider,
    private readonly dataGuard: AiDataGuard = aiDataGuard,
  ) {}

  async generate(request: ForecastRequest): Promise<ForecastPoint[]> {
    const context: AiRequestContext = { tenantId: request.tenantId, allowedFields: request.allowedFields };
    const minimized = this.dataGuard.minimizeMany(request.seriesFields, context);
    return this.provider.forecast(minimized, request.horizonDays);
  }
}
