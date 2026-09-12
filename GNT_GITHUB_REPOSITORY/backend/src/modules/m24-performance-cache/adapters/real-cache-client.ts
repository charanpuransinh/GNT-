/**
 * M24 — adapters/real-cache-client.ts
 * WIRED (2026-09-12) — CORRECTED 2026-09-12: an earlier version of this
 * comment said "no redis/ioredis/bullmq dependency exists", which was
 * wrong — it only checked backend/package.json. `redis`, `ioredis` and
 * `bullmq` ARE real dependencies, declared at the repo-root package.json
 * and resolvable from backend/src (Node's node_modules walk-up).
 *
 * Actual verified usage, re-checked directly against source:
 *   - ioredis: ONE call site (m01-foundation/repositories/app.repository.ts
 *     `checkCacheConnection()`) — a one-off health-check ping against
 *     `cacheConfig.url`, not a cache read/write client anywhere.
 *   - bullmq: ONE call site (m15-sync/events/sync.events.ts) — the exact
 *     legacy Redis-queue event bus project memory already flags as
 *     pending conversion to the in-process eventBus (owner decision,
 *     2026-09-06: cross-module transport is in-process only).
 * So: no ACTIVE Redis-backed cache client exists anywhere in this repo
 * for get/set caching — the conclusion (process-local cache) is unchanged,
 * only the stated reasoning was wrong and is fixed here.
 *
 * The honest choice remains: process-local cache as the REAL implementation
 * (not a "fallback placeholder"). Flagged limitation: per-process only, not
 * shared across multiple server instances. If GNT scales horizontally, or
 * the owner wants `checkCacheConnection()`'s optional Redis promoted into
 * an actual cache backend, that's an owner decision, not guessed here.
 */

import type { RedisClientLike } from '../cache/redis-cache.service';

export class ProcessLocalCacheClient implements RedisClientLike {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    return [...this.store.keys()].filter((k) => regex.test(k));
  }
}

export const realCacheClient = new ProcessLocalCacheClient();
