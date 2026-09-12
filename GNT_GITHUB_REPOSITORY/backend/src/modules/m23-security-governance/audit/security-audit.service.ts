/**
 * M23 — audit/security-audit.service.ts
 * OWN: Create immutable security audit records.
 * Backs table: security_audit_event (proposed, tenant-owned).
 *
 * Rule 10 (Global Rules): Security-sensitive, financial, HR, AI, integration,
 * permission and workflow actions must generate an immutable audit event.
 *
 * WIRED (2026-09-12): verified M19 already owns a canonical audit-log table
 * (Prisma `AuditLog`, migration 006_M19_audit_log_append_only.sql). Per
 * owner decision, the default store is `realSecurityAuditStore`
 * (adapters/real-audit-store.ts), which writes into M19's AuditLog table —
 * no parallel `security_audit_event` table was created.
 */

import { realSecurityAuditStore } from '../adapters/real-audit-store';

export interface SecurityAuditRecord {
  id?: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'ALLOWED' | 'DENIED' | 'ERROR';
  correlationId: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface SecurityAuditStore {
  insert(record: SecurityAuditRecord & { createdAt: string }): Promise<void>;
}

/** In-memory store — used only by unit tests that don't want real DB I/O. */
export class InMemorySecurityAuditStore implements SecurityAuditStore {
  private records: Array<SecurityAuditRecord & { createdAt: string }> = [];
  async insert(record: SecurityAuditRecord & { createdAt: string }): Promise<void> {
    this.records.push(record);
  }
  getAll() {
    return this.records;
  }
}

export class SecurityAuditService {
  constructor(private readonly store: SecurityAuditStore) {}

  /**
   * Records are never mutated or deleted through this service — only
   * inserted. Immutability is a contract requirement (Rule 10).
   */
  async record(entry: SecurityAuditRecord): Promise<void> {
    // Never log secrets/tokens/passwords (Rule 16) — callers must not put
    // them in metadata; this is a best-effort safety net for obvious keys.
    const safeMetadata = entry.metadata ? this.stripSensitiveKeys(entry.metadata) : undefined;

    await this.store.insert({
      ...entry,
      metadata: safeMetadata,
      createdAt: new Date().toISOString(),
    });
  }

  private stripSensitiveKeys(metadata: Record<string, unknown>): Record<string, unknown> {
    const blocked = ['password', 'token', 'secret', 'accessToken', 'refreshToken', 'cardNumber'];
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (blocked.some((b) => key.toLowerCase().includes(b.toLowerCase()))) continue;
      cleaned[key] = value;
    }
    return cleaned;
  }
}

export const securityAuditService = new SecurityAuditService(realSecurityAuditStore);
