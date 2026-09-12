/**
 * M23 — tenant/tenant-isolation.guard.ts
 * OWN: Reject cross-tenant access at the boundary.
 *
 * Framework-agnostic on purpose: this is written as a plain function taking
 * a trusted AuthContext and a resource tenant id, not an Express-specific
 * middleware — because the real request/response object shape used across
 * the GNT backend must be verified before wiring (Rule 1, No Guessing).
 * An Express adapter (thin wrapper) can be added once verified.
 */

import { AuthContext } from '../access/authorization.service';
import { crossTenantDetectorService } from './cross-tenant-detector.service';
import { securityEventService } from '../audit/security-event.service';

export class TenantIsolationViolationError extends Error {
  constructor(public readonly correlationId: string) {
    super('Cross-tenant access denied');
    this.name = 'TenantIsolationViolationError';
  }
}

export interface TenantIsolationCheckInput {
  auth: AuthContext;
  resourceTenantId: string;
  resourceType: string;
  resourceId?: string;
}

export class TenantIsolationGuard {
  /**
   * Throws TenantIsolationViolationError on mismatch, and records the
   * attempt via M23 audit + cross-tenant detector so repeated probing is
   * visible (Rule: SECURITY.CROSS_TENANT_ATTEMPT event).
   */
  async enforce(input: TenantIsolationCheckInput): Promise<void> {
    const { auth, resourceTenantId, resourceType, resourceId } = input;

    if (auth.tenantId === resourceTenantId) {
      return;
    }

    await crossTenantDetectorService.recordAttempt({
      actorId: auth.userId,
      actorTenantId: auth.tenantId,
      targetTenantId: resourceTenantId,
      resourceType,
      resourceId,
      correlationId: auth.correlationId,
    });

    await securityEventService.publish({
      eventName: 'SECURITY.CROSS_TENANT_ATTEMPT',
      tenantId: auth.tenantId,
      actorId: auth.userId,
      correlationId: auth.correlationId,
      entityType: resourceType,
      entityId: resourceId ?? 'unknown',
      payload: { attemptedTenantId: resourceTenantId },
    });

    throw new TenantIsolationViolationError(auth.correlationId);
  }
}

export const tenantIsolationGuard = new TenantIsolationGuard();
