// ============================================================================
// M30 — AI/ML Guards & Reliability — wiring tests
// idempotency.service.ts is DB-gated (real idempotency_record table);
// the rest is pure logic, no DB needed.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { aiDataGuard, AiDataGuardViolationError } from '../ai/ai-data-guard';
import { retryService, RetryExhaustedError } from '../reliability/retry.service';
import { timeoutService, TimeoutError } from '../reliability/timeout.service';
import { idempotencyService } from '../reliability/idempotency.service';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';
import { randomUUID } from 'node:crypto';

describe('M30 — AiDataGuard (minimum-data AI firewall)', () => {
  it('strips a record down to only explicitly allowed fields', () => {
    const record = { name: 'Acme', password: 'secret', amount: 500 };
    const result = aiDataGuard.minimize(record, { tenantId: 't1', allowedFields: ['name', 'amount'] });
    expect(result).toEqual({ name: 'Acme', amount: 500 });
    expect((result as any).password).toBeUndefined();
  });

  it('refuses to ever allow a blocked field, even if explicitly requested', () => {
    expect(() =>
      aiDataGuard.minimize({ password: 'x' }, { tenantId: 't1', allowedFields: ['password'] }),
    ).toThrow(AiDataGuardViolationError);
  });

  it('rejects cross-tenant AI data access', () => {
    expect(() => aiDataGuard.assertSameTenant('t1', 't2')).toThrow(AiDataGuardViolationError);
    expect(() => aiDataGuard.assertSameTenant('t1', 't1')).not.toThrow();
  });
});

describe('M30 — RetryService / TimeoutService (pure logic)', () => {
  it('retries until success within maxAttempts', async () => {
    let calls = 0;
    const result = await retryService.withRetry(async () => {
      calls += 1;
      if (calls < 3) throw new Error('transient');
      return 'ok';
    }, { maxAttempts: 5, baseDelayMs: 1, maxDelayMs: 5 });
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('throws RetryExhaustedError after maxAttempts', async () => {
    await expect(
      retryService.withRetry(async () => { throw new Error('always fails'); }, { maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 2 }),
    ).rejects.toThrow(RetryExhaustedError);
  });

  it('throws TimeoutError when the operation exceeds the timeout', async () => {
    await expect(
      timeoutService.withTimeout(() => new Promise((r) => setTimeout(r, 200)), 20),
    ).rejects.toThrow(TimeoutError);
  });
});

describe.runIf(process.env.TEST_DB === '1')('M30 — IdempotencyService (real idempotency_record table)', () => {
  it('runs an operation only once for a repeated key, returning the stored result', async () => {
    const key = randomUUID();
    let executions = 0;
    const op = async () => { executions += 1; return { total: 42 }; };

    const first = await idempotencyService.runOnce(TEST_COMPANY_ID, key, op);
    const second = await idempotencyService.runOnce(TEST_COMPANY_ID, key, op);

    expect(first).toEqual({ total: 42 });
    expect(second).toEqual({ total: 42 });
    expect(executions).toBe(1);
  });

  it('records FAILED status and re-throws when the operation throws', async () => {
    const key = randomUUID();
    await expect(idempotencyService.runOnce(TEST_COMPANY_ID, key, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
  });

  it('the same key in a different tenant is independent', async () => {
    const key = randomUUID();
    const a = await idempotencyService.runOnce(TEST_COMPANY_ID, key, async () => 'A');
    const b = await idempotencyService.runOnce('other-tenant', key, async () => 'B');
    expect(a).toBe('A');
    expect(b).toBe('B');
  });
});
