/**
 * M31 — adapters/real-workforce-auth-context.ts
 * WIRED (2026-09-13): builds WorkforceAuthContext from the real req.user/
 * req.tenant shape + permissionService — same verified facts as M23/M24/
 * M26/M27/M28/M29.
 */

import type { Request } from 'express';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import type { WorkforceAuthContext } from '../controllers/workforce.controller';

export async function buildWorkforceAuthContext(req: Request): Promise<WorkforceAuthContext> {
  const userId = req.user?.id;
  const tenantId = req.tenant?.companyId ?? req.user?.companyId;
  if (!userId || !tenantId) {
    throw new Error('buildWorkforceAuthContext: request is not authenticated');
  }
  const permissions = Array.from(await permissionService.getUserPermissions(userId));
  return { userId, tenantId, permissions };
}
