/**
 * M30 — ai/ai-data-guard.ts
 * OWN: Minimum-data AI firewall.
 * Rule 8 (Global Rules): AI receives only the minimum data required for the
 * requested operation. Never send the entire tenant database to an AI model.
 * AI Safety Contract (Section 27): data minimization, tenant boundary, no
 * secret access.
 */

const ALWAYS_BLOCKED_FIELDS = new Set(['password', 'passwordHash', 'token', 'accessToken', 'refreshToken', 'secret', 'cardNumber', 'bankAccountNumber']);

export interface AiRequestContext {
  tenantId: string;
  allowedFields: string[];
}

export class AiDataGuardViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiDataGuardViolationError';
  }
}

export class AiDataGuard {
  /** Strip a record down to only the explicitly allowed fields, never sending everything. */
  minimize<T extends Record<string, unknown>>(record: T, context: AiRequestContext): Partial<T> {
    const result: Partial<T> = {};
    for (const field of context.allowedFields) {
      if (ALWAYS_BLOCKED_FIELDS.has(field)) {
        throw new AiDataGuardViolationError(`Field "${field}" can never be sent to an AI model`);
      }
      if (field in record) {
        result[field as keyof T] = record[field as keyof T];
      }
    }
    return result;
  }

  minimizeMany<T extends Record<string, unknown>>(records: T[], context: AiRequestContext): Partial<T>[] {
    return records.map((r) => this.minimize(r, context));
  }

  /** Cross-tenant AI retrieval is never permitted. */
  assertSameTenant(requestTenantId: string, dataTenantId: string): void {
    if (requestTenantId !== dataTenantId) {
      throw new AiDataGuardViolationError('AI request cannot access data from another tenant');
    }
  }
}

export const aiDataGuard = new AiDataGuard();
