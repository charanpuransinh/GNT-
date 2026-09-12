/**
 * M24 — monitoring/cache-metrics.service.ts
 * OWN: Cache hit/miss/error metrics.
 */

export interface CacheMetricEvent {
  namespace: string;
  outcome: 'HIT' | 'MISS' | 'ERROR';
}

export interface CacheMetricsSnapshot {
  namespace: string;
  hits: number;
  misses: number;
  errors: number;
  hitRatio: number;
}

export class CacheMetricsService {
  private counts = new Map<string, { hits: number; misses: number; errors: number }>();

  record(event: CacheMetricEvent): void {
    const current = this.counts.get(event.namespace) ?? { hits: 0, misses: 0, errors: 0 };
    if (event.outcome === 'HIT') current.hits += 1;
    else if (event.outcome === 'MISS') current.misses += 1;
    else current.errors += 1;
    this.counts.set(event.namespace, current);
  }

  snapshot(namespace: string): CacheMetricsSnapshot {
    const current = this.counts.get(namespace) ?? { hits: 0, misses: 0, errors: 0 };
    const total = current.hits + current.misses;
    return {
      namespace,
      hits: current.hits,
      misses: current.misses,
      errors: current.errors,
      hitRatio: total > 0 ? current.hits / total : 0,
    };
  }
}

export const cacheMetricsService = new CacheMetricsService();
