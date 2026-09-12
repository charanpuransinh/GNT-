/**
 * M23 — tenant/tenant-context.service.ts
 * OWN: Establish a trusted tenant context.
 *
 * Rule 3 / Section 21 TENANT CONTRACT (Global Rules):
 *   tenantId MUST come from trusted authentication/session context, never
 *   from an untrusted request body/query/params.
 *
 * VERIFICATION NEEDED: the exact shape of the authenticated request object
 * produced by M01/M03. This service is written against a minimal
 * TrustedRequestSource interface so it never reads req.body.tenantId,
 * req.query.tenantId or req.params.tenantId directly (forbidden by contract).
 */

import { AuthContext, BusinessScope } from '../access/authorization.service';

/**
 * Whatever M01/M03 actually attach to the request after authentication.
 * Only trusted fields belong here — never raw request input.
 */
export interface TrustedRequestSource {
  authenticatedUserId: string;
  authenticatedTenantId: string;
  role: string;
  permissions: string[];
  scope?: BusinessScope;
  correlationId: string;
}

export class TenantContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantContextError';
  }
}

export class TenantContextService {
  /**
   * Build a trusted AuthContext strictly from server-side authenticated
   * fields. Any caller trying to pass tenantId from user-controlled input
   * must not use this method — that is exactly what Rule 3 forbids.
   */
  establish(source: TrustedRequestSource): AuthContext {
    if (!source.authenticatedTenantId || !source.authenticatedUserId) {
      throw new TenantContextError('Missing trusted authentication context');
    }
    return {
      userId: source.authenticatedUserId,
      tenantId: source.authenticatedTenantId,
      role: source.role,
      permissions: source.permissions ?? [],
      scope: source.scope,
      correlationId: source.correlationId ?? TenantContextService.newCorrelationId(),
    };
  }

  /**
   * Validate that a tenantId taken from an untrusted source (e.g. a path
   * param used only for readability, like /api/v1/tenants/:tenantId/x)
   * matches the trusted context. This is the ONLY sanctioned way to accept
   * an untrusted tenantId value — by cross-checking it, never by trusting it.
   */
  assertMatchesTrustedContext(untrustedTenantId: string, trusted: AuthContext): void {
    if (untrustedTenantId !== trusted.tenantId) {
      throw new TenantContextError('Untrusted tenantId does not match authenticated tenant');
    }
  }

  static newCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const tenantContextService = new TenantContextService();
