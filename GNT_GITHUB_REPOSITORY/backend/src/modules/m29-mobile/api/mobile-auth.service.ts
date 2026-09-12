/**
 * M29 — api/mobile-auth.service.ts
 * OWN: Mobile authentication adapter.
 *
 * WIRED (2026-09-12): adapts onto the real M02 login flow
 * (m02-core-architecture `authService.login`/`authService.refreshToken`).
 * Reshaped from the original blueprint: real `LoginRequest` requires
 * `companyCode` (usernames are unique per company, not globally) — added
 * to `MobileLoginCredentials`. The blueprint's separate `issueTokens(userId,
 * tenantId, deviceId)` step doesn't exist in reality (JWTs aren't
 * device-scoped); login issues tokens directly.
 *
 * `deviceId` is intentionally NOT used to call M03's `deviceService.
 * registerDevice()` here: verified that call requires real device metadata
 * (deviceName, model, platform, osVersion, appVersion) to match/create a
 * device row — a bare deviceId string has nothing to fill those with, and
 * synthesizing fake values would be guessing. Full device registration
 * with real metadata remains a separate real M03 call the mobile client
 * makes directly (M29's original MobileSessionService/mobile_session table
 * was dropped entirely — M03 already owns device/session tracking via
 * `device_registry`/`active_session`; see M29_INTEGRATION_NOTES.md).
 */

export interface MobileLoginCredentials {
  username: string;
  password: string;
  companyCode: string;
}

export interface MobileAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface AuthBackend {
  login(username: string, password: string, companyCode: string): Promise<{ userId: string; tenantId: string; accessToken: string; refreshToken: string } | null>;
  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null>;
}

export class MobileAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MobileAuthError';
  }
}

import jwt from 'jsonwebtoken';

function expiresInSecondsFrom(accessToken: string): number {
  const payload = jwt.decode(accessToken) as { exp?: number } | null;
  return typeof payload?.exp === 'number' ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : 0;
}

export class MobileAuthService {
  constructor(private readonly authBackend: AuthBackend) {}

  async login(credentials: MobileLoginCredentials): Promise<MobileAuthTokens> {
    const result = await this.authBackend.login(credentials.username, credentials.password, credentials.companyCode);
    if (!result) {
      throw new MobileAuthError('Invalid credentials');
    }
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresInSeconds: expiresInSecondsFrom(result.accessToken),
    };
  }

  async refresh(refreshToken: string): Promise<MobileAuthTokens> {
    const tokens = await this.authBackend.refresh(refreshToken);
    if (!tokens) {
      throw new MobileAuthError('Invalid or expired refresh token');
    }
    return { ...tokens, expiresInSeconds: expiresInSecondsFrom(tokens.accessToken) };
  }
}

import { realMobileAuthBackend } from '../adapters/real-mobile-auth-backend';
export const mobileAuthService = new MobileAuthService(realMobileAuthBackend);
