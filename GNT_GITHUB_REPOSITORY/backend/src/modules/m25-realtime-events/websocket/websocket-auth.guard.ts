/**
 * M25 — websocket/websocket-auth.guard.ts
 * OWN: Authenticate and authorize socket connections.
 *
 * WIRED (2026-09-12): default TokenVerifier is `realTokenVerifier`
 * (adapters/real-token-verifier.ts) — the same `authInternal.verifyAccessToken`
 * + `permissionService` used by HTTP auth-middleware.ts.
 */

export interface VerifiedSocketIdentity {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

export interface TokenVerifier {
  verify(token: string): Promise<VerifiedSocketIdentity | null>;
}

export class WebSocketAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebSocketAuthError';
  }
}

export class WebSocketAuthGuard {
  constructor(private readonly tokenVerifier: TokenVerifier) {}

  async authenticateConnection(token: string | undefined): Promise<VerifiedSocketIdentity> {
    if (!token) {
      throw new WebSocketAuthError('Missing connection token');
    }
    const identity = await this.tokenVerifier.verify(token);
    if (!identity) {
      throw new WebSocketAuthError('Invalid or expired connection token');
    }
    return identity;
  }

  /** A connected socket may only join rooms/channels within its own tenant. */
  authorizeChannelJoin(identity: VerifiedSocketIdentity, channelTenantId: string): void {
    if (identity.tenantId !== channelTenantId) {
      throw new WebSocketAuthError('Cannot join a channel outside your tenant');
    }
  }
}

import { realTokenVerifier } from '../adapters/real-token-verifier';
export const webSocketAuthGuard = new WebSocketAuthGuard(realTokenVerifier);
