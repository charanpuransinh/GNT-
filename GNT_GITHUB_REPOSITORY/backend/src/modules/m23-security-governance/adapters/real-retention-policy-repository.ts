/**
 * M23 — adapters/real-retention-policy-repository.ts
 * WIRED (2026-09-12): RetentionPolicyRepository backed by the new
 * `data_retention_policy` table (migration 020_M23_security_policy_retention.sql).
 * Actual purging is still deferred to per-entity RetentionExecutor
 * implementations registered by each owning module — M23 never writes
 * another module's tables directly (Calling Rule, unchanged from the
 * original blueprint design).
 */

import { prisma } from '@/common/config/prisma';
import type { DataRetentionPolicy, RetentionPolicyRepository } from '../privacy/data-retention.service';

function toDomain(r: { id: string; companyId: string; entityType: string; retentionDays: number; active: boolean }): DataRetentionPolicy {
  return {
    id: r.id,
    tenantId: r.companyId,
    entityType: r.entityType,
    retentionDays: r.retentionDays,
    active: r.active,
  };
}

export class RealRetentionPolicyRepository implements RetentionPolicyRepository {
  async findActivePolicies(tenantId: string): Promise<DataRetentionPolicy[]> {
    const rows = await prisma.dataRetentionPolicy.findMany({
      where: { companyId: tenantId, active: true },
    });
    return rows.map(toDomain);
  }

  async createPolicy(input: Omit<DataRetentionPolicy, 'id'>): Promise<DataRetentionPolicy> {
    const row = await prisma.dataRetentionPolicy.upsert({
      where: { companyId_entityType: { companyId: input.tenantId, entityType: input.entityType } },
      update: { retentionDays: input.retentionDays, active: input.active },
      create: {
        companyId: input.tenantId,
        entityType: input.entityType,
        retentionDays: input.retentionDays,
        active: input.active,
      },
    });
    return toDomain(row);
  }

  async listPolicies(tenantId: string): Promise<DataRetentionPolicy[]> {
    const rows = await prisma.dataRetentionPolicy.findMany({ where: { companyId: tenantId } });
    return rows.map(toDomain);
  }
}

export const realRetentionPolicyRepository = new RealRetentionPolicyRepository();
