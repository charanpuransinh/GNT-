/**
 * M28 — adapters/real-reports-auth-context.ts
 * WIRED (2026-09-13): builds ReportsAuthContext from the real req.user/
 * req.tenant shape + permissionService — same verified facts as M23/M24/M26/M27.
 */

import type { Request } from 'express';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import type { ReportsAuthContext } from '../controllers/reports.controller';

export async function buildReportsAuthContext(req: Request): Promise<ReportsAuthContext> {
  const userId = req.user?.id;
  const tenantId = req.tenant?.companyId ?? req.user?.companyId;
  if (!userId || !tenantId) {
    throw new Error('buildReportsAuthContext: request is not authenticated');
  }
  const permissions = Array.from(await permissionService.getUserPermissions(userId));
  return { userId, tenantId, permissions };
}
