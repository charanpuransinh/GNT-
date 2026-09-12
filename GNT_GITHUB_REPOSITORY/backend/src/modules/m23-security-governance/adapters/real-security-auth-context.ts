/**
 * M23 — adapters/real-security-auth-context.ts
 * WIRED (2026-09-12): builds SecurityAuthContext from the real req.user/
 * req.tenant shape + permissionService — same verified facts as M26/M27's
 * own auth-context adapters (auth-middleware.ts, tenant-middleware.ts).
 */

import type { Request } from 'express';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import type { SecurityAuthContext } from '../controllers/security.controller';

export async function buildSecurityAuthContext(req: Request): Promise<SecurityAuthContext> {
  const userId = req.user?.id;
  const tenantId = req.tenant?.companyId ?? req.user?.companyId;
  if (!userId || !tenantId) {
    throw new Error('buildSecurityAuthContext: request is not authenticated');
  }
  const permissions = Array.from(await permissionService.getUserPermissions(userId));
  return { userId, tenantId, permissions };
}
