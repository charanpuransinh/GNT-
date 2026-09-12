// ============================================================================
// M24 — Performance, Cache & Database Optimization — wiring tests
//
// Cache tests don't need TEST_DB (process-local, no external dependency —
// verified: repo has no Redis), but IndexManager's real-schema-adapter does
// real Postgres introspection, so that suite is DB-gated.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { redisCacheService } from '../cache/redis-cache.service';
import { cacheKeyBuilder } from '../cache/cache-key-builder';
import { cacheInvalidationService } from '../cache/cache-invalidation.service';
import { cacheMiddleware } from '../cache/cache.middleware';
import { indexManager } from '../database/index-manager';
import { queryOptimizer } from '../database/query-optimizer';
import { performanceMonitorService } from '../monitoring/performance-monitor.service';
import { cacheMetricsService } from '../monitoring/cache-metrics.service';

describe('M24 — cache layer (process-local, real repo has no Redis)', () => {
  it('round-trips a value through redisCacheService using a real tenant-scoped key', async () => {
    const key = cacheKeyBuilder.build({ tenantId: 't1', namespace: 'party', entity: 'customer', identifier: 'c1' });
    await redisCacheService.set(key, { name: 'Acme' }, 60);
    const value = await redisCacheService.get<{ name: string }>(key);
    expect(value).toEqual({ name: 'Acme' });
  });

  it('cache key always embeds tenant id (Rule 14)', () => {
    expect(() => cacheKeyBuilder.build({ tenantId: '', namespace: 'x', entity: 'y', identifier: 'z' })).toThrow();
  });

  it('invalidateNamespace clears everything cached under a tenant+namespace', async () => {
    await redisCacheService.set(cacheKeyBuilder.build({ tenantId: 't2', namespace: 'sales', entity: 'invoice', identifier: 'i1' }), 1);
    await redisCacheService.set(cacheKeyBuilder.build({ tenantId: 't2', namespace: 'sales', entity: 'invoice', identifier: 'i2' }), 2);
    const cleared = await cacheInvalidationService.invalidateNamespace('t2', 'sales');
    expect(cleared).toBe(2);
    expect(await redisCacheService.get(cacheKeyBuilder.build({ tenantId: 't2', namespace: 'sales', entity: 'invoice', identifier: 'i1' }))).toBeNull();
  });

  it('cacheMiddleware.tryServe reports a miss then a hit after store', async () => {
    const req = { tenantId: 't3', namespace: 'reports', entity: 'kpi', identifier: 'k1' };
    const miss = await cacheMiddleware.tryServe(req);
    expect(miss.hit).toBe(false);
    await cacheMiddleware.store(req, { total: 42 });
    const hit = await cacheMiddleware.tryServe<{ total: number }>(req);
    expect(hit.hit).toBe(true);
    expect(hit.value?.total).toBe(42);
  });
});

describe('M24 — in-memory analytics (no external dependency)', () => {
  it('queryOptimizer flags a slow query', () => {
    queryOptimizer.clear();
    queryOptimizer.record({ queryName: 'slow-report', durationMs: 1200 });
    const recs = queryOptimizer.analyze();
    expect(recs.some((r) => r.queryName === 'slow-report' && r.severity === 'HIGH')).toBe(true);
  });

  it('performanceMonitorService computes p95 and notifies slow-operation listeners', () => {
    let notified = false;
    performanceMonitorService.onSlowOperation(() => { notified = true; });
    for (let i = 0; i < 10; i++) {
      performanceMonitorService.record({ operationName: 'op-x', tenantId: 't1', durationMs: 100 + i * 10, success: true });
    }
    performanceMonitorService.record({ operationName: 'op-x', tenantId: 't1', durationMs: 1500, success: true });
    expect(notified).toBe(true);
    const snap = performanceMonitorService.snapshot('op-x', 't1');
    expect(snap.requestCount).toBe(11);
  });

  it('cacheMetricsService computes hit ratio', () => {
    cacheMetricsService.record({ namespace: 'ns1', outcome: 'HIT' });
    cacheMetricsService.record({ namespace: 'ns1', outcome: 'HIT' });
    cacheMetricsService.record({ namespace: 'ns1', outcome: 'MISS' });
    const snap = cacheMetricsService.snapshot('ns1');
    expect(snap.hitRatio).toBeCloseTo(2 / 3);
  });
});

describe.runIf(process.env.TEST_DB === '1')('M24 — IndexManager (real Postgres introspection)', () => {
  it('lists the real index M23 created on security_policy', async () => {
    const indexes = await indexManager.listIndexes('security_policy');
    expect(indexes.some((i) => i.name === 'security_policy_company_id_resource_action_idx')).toBe(true);
  });

  it('proposeIndex refuses a column set that already exists', async () => {
    const existing = await indexManager.listIndexes('security_policy');
    const target = existing.find((i) => i.name === 'security_policy_company_id_resource_action_idx')!;
    await expect(indexManager.proposeIndex({ table: 'security_policy', columns: target.columns })).rejects.toThrow();
  });

  it('proposeIndex returns a migration reference (never issues DDL) for a genuinely new index', async () => {
    const result = await indexManager.proposeIndex({ table: 'security_policy', columns: ['active'] });
    expect(result.migrationRef).toMatch(/database\/migrations/);
    const cols = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE tablename = 'security_policy' AND indexdef ILIKE '%(active)%'
    `;
    expect(cols.length).toBe(0);
  });
});
