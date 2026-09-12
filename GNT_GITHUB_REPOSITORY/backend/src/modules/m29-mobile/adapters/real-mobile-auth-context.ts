/**
 * M29 — adapters/real-mobile-auth-context.ts
 * WIRED (2026-09-13): builds MobileAuthContext from the real req.user/
 * req.tenant shape + permissionService — same verified facts as M23/M24/
 * M26/M27/M28. Only used for authenticated routes (push/send); login/
 * refresh are pre-auth and never call this.
 */

import type { Request } from 'express';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import type { MobileAuthContext } from '../controllers/mobile.controller';

export async function buildMobileAuthContext(req: Request): Promise<MobileAuthContext> {
  const userId = req.user?.id;
  const tenantId = req.tenant?.companyId ?? req.user?.companyId;
  if (!userId || !tenantId) {
    throw new Error('buildMobileAuthContext: request is not authenticated');
  }
  const permissions = Array.from(await permissionService.getUserPermissions(userId));
  return { userId, tenantId, permissions };
}
