/**
 * M23 — tenant/cross-tenant-detector.service.ts
 * OWN: Detect suspicious cross-tenant boundary violations (repeated probing,
 * scripted enumeration, etc.), beyond simply blocking a single attempt.
 *
 * WIRED (2026-09-12): default store is `realCrossTenantAttemptStore`
 * (adapters/real-cross-tenant-store.ts), backed by M19's existing
 * SecurityEvent table (eventType='CROSS_TENANT_ATTEMPT') — no new table.
 */

import { realCrossTenantAttemptStore } from '../adapters/real-cross-tenant-store';

export interface CrossTenantAttempt {
  actorId: string;
  actorTenantId: string;
  targetTenantId: string;
  resourceType: string;
  resourceId?: string;
  correlationId: string;
  occurredAt?: string;
}

export interface CrossTenantAttemptStore {
  record(attempt: CrossTenantAttempt & { occurredAt: string }): Promise<void>;
  countRecentAttempts(actorId: string, windowMs: number): Promise<number>;
}

/** In-memory store — used only by unit tests that don't want real DB I/O. */
export class InMemoryCrossTenantAttemptStore implements CrossTenantAttemptStore {
  private attempts: Array<CrossTenantAttempt & { occurredAt: string }> = [];

  async record(attempt: CrossTenantAttempt & { occurredAt: string }): Promise<void> {
    this.attempts.push(attempt);
  }

  async countRecentAttempts(actorId: string, windowMs: number): Promise<number> {
    const cutoff = Date.now() - windowMs;
    return this.attempts.filter(
      (a) => a.actorId === actorId && new Date(a.occurredAt).getTime() >= cutoff,
    ).length;
  }
}

const SUSPICIOUS_THRESHOLD = 5;
const SUSPICIOUS_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export class CrossTenantDetectorService {
  constructor(private readonly store: CrossTenantAttemptStore) {}

  async recordAttempt(attempt: CrossTenantAttempt): Promise<{ suspicious: boolean; recentCount: number }> {
    const occurredAt = attempt.occurredAt ?? new Date().toISOString();
    await this.store.record({ ...attempt, occurredAt });
    const recentCount = await this.store.countRecentAttempts(attempt.actorId, SUSPICIOUS_WINDOW_MS);
    return { suspicious: recentCount >= SUSPICIOUS_THRESHOLD, recentCount };
  }
}

export const crossTenantDetectorService = new CrossTenantDetectorService(realCrossTenantAttemptStore);
