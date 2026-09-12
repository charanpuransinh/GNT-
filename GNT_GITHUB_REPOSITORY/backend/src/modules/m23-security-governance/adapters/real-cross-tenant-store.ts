/**
 * M23 — adapters/real-cross-tenant-store.ts
 * WIRED (2026-09-12): implements CrossTenantAttemptStore over M19's
 * EXISTING SecurityEvent table (via M19's public SecurityRepository) —
 * no new table. `actorId`/target/resource details go in `metadata` (JSON),
 * the same pattern M19's own security.repository.ts already uses for
 * `getEventsByIp` (Postgres JSON-path filter via Prisma).
 *
 * companyId on the SecurityEvent row is the ACTOR's tenant (the party doing
 * the probing) so a company can see attempts originating from its own users.
 */

import { SecurityRepository } from '@/modules/m19-production-monitoring';
import { prisma } from '@/common/config/prisma';
import type { CrossTenantAttempt, CrossTenantAttemptStore } from '../tenant/cross-tenant-detector.service';

const securityRepository = new SecurityRepository(prisma);

export class RealCrossTenantAttemptStore implements CrossTenantAttemptStore {
  async record(attempt: CrossTenantAttempt & { occurredAt: string }): Promise<void> {
    await securityRepository.createSecurityEvent({
      companyId: attempt.actorTenantId,
      eventType: 'CROSS_TENANT_ATTEMPT',
      severity: 'high',
      description: `Cross-tenant access attempt on ${attempt.resourceType}`,
      metadata: {
        actorId: attempt.actorId,
        targetTenantId: attempt.targetTenantId,
        resourceType: attempt.resourceType,
        resourceId: attempt.resourceId,
        correlationId: attempt.correlationId,
      },
    });
  }

  async countRecentAttempts(actorId: string, windowMs: number): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    return prisma.securityEvent.count({
      where: {
        eventType: 'CROSS_TENANT_ATTEMPT',
        createdAt: { gte: since },
        metadata: { path: ['actorId'], equals: actorId },
      },
    });
  }
}

export const realCrossTenantAttemptStore = new RealCrossTenantAttemptStore();
