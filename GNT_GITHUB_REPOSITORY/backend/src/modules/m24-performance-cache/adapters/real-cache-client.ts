/**
 * M24 — adapters/real-cache-client.ts
 * WIRED (2026-09-12) — VERIFIED, not guessed: `backend/package.json` has no
 * `redis`/`ioredis`/`bullmq` dependency, and project memory records the
 * owner's decision (2026-09-06) that cross-module transport is in-process
 * only, "NO Redis/BullMQ (single-server scale)". There is no real Redis
 * client to wire this into.
 *
 * Given that, the honest choice is to make the process-local cache the
 * REAL implementation (not a "fallback placeholder") — same in-memory
 * logic the blueprint shipped, renamed to reflect that it is genuinely
 * what runs. Flagged limitation: this cache is per-process, not shared
 * across multiple server instances. If GNT is ever scaled horizontally,
 * this must be revisited (owner decision, not a guess to make here).
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
