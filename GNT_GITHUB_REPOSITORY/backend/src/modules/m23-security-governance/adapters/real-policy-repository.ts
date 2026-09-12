/**
 * M23 — adapters/real-policy-repository.ts
 * WIRED (2026-09-12): PolicyRepository backed by the new `security_policy`
 * table (migration 020_M23_security_policy_retention.sql) — a genuinely
 * new, tenant-owned table with no existing-repo equivalent.
 */

import { prisma } from '@/common/config/prisma';
import type { Prisma } from '@prisma/client';
import type { PolicyEffect, PolicyRepository, SecurityPolicy } from '../access/policy-engine.service';

function toDomain(r: {
  id: string; companyId: string; name: string; resource: string; action: string;
  effect: string; conditions: unknown; active: boolean;
}): SecurityPolicy {
  return {
    id: r.id,
    tenantId: r.companyId,
    name: r.name,
    resource: r.resource,
    action: r.action,
    effect: r.effect as PolicyEffect,
    conditions: (r.conditions as Record<string, unknown> | null) ?? undefined,
    active: r.active,
  };
}

export class RealPolicyRepository implements PolicyRepository {
  async findActivePolicies(tenantId: string, resource: string, action: string): Promise<SecurityPolicy[]> {
    const rows = await prisma.securityPolicy.findMany({
      where: { companyId: tenantId, resource, action, active: true },
    });
    return rows.map(toDomain);
  }

  async createPolicy(input: Omit<SecurityPolicy, 'id'>): Promise<SecurityPolicy> {
    const row = await prisma.securityPolicy.create({
      data: {
        companyId: input.tenantId,
        name: input.name,
        resource: input.resource,
        action: input.action,
        effect: input.effect,
        conditions: input.conditions as Prisma.InputJsonValue | undefined,
        active: input.active,
      },
    });
    return toDomain(row);
  }

  async listPolicies(tenantId: string): Promise<SecurityPolicy[]> {
    const rows = await prisma.securityPolicy.findMany({ where: { companyId: tenantId } });
    return rows.map(toDomain);
  }
}

export const realPolicyRepository = new RealPolicyRepository();
