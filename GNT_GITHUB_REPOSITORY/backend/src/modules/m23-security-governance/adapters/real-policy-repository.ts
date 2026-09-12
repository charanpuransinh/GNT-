/**
 * M23 — adapters/real-policy-repository.ts
 * WIRED (2026-09-12): PolicyRepository backed by the new `security_policy`
 * table (migration 020_M23_security_policy_retention.sql) — a genuinely
 * new, tenant-owned table with no existing-repo equivalent.
 */

import { prisma } from '@/common/config/prisma';
import type { PolicyEffect, PolicyRepository, SecurityPolicy } from '../access/policy-engine.service';

export class RealPolicyRepository implements PolicyRepository {
  async findActivePolicies(tenantId: string, resource: string, action: string): Promise<SecurityPolicy[]> {
    const rows = await prisma.securityPolicy.findMany({
      where: { companyId: tenantId, resource, action, active: true },
    });
    return rows.map((r) => ({
      id: r.id,
      tenantId: r.companyId,
      name: r.name,
      resource: r.resource,
      action: r.action,
      effect: r.effect as PolicyEffect,
      conditions: (r.conditions as Record<string, unknown> | null) ?? undefined,
      active: r.active,
    }));
  }
}

export const realPolicyRepository = new RealPolicyRepository();
