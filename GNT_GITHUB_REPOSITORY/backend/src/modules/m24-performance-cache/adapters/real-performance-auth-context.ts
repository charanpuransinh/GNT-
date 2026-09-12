/**
 * M24 — adapters/real-performance-auth-context.ts
 * WIRED (2026-09-13): builds PerformanceAuthContext from the real req.user/
 * req.tenant shape + permissionService — same verified facts as M23/M26/M27.
 */

import type { Request } from 'express';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import type { PerformanceAuthContext } from '../controllers/performance.controller';

export async function buildPerformanceAuthContext(req: Request): Promise<PerformanceAuthContext> {
  const userId = req.user?.id;
  const tenantId = req.tenant?.companyId ?? req.user?.companyId;
  if (!userId || !tenantId) {
    throw new Error('buildPerformanceAuthContext: request is not authenticated');
  }
  const permissions = Array.from(await permissionService.getUserPermissions(userId));
  return { userId, tenantId, permissions };
}
