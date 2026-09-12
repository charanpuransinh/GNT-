/**
 * M23 — access/policy-engine.service.ts
 * OWN: Evaluate tenant-specific security/business policies.
 * Backs table: security_policy (proposed, tenant-owned).
 *
 * Rule 22 (Global Rules): GNT must not impose a universal business policy on
 * every customer — tenant-level configuration controls business-specific rules.
 */

export type PolicyEffect = 'ALLOW' | 'DENY';

export interface SecurityPolicy {
  id: string;
  tenantId: string;
  name: string;
  resource: string;
  action: string;
  effect: PolicyEffect;
  conditions?: Record<string, unknown>;
  active: boolean;
}

export interface PolicyRepository {
  findActivePolicies(tenantId: string, resource: string, action: string): Promise<SecurityPolicy[]>;
  createPolicy(input: Omit<SecurityPolicy, 'id'>): Promise<SecurityPolicy>;
  listPolicies(tenantId: string): Promise<SecurityPolicy[]>;
}

export interface PolicyEvaluationContext {
  tenantId: string;
  resource: string;
  action: string;
  attributes?: Record<string, unknown>;
}

export interface PolicyEvaluationResult {
  effect: PolicyEffect;
  matchedPolicyId: string | null;
  evaluatedAt: string;
}

export class PolicyEngineService {
  constructor(private readonly repository: PolicyRepository) {}

  /**
   * Default-deny evaluation: if no active DENY policy matches, and no
   * explicit ALLOW policy exists that matches, the engine returns DENY.
   * Explicit DENY policies always take precedence over ALLOW policies
   * (deny-overrides), so a tenant can carve out exceptions safely.
   */
  async evaluate(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    const evaluatedAt = new Date().toISOString();
    const policies = await this.repository.findActivePolicies(
      context.tenantId,
      context.resource,
      context.action,
    );

    const matchingDeny = policies.find(
      (p) => p.effect === 'DENY' && this.matchesConditions(p, context),
    );
    if (matchingDeny) {
      return { effect: 'DENY', matchedPolicyId: matchingDeny.id, evaluatedAt };
    }

    const matchingAllow = policies.find(
      (p) => p.effect === 'ALLOW' && this.matchesConditions(p, context),
    );
    if (matchingAllow) {
      return { effect: 'ALLOW', matchedPolicyId: matchingAllow.id, evaluatedAt };
    }

    // Default-deny: absence of policy is not an ALLOW.
    return { effect: 'DENY', matchedPolicyId: null, evaluatedAt };
  }

  /** M23 API surface (2026-09-12) — tenant creates its own policy; no cross-tenant write possible (tenantId comes from trusted context, never body). */
  async createPolicy(input: Omit<SecurityPolicy, 'id'>): Promise<SecurityPolicy> {
    return this.repository.createPolicy(input);
  }

  async listPolicies(tenantId: string): Promise<SecurityPolicy[]> {
    return this.repository.listPolicies(tenantId);
  }

  private matchesConditions(policy: SecurityPolicy, context: PolicyEvaluationContext): boolean {
    if (!policy.conditions) return true;
    return Object.entries(policy.conditions).every(
      ([key, value]) => context.attributes?.[key] === value,
    );
  }
}

// WIRED (2026-09-12): default instance backed by the new `security_policy`
// table (adapters/real-policy-repository.ts).
import { realPolicyRepository } from '../adapters/real-policy-repository';
export const policyEngineService = new PolicyEngineService(realPolicyRepository);
