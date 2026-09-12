/**
 * M24 — cache/redis-cache.service.ts
 * OWN: get/set/delete cache values.
 *
 * WIRED (2026-09-12): redis/ioredis/bullmq ARE real dependencies (repo-root
 * package.json), but no active Redis cache client exists anywhere in this
 * repo — see adapters/real-cache-client.ts for the full, corrected finding.
 * Default client is `realCacheClient`, a documented process-local
 * implementation, not a guessed Redis connection.
 */

import { realCacheClient } from '../adapters/real-cache-client';

export interface RedisClientLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

const DEFAULT_TTL_SECONDS = 300;

export class RedisCacheService {
  constructor(private readonly client: RedisClientLike = realCacheClient) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    await this.client.set(key, JSON.stringify(value), ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    await Promise.all(keys.map((k) => this.client.del(k)));
    return keys.length;
  }

  /** Cache-aside helper: return cached value, or compute + cache + return. */
  async getOrSet<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await compute();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

export const redisCacheService = new RedisCacheService();
