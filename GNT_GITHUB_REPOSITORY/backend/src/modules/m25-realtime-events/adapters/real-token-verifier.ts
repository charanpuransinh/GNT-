/**
 * M25 — adapters/real-token-verifier.ts
 * WIRED (2026-09-12): TokenVerifier over the same real token verification
 * used by HTTP auth (`authInternal.verifyAccessToken`, backend/src/modules/
 * m02-core-architecture/services/auth.internal.ts) and the same permission
 * source as M23 (permissionService.getUserPermissions, "M<code>:<action>").
 * A socket connection is authenticated exactly like an HTTP request — no
 * separate/guessed session mechanism.
 */

import { authInternal } from '@/modules/m02-core-architecture/services/auth.internal';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import type { TokenVerifier, VerifiedSocketIdentity } from '../websocket/websocket-auth.guard';

export class RealTokenVerifier implements TokenVerifier {
  async verify(token: string): Promise<VerifiedSocketIdentity | null> {
    try {
      const payload = await authInternal.verifyAccessToken(token);
      const userId: string | undefined = payload?.userId ?? payload?.id;
      const tenantId: string | undefined = payload?.companyId;
      if (!userId || !tenantId) return null;

      const permissions = Array.from(await permissionService.getUserPermissions(userId));
      return { userId, tenantId, role: '', permissions };
    } catch {
      return null;
    }
  }
}

export const realTokenVerifier = new RealTokenVerifier();
