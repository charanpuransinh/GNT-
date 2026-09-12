/**
 * M23 — adapters/real-scope-provider.ts
 * WIRED (2026-09-12): ScopeProvider backed by what the real repo actually
 * has. Verified: no module owns department/team master data — only
 * `branchId` exists (req.user.branchId / req.tenant.branchId, set by
 * auth-middleware.ts / tenant-middleware.ts from the token payload).
 *
 * This is a documented limitation, not a guess: departmentId/teamId are
 * always omitted. A caller that requires department/team scope will get an
 * honest SCOPE_MISMATCH via AuthorizationService rather than a fabricated
 * value pretending that data exists.
 */

import { prisma } from '@/common/config/prisma';
import type { BusinessScope } from '../access/authorization.service';
import type { ScopeProvider } from '../access/scope-resolver.service';

export class RealScopeProvider implements ScopeProvider {
  async getScopeForUser(userId: string, tenantId: string): Promise<BusinessScope | null> {
    const user = await prisma.user_master.findFirst({
      where: { id: userId, company_id: tenantId },
      select: { branch_id: true },
    });
    if (!user) return null;
    return user.branch_id ? { branchId: user.branch_id } : {};
  }
}

export const realScopeProvider = new RealScopeProvider();
