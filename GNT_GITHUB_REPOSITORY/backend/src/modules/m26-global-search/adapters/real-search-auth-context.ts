/**
 * M26 — adapters/real-search-auth-context.ts
 * WIRED (2026-09-12): builds SearchAuthContext from the real req.user/
 * req.tenant shape + permissionService — same verified facts as M23's
 * real-request-context.adapter.ts.
 */

import type { Request } from 'express';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import type { SearchAuthContext } from '../security/search-access-guard';

export async function buildSearchAuthContext(req: Request): Promise<SearchAuthContext> {
  const userId = req.user?.id;
  const tenantId = req.tenant?.companyId ?? req.user?.companyId;
  if (!userId || !tenantId) {
    throw new Error('buildSearchAuthContext: request is not authenticated');
  }
  const permissions = Array.from(await permissionService.getUserPermissions(userId));
  return { userId, tenantId, permissions };
}
