/**
 * M23 — Security, Governance & Data Protection
 * access/authorization.service.ts
 *
 * OWN: Authorization policy evaluation.
 * Rule 4 (Global Rules): Authorization is not role-only.
 *   Every protected operation evaluates:
 *   AUTHENTICATED USER + ROLE + PERMISSION + TENANT + BUSINESS SCOPE.
 *
 * VERIFICATION NEEDED (STATUS = BLOCKED until confirmed against the real repo):
 *   - Exact shape of the AuthUser object produced by M01 authentication middleware.
 *   - Exact permission-string format used by M02 (assumed "MODULE.RESOURCE.ACTION",
 *     e.g. "M23.SECURITY.READ", matching this blueprint's own permission naming).
 *   - Exact session/claims field names produced by M03.
 * Until verified, this service accepts an already-normalized AuthContext (see below)
 * rather than reading req/session internals directly, so it can be wired to whatever
 * M01/M02/M03 actually emit without guessing their internals.
 */

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  scope?: BusinessScope;
  correlationId: string;
}

export interface BusinessScope {
  branchId?: string;
  departmentId?: string;
  teamId?: string;
  resourceOwnerId?: string;
}

export interface AuthorizationRequest {
  auth: AuthContext;
  requiredPermission: string;
  resourceTenantId: string;
  requiredScope?: Partial<BusinessScope>;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason: string;
  checkedAt: string;
}

export class AuthorizationDeniedError extends Error {
  constructor(public readonly reason: string, public readonly correlationId: string) {
    super(`Authorization denied: ${reason}`);
    this.name = 'AuthorizationDeniedError';
  }
}

/**
 * Central authorization decision point for GNT.
 * This is the ONLY place that should decide "is this action allowed".
 * Every other M23 guard/service composes with this.
 */
export class AuthorizationService {
  /**
   * Evaluate USER + ROLE + PERMISSION + TENANT + SCOPE.
   * Never throws for a normal denial — returns { allowed: false, reason }.
   * Throws only on malformed input (programmer error), which callers should
   * treat as a 500, not a 403.
   */
  evaluate(request: AuthorizationRequest): AuthorizationResult {
    const checkedAt = new Date().toISOString();
    const { auth, requiredPermission, resourceTenantId, requiredScope } = request;

    if (!auth || !auth.userId || !auth.tenantId) {
      throw new Error('AuthorizationService.evaluate: malformed AuthContext');
    }

    // 1. TENANT — never trust anything other than the trusted auth context.
    if (auth.tenantId !== resourceTenantId) {
      return { allowed: false, reason: 'TENANT_MISMATCH', checkedAt };
    }

    // 2. PERMISSION — role alone is never sufficient (Rule 4).
    if (!auth.permissions?.includes(requiredPermission)) {
      return { allowed: false, reason: 'PERMISSION_MISSING', checkedAt };
    }

    // 3. SCOPE — if the operation demands a business scope, every requested
    //    field must match the user's granted scope exactly.
    if (requiredScope) {
      const scopeOk = Object.entries(requiredScope).every(([key, value]) => {
        if (value === undefined) return true;
        const granted = auth.scope?.[key as keyof BusinessScope];
        return granted !== undefined && granted === value;
      });
      if (!scopeOk) {
        return { allowed: false, reason: 'SCOPE_MISMATCH', checkedAt };
      }
    }

    return { allowed: true, reason: 'OK', checkedAt };
  }

  /**
   * Convenience wrapper that throws on denial — for use at controller/guard
   * boundaries where a denial should short-circuit the request.
   */
  assert(request: AuthorizationRequest): void {
    const result = this.evaluate(request);
    if (!result.allowed) {
      throw new AuthorizationDeniedError(result.reason, request.auth.correlationId);
    }
  }
}

export const authorizationService = new AuthorizationService();
