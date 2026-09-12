/**
 * M24 — cache/cache.middleware.ts
 * OWN: Controlled HTTP cache layer.
 *
 * Framework-agnostic (see M23 tenant-isolation.guard.ts note): expressed as
 * a plain function over a minimal request/response shape rather than a
 * hard Express dependency, until the real middleware signature is verified.
 */

import { redisCacheService, RedisCacheService } from './redis-cache.service';
import { cacheKeyBuilder, CacheKeyBuilder } from './cache-key-builder';

export interface CacheableRequest {
  tenantId: string;
  scopeSuffix?: string;
  namespace: string;
  entity: string;
  identifier: string;
}

export interface CacheMiddlewareResult<T> {
  hit: boolean;
  value: T | null;
}

export class CacheMiddleware {
  constructor(
    private readonly cache: RedisCacheService = redisCacheService,
    private readonly keyBuilder: CacheKeyBuilder = cacheKeyBuilder,
  ) {}

  /**
   * Try to serve a request from cache. Callers that get { hit: false } must
   * compute the response themselves and call `store` to populate the cache.
   */
  async tryServe<T>(request: CacheableRequest): Promise<CacheMiddlewareResult<T>> {
    const key = this.keyBuilder.build(request);
    const value = await this.cache.get<T>(key);
    return { hit: value !== null, value };
  }

  async store<T>(request: CacheableRequest, value: T, ttlSeconds = 300): Promise<void> {
    const key = this.keyBuilder.build(request);
    await this.cache.set(key, value, ttlSeconds);
  }
}

export const cacheMiddleware = new CacheMiddleware();
