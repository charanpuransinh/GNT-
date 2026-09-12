/**
 * M29 — controllers/mobile.controller.ts
 * OWN: Mobile Auth & Push HTTP API. Framework-agnostic, standard
 * success/failure envelope (same shape as M23/M24/M26/M27/M28 controllers).
 *
 * login/refresh are PRE-AUTH (no req.user yet) — added to app.ts's
 * PUBLIC_PREFIXES, same as /api/v1/auth/login. push/send requires a real
 * authenticated caller (same global middleware chain as every other module).
 */

import { MobileAuthService, mobileAuthService, MobileAuthError, type MobileLoginCredentials } from '../api/mobile-auth.service';
import { PushNotificationService, pushNotificationService, type PushMessage } from '../notification/push-notification.service';

export interface ApiSuccess<T> { success: true; data: T; meta: { correlationId: string } }
export interface ApiFailure { success: false; error: { code: string; message: string }; meta: { correlationId: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface MobileAuthContext {
  userId: string;
  tenantId: string;
  permissions: string[];
}

export class MobilePermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MobilePermissionDeniedError';
  }
}

export class MobileController {
  constructor(
    private readonly auth: MobileAuthService = mobileAuthService,
    private readonly push: PushNotificationService = pushNotificationService,
  ) {}

  async login(credentials: MobileLoginCredentials, correlationId: string): Promise<ApiResponse<Awaited<ReturnType<MobileAuthService['login']>>>> {
    try {
      const data = await this.auth.login(credentials);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async refresh(refreshToken: string, correlationId: string): Promise<ApiResponse<Awaited<ReturnType<MobileAuthService['refresh']>>>> {
    try {
      const data = await this.auth.refresh(refreshToken);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async sendPush(
    ctx: MobileAuthContext,
    deviceToken: string,
    message: PushMessage,
    correlationId: string,
  ): Promise<ApiResponse<{ delivered: boolean }>> {
    try {
      this.requirePermission(ctx, 'M29:create');
      if (!deviceToken) throw new Error('deviceToken is required');
      const data = await this.push.send(deviceToken, message);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  private requirePermission(ctx: MobileAuthContext, permission: string): void {
    if (!ctx.permissions.includes(permission)) {
      throw new MobilePermissionDeniedError(`Missing permission ${permission}`);
    }
  }

  private toFailure(err: unknown, correlationId: string): ApiFailure {
    const code =
      err instanceof MobilePermissionDeniedError ? 'MOBILE_ACCESS_DENIED' :
      err instanceof MobileAuthError ? 'MOBILE_AUTH_FAILED' :
      'MOBILE_ERROR';
    const message = err instanceof Error ? err.message : 'Unexpected mobile error';
    return { success: false, error: { code, message }, meta: { correlationId } };
  }
}

export const mobileController = new MobileController();
