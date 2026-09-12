/**
 * M25 — websocket/websocket.server.ts
 * OWN: Manage real-time connections.
 *
 * VERIFIED, still NOT plugged into a live transport: `backend/package.json`
 * has no `ws`/`socket.io` dependency — there is no live WebSocket server in
 * this repo today. Adding one is an infrastructure decision (which library,
 * which HTTP-upgrade path, a new production dependency) beyond routine
 * wiring — flagged for the owner, not guessed here.
 *
 * What IS wired for real: auth (`webSocketAuthGuard`, using the same real
 * token/permission verification as HTTP). This class's connection tracking
 * is library-agnostic by design (`SocketConnection` = {id, send, close}),
 * so plugging in `ws`/`socket.io` later is a thin adapter, not a rewrite.
 */

import { webSocketAuthGuard } from './websocket-auth.guard';

import { VerifiedSocketIdentity, WebSocketAuthGuard } from './websocket-auth.guard';

export interface SocketConnection {
  id: string;
  send(payload: string): void;
  close(): void;
}

interface TrackedConnection {
  connection: SocketConnection;
  identity: VerifiedSocketIdentity;
  connectedAt: string;
}

export class WebSocketServer {
  private connections = new Map<string, TrackedConnection>();

  constructor(private readonly authGuard: WebSocketAuthGuard) {}

  async handleConnection(connection: SocketConnection, token: string | undefined): Promise<VerifiedSocketIdentity> {
    const identity = await this.authGuard.authenticateConnection(token);
    this.connections.set(connection.id, {
      connection,
      identity,
      connectedAt: new Date().toISOString(),
    });
    return identity;
  }

  handleDisconnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  /** Send to a specific tenant's connections only — never cross-tenant broadcast. */
  broadcastToTenant(tenantId: string, payload: string): number {
    let count = 0;
    for (const tracked of this.connections.values()) {
      if (tracked.identity.tenantId === tenantId) {
        tracked.connection.send(payload);
        count += 1;
      }
    }
    return count;
  }

  sendToUser(userId: string, tenantId: string, payload: string): number {
    let count = 0;
    for (const tracked of this.connections.values()) {
      if (tracked.identity.userId === userId && tracked.identity.tenantId === tenantId) {
        tracked.connection.send(payload);
        count += 1;
      }
    }
    return count;
  }

  activeConnectionCount(tenantId?: string): number {
    if (!tenantId) return this.connections.size;
    return [...this.connections.values()].filter((c) => c.identity.tenantId === tenantId).length;
  }
}

export const webSocketServer = new WebSocketServer(webSocketAuthGuard);
