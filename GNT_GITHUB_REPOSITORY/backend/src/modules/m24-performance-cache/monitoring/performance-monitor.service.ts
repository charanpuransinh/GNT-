/**
 * M24 — monitoring/performance-monitor.service.ts
 * OWN: Latency, throughput and slow-operation metrics.
 * Section 29 Observability Requirement: M24 is the performance layer
 * (M27 owns business analytics — do not duplicate).
 */

export interface OperationMetric {
  operationName: string;
  tenantId: string;
  durationMs: number;
  success: boolean;
  occurredAt: string;
}

export interface PerformanceSnapshot {
  operationName: string;
  requestCount: number;
  successCount: number;
  failureCount: number;
  avgDurationMs: number;
  p95DurationMs: number;
}

const SLOW_OPERATION_THRESHOLD_MS = 1000;

export class PerformanceMonitorService {
  private metrics: OperationMetric[] = [];
  private slowOperationListeners: Array<(metric: OperationMetric) => void> = [];

  record(metric: Omit<OperationMetric, 'occurredAt'>): void {
    const full: OperationMetric = { ...metric, occurredAt: new Date().toISOString() };
    this.metrics.push(full);
    if (full.durationMs >= SLOW_OPERATION_THRESHOLD_MS) {
      this.slowOperationListeners.forEach((listener) => listener(full));
    }
  }

  onSlowOperation(listener: (metric: OperationMetric) => void): void {
    this.slowOperationListeners.push(listener);
  }

  snapshot(operationName: string, tenantId?: string): PerformanceSnapshot {
    const filtered = this.metrics.filter(
      (m) => m.operationName === operationName && (!tenantId || m.tenantId === tenantId),
    );
    const durations = filtered.map((m) => m.durationMs).sort((a, b) => a - b);
    const successCount = filtered.filter((m) => m.success).length;

    return {
      operationName,
      requestCount: filtered.length,
      successCount,
      failureCount: filtered.length - successCount,
      avgDurationMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      p95DurationMs: durations.length ? durations[Math.floor(durations.length * 0.95)] ?? durations[durations.length - 1] : 0,
    };
  }
}

export const performanceMonitorService = new PerformanceMonitorService();
