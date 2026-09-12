/**
 * M24 — cache/cache-invalidation.service.ts
 * OWN: Invalidate dependent cache entries.
 */

import { redisCacheService, RedisCacheService } from './redis-cache.service';
import { cacheKeyBuilder, CacheKeyBuilder } from './cache-key-builder';

export interface InvalidationRequest {
  tenantId: string;
  namespace: string;
  entity: string;
  identifier?: string;
}

export class CacheInvalidationService {
  constructor(
    private readonly cache: RedisCacheService = redisCacheService,
    private readonly keyBuilder: CacheKeyBuilder = cacheKeyBuilder,
  ) {}

  /** Invalidate a single cached entity, or an entire entity family for a tenant. */
  async invalidate(request: InvalidationRequest): Promise<number> {
    if (request.identifier) {
      const key = this.keyBuilder.build({
        tenantId: request.tenantId,
        namespace: request.namespace,
        entity: request.entity,
        identifier: request.identifier,
      });
      await this.cache.delete(key);
      return 1;
    }
    const pattern = this.keyBuilder.buildTenantPattern(request.tenantId, request.namespace, request.entity);
    return this.cache.deleteByPattern(pattern);
  }

  /** Invalidate everything cached for a tenant within a namespace (e.g. on bulk import). */
  async invalidateNamespace(tenantId: string, namespace: string): Promise<number> {
    const pattern = this.keyBuilder.buildTenantPattern(tenantId, namespace);
    return this.cache.deleteByPattern(pattern);
  }
}

export const cacheInvalidationService = new CacheInvalidationService();
