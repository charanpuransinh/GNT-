/**
 * M30 — reliability/idempotency.service.ts
 * OWN: Duplicate-request protection.
 * Rule 11: payment, invoice, webhook, sync, integration and automation
 * operations must be idempotent.
 *
 * WIRED (2026-09-12): default instance backed by the new
 * `idempotency_record` table (adapters/real-idempotency-store.ts) —
 * verified this doesn't duplicate anything: M08/M22 already have their own
 * ad hoc idempotency handling (unique-constraint based), left untouched;
 * this is a new, generic mechanism for future code paths to opt into.
 */

export interface IdempotencyRecord {
  key: string;
  tenantId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  result?: unknown;
  createdAt: string;
}

export interface IdempotencyStore {
  find(tenantId: string, key: string): Promise<IdempotencyRecord | null>;
  save(record: IdempotencyRecord): Promise<void>;
}

export class IdempotencyService {
  constructor(private readonly store: IdempotencyStore) {}

  /**
   * Runs `operation` at most once per (tenantId, key). A repeated call with
   * the same key returns the previously stored result instead of re-executing.
   */
  async runOnce<T>(tenantId: string, key: string, operation: () => Promise<T>): Promise<T> {
    const existing = await this.store.find(tenantId, key);
    if (existing?.status === 'COMPLETED') {
      return existing.result as T;
    }
    if (existing?.status === 'IN_PROGRESS') {
      throw new Error('Duplicate request already in progress for this idempotency key');
    }

    await this.store.save({ key, tenantId, status: 'IN_PROGRESS', createdAt: new Date().toISOString() });

    try {
      const result = await operation();
      await this.store.save({ key, tenantId, status: 'COMPLETED', result, createdAt: new Date().toISOString() });
      return result;
    } catch (err) {
      await this.store.save({ key, tenantId, status: 'FAILED', createdAt: new Date().toISOString() });
      throw err;
    }
  }
}

import { realIdempotencyStore } from '../adapters/real-idempotency-store';
export const idempotencyService = new IdempotencyService(realIdempotencyStore);
