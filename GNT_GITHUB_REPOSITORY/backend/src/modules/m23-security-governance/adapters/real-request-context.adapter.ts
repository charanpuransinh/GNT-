/**
 * M23 — adapters/real-request-context.adapter.ts
 * WIRED (2026-09-12): builds a TrustedRequestSource from the REAL M01/M02
 * request shape, verified against the live repo (not guessed):
 *   - req.user = { id, companyId?, branchId? }        (auth-middleware.ts)
 *   - req.tenant = { companyId, branchId? }            (tenant-middleware.ts)
 *   - permissions come from permissionService.getUserPermissions(userId),
 *     format "M<code>:<action>" (e.g. "M08:view") — permission-catalog.ts.
 *
 * Scope limitation (documented, not guessed): the real repo has no
 * department/team master-data table. Only branchId is a real, verified
 * scope field. departmentId/teamId are always left undefined here — any
 * M23 caller requiring department/team scope will correctly get a
 * SCOPE_MISMATCH rather than a fabricated value.
 */

import type { Request } from 'express';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import { TenantContextService, type TrustedRequestSource } from '../tenant/tenant-context.service';

export async function buildTrustedRequestSource(req: Request): Promise<TrustedRequestSource> {
  const userId = req.user?.id;
  const companyId = req.tenant?.companyId ?? req.user?.companyId;
  if (!userId || !companyId) {
    throw new Error('buildTrustedRequestSource: request is not authenticated (no req.user/req.tenant)');
  }

  const permissionSet = await permissionService.getUserPermissions(userId);

  return {
    authenticatedUserId: userId,
    authenticatedTenantId: companyId,
    role: '', // real repo has no single "role name" on req.user — access decisions use permissions, not role strings (see AuthorizationService.evaluate)
    permissions: Array.from(permissionSet),
    scope: req.user?.branchId ? { branchId: req.user.branchId } : undefined,
    correlationId: req.requestId ?? TenantContextService.newCorrelationId(),
  };
}
