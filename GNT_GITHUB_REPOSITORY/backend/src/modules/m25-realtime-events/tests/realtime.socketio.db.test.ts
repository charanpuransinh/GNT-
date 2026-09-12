// ============================================================================
// M25 — Real-Time & Events — real live WebSocket transport (socket.io)
//
// Verifies the actual gap M25's own notes flagged (no ws/socket.io
// dependency existed, so there was no live transport) is now closed:
// a real http.Server + socket.io, real auth (same token verification as
// HTTP), tenant-scoped rooms joined only from the server-verified
// identity, and the real M16 notification.sent -> client bridge.
// ============================================================================

import { describe, it, expect, afterEach } from 'vitest';
import { createServer, type Server as HttpServer } from 'node:http';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import type { Server as SocketIOServer } from 'socket.io';
import { attachRealtimeServer } from '../websocket/socketio-adapter';
import { webSocketServer } from '../websocket/websocket.server';
import { eventBus } from '@/common/events/event-bus';
import { mintBearer, TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-000000000096';

function rawToken(bearer: string): string {
  return bearer.replace(/^Bearer /, '');
}

describe.runIf(process.env.TEST_DB === '1')('M25 — real-time WebSocket transport (live socket.io)', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let port: number;
  let clients: ClientSocket[] = [];

  async function start(): Promise<void> {
    httpServer = createServer();
    io = attachRealtimeServer(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const address = httpServer.address();
    port = typeof address === 'object' && address ? address.port : 0;
  }

  function connect(token?: string): ClientSocket {
    const socket = ioClient(`http://localhost:${port}`, {
      path: '/realtime',
      auth: token ? { token } : {},
      transports: ['websocket'],
      reconnection: false,
    });
    clients.push(socket);
    return socket;
  }

  afterEach(async () => {
    for (const c of clients) c.disconnect();
    clients = [];
    io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it('a valid token authenticates and receives the server-verified identity, never a client-supplied one', async () => {
    await start();
    const socket = connect(rawToken(mintBearer(TEST_COMPANY_ID, TEST_USER_ID)));
    const connected = await new Promise<{ userId: string; tenantId: string }>((resolve, reject) => {
      socket.on('connected', resolve);
      socket.on('auth_error', reject);
      setTimeout(() => reject(new Error('timeout')), 5000);
    });
    expect(connected.tenantId).toBe(TEST_COMPANY_ID);
    expect(connected.userId).toBe(TEST_USER_ID);
    expect(webSocketServer.activeConnectionCount(TEST_COMPANY_ID)).toBeGreaterThanOrEqual(1);
  });

  it('no token — connection is rejected and disconnected, never left open unauthenticated', async () => {
    await start();
    const socket = connect(undefined);
    const authError = await new Promise<{ message: string }>((resolve, reject) => {
      socket.on('auth_error', resolve);
      setTimeout(() => reject(new Error('timeout — no auth_error received')), 5000);
    });
    expect(authError.message).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(socket.connected).toBe(false);
  });

  it('an invalid/garbage token is rejected the same way', async () => {
    await start();
    const socket = connect('not-a-real-jwt');
    const authError = await new Promise<{ message: string }>((resolve, reject) => {
      socket.on('auth_error', resolve);
      setTimeout(() => reject(new Error('timeout')), 5000);
    });
    expect(authError.message).toBeTruthy();
  });

  it('tenant isolation: broadcastToTenant only reaches connections of that tenant, never another', async () => {
    await start();
    const mine = connect(rawToken(mintBearer(TEST_COMPANY_ID, TEST_USER_ID)));
    const other = connect(rawToken(mintBearer(OTHER_COMPANY_ID, TEST_USER_ID)));
    await Promise.all([
      new Promise((resolve) => mine.on('connected', resolve)),
      new Promise((resolve) => other.on('connected', resolve)),
    ]);

    const otherReceived: string[] = [];
    other.on('message', (payload: string) => otherReceived.push(payload));
    const minePromise = new Promise<string>((resolve) => mine.on('message', resolve));

    webSocketServer.broadcastToTenant(TEST_COMPANY_ID, 'hello-only-my-tenant');
    const received = await minePromise;
    expect(received).toBe('hello-only-my-tenant');

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(otherReceived).toEqual([]);
  });

  it('real M16 notification.sent event reaches the connected client of that tenant', async () => {
    await start();
    const socket = connect(rawToken(mintBearer(TEST_COMPANY_ID, TEST_USER_ID)));
    await new Promise((resolve) => socket.on('connected', resolve));

    const messagePromise = new Promise<string>((resolve) => socket.on('message', resolve));
    await eventBus.publish('notification.sent', {
      notificationId: 'test-notif-1',
      userId: TEST_USER_ID,
      companyId: TEST_COMPANY_ID,
      channels: ['in_app'],
      timestamp: new Date().toISOString(),
    });

    const raw = await messagePromise;
    const parsed = JSON.parse(raw);
    expect(parsed.eventName).toBe('NOTIFICATION.SENT');
    expect(parsed.entityId).toBe('test-notif-1');
  });
});
