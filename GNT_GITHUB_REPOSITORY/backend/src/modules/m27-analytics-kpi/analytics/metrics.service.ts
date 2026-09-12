/**
 * M27 — analytics/metrics.service.ts
 * OWN: Metric definitions/calculation.
 * Section 29: M27 is the business analytics layer (M24 owns system
 * performance metrics — do not duplicate).
 */

export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';

export interface MetricDefinition {
  metricKey: string;
  tenantId: string;
  label: string;
  aggregation: AggregationType;
  sourceEntity: string;
  sourceField?: string;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export class MetricsService {
  private definitions = new Map<string, MetricDefinition>();

  defineMetric(definition: MetricDefinition): void {
    this.definitions.set(`${definition.tenantId}:${definition.metricKey}`, definition);
  }

  getDefinition(tenantId: string, metricKey: string): MetricDefinition | undefined {
    return this.definitions.get(`${tenantId}:${metricKey}`);
  }

  calculate(values: number[], aggregation: AggregationType): number {
    if (values.length === 0) return 0;
    switch (aggregation) {
      case 'SUM':
        return values.reduce((a, b) => a + b, 0);
      case 'AVG':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'COUNT':
        return values.length;
      case 'MIN':
        return Math.min(...values);
      case 'MAX':
        return Math.max(...values);
      default:
        return 0;
    }
  }
}

export const metricsService = new MetricsService();
