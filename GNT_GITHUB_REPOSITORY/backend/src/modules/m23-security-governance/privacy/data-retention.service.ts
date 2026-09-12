/**
 * M23 — privacy/data-retention.service.ts
 * OWN: Execute approved retention/deletion policy.
 * Backs table: data_retention_policy (proposed, tenant-owned).
 *
 * VERIFICATION NEEDED: this service never deletes rows itself — it depends
 * on an injected RetentionExecutor per entity type, which must be backed by
 * the real owning module's verified repository. M23 must not directly write
 * another module's private tables (Calling Rule, Section 19).
 */

export interface DataRetentionPolicy {
  id: string;
  tenantId: string;
  entityType: string;
  retentionDays: number;
  active: boolean;
}

export interface RetentionExecutor {
  /** Must be implemented by (or call into) the entity's owning module. */
  purgeOlderThan(tenantId: string, entityType: string, cutoffDate: Date): Promise<{ purgedCount: number }>;
}

export interface RetentionPolicyRepository {
  findActivePolicies(tenantId: string): Promise<DataRetentionPolicy[]>;
  createPolicy(input: Omit<DataRetentionPolicy, 'id'>): Promise<DataRetentionPolicy>;
  listPolicies(tenantId: string): Promise<DataRetentionPolicy[]>;
}

export class DataRetentionService {
  private executors = new Map<string, RetentionExecutor>();

  constructor(private readonly policyRepository: RetentionPolicyRepository) {}

  /** Register the owning module's executor for a given entity type. */
  registerExecutor(entityType: string, executor: RetentionExecutor): void {
    this.executors.set(entityType, executor);
  }

  async executeForTenant(tenantId: string): Promise<Array<{ entityType: string; purgedCount: number }>> {
    const policies = await this.policyRepository.findActivePolicies(tenantId);
    const results: Array<{ entityType: string; purgedCount: number }> = [];

    for (const policy of policies) {
      const executor = this.executors.get(policy.entityType);
      if (!executor) {
        // No verified executor registered — skip rather than guess how to delete.
        continue;
      }
      const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
      const { purgedCount } = await executor.purgeOlderThan(tenantId, policy.entityType, cutoffDate);
      results.push({ entityType: policy.entityType, purgedCount });
    }

    return results;
  }

  /** M23 API surface (2026-09-12) — tenantId from trusted context only, same rule as createPolicy. */
  async createPolicy(input: Omit<DataRetentionPolicy, 'id'>): Promise<DataRetentionPolicy> {
    return this.policyRepository.createPolicy(input);
  }

  async listPolicies(tenantId: string): Promise<DataRetentionPolicy[]> {
    return this.policyRepository.listPolicies(tenantId);
  }
}

// WIRED (2026-09-12): default instance backed by the new
// `data_retention_policy` table (adapters/real-retention-policy-repository.ts).
// Per-entity RetentionExecutor implementations must still be registered by
// each owning module via registerExecutor() — none are registered here.
import { realRetentionPolicyRepository } from '../adapters/real-retention-policy-repository';
export const dataRetentionService = new DataRetentionService(realRetentionPolicyRepository);
