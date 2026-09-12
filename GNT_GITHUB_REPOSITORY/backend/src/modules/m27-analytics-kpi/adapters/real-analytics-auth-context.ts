/**
 * M27 — adapters/real-analytics-auth-context.ts
 * WIRED (2026-09-12): builds AnalyticsAuthContext from the real req.user/
 * req.tenant shape + permissionService — same verified facts as M23/M26.
 */

import type { Request } from 'express';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import type { AnalyticsAuthContext } from '../dashboard/analytics.controller';

export async function buildAnalyticsAuthContext(req: Request): Promise<AnalyticsAuthContext> {
  const userId = req.user?.id;
  const tenantId = req.tenant?.companyId ?? req.user?.companyId;
  if (!userId || !tenantId) {
    throw new Error('buildAnalyticsAuthContext: request is not authenticated');
  }
  const permissions = Array.from(await permissionService.getUserPermissions(userId));
  return { userId, tenantId, permissions };
}
