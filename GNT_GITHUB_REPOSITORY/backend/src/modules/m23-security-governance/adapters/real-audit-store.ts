/**
 * M23 — adapters/real-audit-store.ts
 * WIRED (2026-09-12): implements SecurityAuditStore over M19's EXISTING
 * AuditLog table (via M19's public AuditRepository), per owner decision —
 * M23 does not own a parallel audit table; it writes into the canonical
 * one M19 already owns and serves (audit.controller.ts / audit.service.ts).
 *
 * Field mapping (SecurityAuditRecord -> AuditLog), since the shapes differ:
 *   tenantId     -> companyId
 *   actorId      -> userId
 *   action       -> action
 *   resourceType -> resource            (AuditLog also has `module`; M23
 *                                         is not one business module, so
 *                                         module is fixed to 'M23')
 *   resourceId   -> resourceId
 *   outcome, correlationId, metadata -> afterData (JSON) — AuditLog has no
 *     dedicated columns for these; nothing here is invented, it is a
 *     documented, reversible mapping choice.
 */

import { AuditRepository } from '@/modules/m19-production-monitoring';
import { prisma } from '@/common/config/prisma';
import type { SecurityAuditRecord, SecurityAuditStore } from '../audit/security-audit.service';

const auditRepository = new AuditRepository(prisma);

export class RealSecurityAuditStore implements SecurityAuditStore {
  async insert(record: SecurityAuditRecord & { createdAt: string }): Promise<void> {
    await auditRepository.createAuditLog({
      companyId: record.tenantId,
      userId: record.actorId,
      action: record.action,
      module: 'M23',
      resource: record.resourceType,
      resourceId: record.resourceId,
      afterData: {
        outcome: record.outcome,
        correlationId: record.correlationId,
        ...record.metadata,
      },
    });
  }
}

export const realSecurityAuditStore = new RealSecurityAuditStore();
