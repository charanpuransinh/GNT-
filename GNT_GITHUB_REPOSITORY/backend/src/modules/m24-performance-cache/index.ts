/**
 * M24 — Performance, Cache & Database Optimization
 * index.ts — Public M24 exports.
 *
 * PROVIDE (per blueprint): Cache service, cache middleware, performance
 * metrics, optimization interfaces.
 * FORBIDDEN: bypassing tenant filters, caching unscoped sensitive data,
 * direct financial writes — none of these files do any of that; every
 * cache key requires a tenantId (see cache-key-builder.ts).
 */

export {
  RedisCacheService,
  redisCacheService,
  type RedisClientLike,
} from './cache/redis-cache.service';

export {
  CacheKeyBuilder,
  cacheKeyBuilder,
  type CacheKeyParts,
} from './cache/cache-key-builder';

export {
  CacheInvalidationService,
  cacheInvalidationService,
  type InvalidationRequest,
} from './cache/cache-invalidation.service';

export {
  CacheMiddleware,
  cacheMiddleware,
  type CacheableRequest,
  type CacheMiddlewareResult,
} from './cache/cache.middleware';

export {
  QueryOptimizer,
  queryOptimizer,
  type QueryExecutionSample,
  type OptimizationRecommendation,
} from './database/query-optimizer';

export {
  IndexManager,
  indexManager,
  IndexManagerError,
  type IndexDefinition,
  type SchemaAdapter,
} from './database/index-manager';

export {
  PerformanceMonitorService,
  performanceMonitorService,
  type OperationMetric,
  type PerformanceSnapshot,
} from './monitoring/performance-monitor.service';

export {
  CacheMetricsService,
  cacheMetricsService,
  type CacheMetricEvent,
  type CacheMetricsSnapshot,
} from './monitoring/cache-metrics.service';
