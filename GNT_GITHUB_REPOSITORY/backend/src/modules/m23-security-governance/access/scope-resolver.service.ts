/**
 * M23 — access/scope-resolver.service.ts
 * OWN: Resolve branch/department/team/resource scope for a user.
 *
 * VERIFICATION NEEDED: the actual source of scope assignment (which existing
 * module owns branch/department/team master data — likely M01/M05/HR modules).
 * Until verified, this service depends on an injected ScopeProvider so it
 * never guesses a table/column name directly.
 */

import { BusinessScope } from './authorization.service';

/**
 * Adapter contract — the real implementation must be backed by a verified
 * existing repository (e.g. an M01/HR employee-scope table). Do not
 * implement this against a guessed table name.
 */
export interface ScopeProvider {
  getScopeForUser(userId: string, tenantId: string): Promise<BusinessScope | null>;
}

export class ScopeResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScopeResolutionError';
  }
}

export class ScopeResolverService {
  constructor(private readonly provider: ScopeProvider) {}

  /**
   * Resolve the effective business scope for a user within a tenant.
   * Returns an empty scope object (not null) when the user has no scope
   * restriction, so callers can distinguish "unresolved/error" from
   * "no restriction".
   */
  async resolve(userId: string, tenantId: string): Promise<BusinessScope> {
    if (!userId || !tenantId) {
      throw new ScopeResolutionError('userId and tenantId are required');
    }
    const scope = await this.provider.getScopeForUser(userId, tenantId);
    return scope ?? {};
  }

  /**
   * Check whether a candidate scope is fully contained within a granted scope.
   * Used by AuthorizationService callers that need a pre-check before
   * constructing an AuthorizationRequest.
   */
  isWithinScope(granted: BusinessScope, candidate: Partial<BusinessScope>): boolean {
    return Object.entries(candidate).every(([key, value]) => {
      if (value === undefined) return true;
      return granted[key as keyof BusinessScope] === value;
    });
  }
}

// WIRED (2026-09-12): default instance uses real-scope-provider.ts — real
// repo only has branchId (from user_master), no department/team table.
import { realScopeProvider } from '../adapters/real-scope-provider';
export const scopeResolverService = new ScopeResolverService(realScopeProvider);
