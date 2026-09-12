/**
 * M25 — websocket/socketio-adapter.ts
 * WIRED (2026-09-13): the live WebSocket transport M25's own notes flagged
 * as missing (no ws/socket.io dependency existed). `socket.io` was added
 * to backend/package.json (owner-authorized — see CERTIFICATION_LOG.md)
 * and is attached to the SAME http.Server app.listen() already returns —
 * no second HTTP server, no change to Express routing.
 *
 * This file is a thin adapter: it maps a socket.io `Socket` onto M25's
 * already-real, already-tested, library-agnostic `SocketConnection`
 * interface and lets `WebSocketServer`/`WebSocketAuthGuard` do the actual
 * auth/tracking work — same real token verification as HTTP
 * (`realTokenVerifier` -> `authInternal.verifyAccessToken`).
 *
 * Rooms: `tenant:{tenantId}` / `user:{userId}` are joined ONLY from the
 * server-verified identity returned by the auth guard — a connecting
 * client can never choose its own tenant/user room.
 *
 * Event bridge: M16's real `notification.sent` (verified call site:
 * m16-notification/services/notification.service.ts) is the only real
 * cross-module event today whose name maps onto M25's own
 * CLIENT_DELIVERABLE_EVENTS allow-list (`NOTIFICATION.SENT`). Translated
 * here, not by changing M16's or M25's existing event names.
 */

import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { eventBus } from '@/common/events/event-bus';
import { webSocketServer } from './websocket.server';
import { webSocketRouter } from './websocket-router';
import { WebSocketAuthError } from './websocket-auth.guard';
import type { SocketConnection } from './websocket.server';
import type { GntEvent } from '../events/event-emitter';

function toSocketConnection(socket: Socket): SocketConnection {
  return {
    id: socket.id,
    send: (payload: string) => socket.emit('message', payload),
    close: () => socket.disconnect(true),
  };
}

let bridged = false;

/** Real cross-module -> real-time bridge. Idempotent — safe if called more than once. */
function bridgeRealEvents(): void {
  if (bridged) return;
  bridged = true;
  eventBus.subscribe('notification.sent', async (payload: {
    notificationId: string; userId?: string; companyId: string; channels?: string[]; timestamp?: string;
  }) => {
    const event: GntEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      eventName: 'NOTIFICATION.SENT',
      occurredAt: payload.timestamp ?? new Date().toISOString(),
      tenantId: payload.companyId,
      actorId: payload.userId ?? 'system',
      correlationId: payload.notificationId,
      entityType: 'notification',
      entityId: payload.notificationId,
      payloadVersion: 1,
      payload: { channels: payload.channels ?? [] },
    };
    webSocketRouter.routeToClients(event);
  });
}

/** Called once from server.ts after app.listen(). Attaches to the existing HTTP server — no second server. */
export function attachRealtimeServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: '/realtime',
    cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true },
  });

  io.on('connection', (socket: Socket) => {
    const token = (socket.handshake.auth?.token as string | undefined) ?? extractBearerFromHeader(socket);

    webSocketServer
      .handleConnection(toSocketConnection(socket), token)
      .then((identity) => {
        socket.join(`tenant:${identity.tenantId}`);
        socket.join(`user:${identity.userId}`);
        socket.emit('connected', { userId: identity.userId, tenantId: identity.tenantId });
      })
      .catch((err: unknown) => {
        const message = err instanceof WebSocketAuthError ? err.message : 'Authentication failed';
        socket.emit('auth_error', { message });
        socket.disconnect(true);
      });

    socket.on('disconnect', () => {
      webSocketServer.handleDisconnection(socket.id);
    });
  });

  bridgeRealEvents();
  return io;
}

function extractBearerFromHeader(socket: Socket): string | undefined {
  const header = socket.handshake.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length);
}
