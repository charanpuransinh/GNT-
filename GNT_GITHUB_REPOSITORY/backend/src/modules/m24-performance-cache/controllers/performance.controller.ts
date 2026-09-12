/**
 * M24 — controllers/performance.controller.ts
 * OWN: Performance/Cache/Index introspection HTTP API. Framework-agnostic,
 * standard success/failure envelope (same shape as M23/M26/M27 controllers).
 *
 * Read-mostly by design: performanceMonitorService/cacheMetricsService/
 * queryOptimizer are pure in-memory, per-process counters — nothing in the
 * app currently calls their .record() methods (documented, not fabricated;
 * see M24_INTEGRATION_NOTES.md), so snapshots are real but may legitimately
 * be all-zero until request/query instrumentation is wired in separately.
 * indexManager is real Postgres introspection (pg_indexes) and never issues
 * DDL — proposeIndex only returns a migration reference for a human to
 * review (Database Contract, Section 23).
 */

import { PerformanceMonitorService, performanceMonitorService } from '../monitoring/performance-monitor.service';
import { CacheMetricsService, cacheMetricsService } from '../monitoring/cache-metrics.service';
import { QueryOptimizer, queryOptimizer, type OptimizationRecommendation } from '../database/query-optimizer';
import { IndexManager, indexManager, type IndexDefinition } from '../database/index-manager';

export interface PerformanceAuthContext {
  userId: string;
  tenantId: string;
  permissions: string[];
}

export interface ApiSuccess<T> { success: true; data: T; meta: { correlationId: string } }
export interface ApiFailure { success: false; error: { code: string; message: string }; meta: { correlationId: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class PerformancePermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PerformancePermissionDeniedError';
  }
}

export class PerformanceController {
  constructor(
    private readonly perf: PerformanceMonitorService = performanceMonitorService,
    private readonly cacheMetrics: CacheMetricsService = cacheMetricsService,
    private readonly optimizer: QueryOptimizer = queryOptimizer,
    private readonly indexes: IndexManager = indexManager,
  ) {}

  async performanceSnapshot(
    auth: PerformanceAuthContext,
    operationName: string,
    correlationId: string,
  ): Promise<ApiResponse<ReturnType<PerformanceMonitorService['snapshot']>>> {
    try {
      this.requirePermission(auth, 'M24:view');
      if (!operationName) throw new Error('operation is required');
      // tenant-scoped: only this caller's own recorded operations, never another tenant's
      const data = this.perf.snapshot(operationName, auth.tenantId);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async cacheMetricsSnapshot(
    auth: PerformanceAuthContext,
    namespace: string,
    correlationId: string,
  ): Promise<ApiResponse<ReturnType<CacheMetricsService['snapshot']>>> {
    try {
      this.requirePermission(auth, 'M24:view');
      if (!namespace) throw new Error('namespace is required');
      const data = this.cacheMetrics.snapshot(namespace);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async queryRecommendations(auth: PerformanceAuthContext, correlationId: string): Promise<ApiResponse<OptimizationRecommendation[]>> {
    try {
      this.requirePermission(auth, 'M24:view');
      const data = this.optimizer.analyze();
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async listIndexes(auth: PerformanceAuthContext, table: string, correlationId: string): Promise<ApiResponse<IndexDefinition[]>> {
    try {
      this.requirePermission(auth, 'M24:view');
      const data = await this.indexes.listIndexes(table);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async proposeIndex(
    auth: PerformanceAuthContext,
    definition: IndexDefinition,
    correlationId: string,
  ): Promise<ApiResponse<{ migrationRef: string }>> {
    try {
      this.requirePermission(auth, 'M24:create');
      const data = await this.indexes.proposeIndex(definition);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  private requirePermission(auth: PerformanceAuthContext, permission: string): void {
    if (!auth.permissions.includes(permission)) {
      throw new PerformancePermissionDeniedError(`Missing permission ${permission}`);
    }
  }

  private toFailure(err: unknown, correlationId: string): ApiFailure {
    const code = err instanceof PerformancePermissionDeniedError ? 'PERFORMANCE_ACCESS_DENIED' : 'PERFORMANCE_ERROR';
    const message = err instanceof Error ? err.message : 'Unexpected performance error';
    return { success: false, error: { code, message }, meta: { correlationId } };
  }
}

export const performanceController = new PerformanceController();
