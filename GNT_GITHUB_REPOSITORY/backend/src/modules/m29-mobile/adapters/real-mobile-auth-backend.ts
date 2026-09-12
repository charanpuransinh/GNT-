/**
 * M29 — adapters/real-mobile-auth-backend.ts
 * WIRED (2026-09-12): AuthBackend over the real M02 authService (login +
 * refreshToken) — verified public export, verified method signatures/shapes.
 */

import { authService } from '@/modules/m02-core-architecture';
import type { AuthBackend } from '../api/mobile-auth.service';

export class RealMobileAuthBackend implements AuthBackend {
  async login(username: string, password: string, companyCode: string) {
    try {
      const result = await authService.login({ username, password, companyCode });
      return {
        userId: result.user.id,
        tenantId: result.user.companyId,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch {
      return null;
    }
  }

  async refresh(refreshToken: string) {
    try {
      return await authService.refreshToken(refreshToken);
    } catch {
      return null;
    }
  }
}

export const realMobileAuthBackend = new RealMobileAuthBackend();
