// ============================================================================
// M25 — Real-Time & Events — wiring tests
//
// EventEmitter/EventRouter/EventRegistry logic is pure in-memory (no DB),
// but EventEmitter's transport publishes on the REAL eventBus, and
// WebSocketAuthGuard's TokenVerifier uses the REAL auth token pipeline
// (authInternal + permissionService, DB-backed) — those two are DB-gated.
// ============================================================================

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eventBus } from '@/common/events/event-bus';
import { mintBearer, TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';

import { eventRegistry, EventRegistryError } from '../events/event-registry';
import { EventRouter } from '../events/event-router';
import { eventEmitter } from '../events/event-emitter';
import { webSocketAuthGuard, WebSocketAuthError } from '../websocket/websocket-auth.guard';
import { webSocketServer } from '../websocket/websocket.server';
import { webSocketRouter } from '../websocket/websocket-router';
import type { SocketConnection } from '../websocket/websocket.server';

function fakeSocket(id: string, sink: string[]): SocketConnection {
  return { id, send: (payload) => sink.push(payload), close: () => {} };
}

describe('M25 — EventRegistry / EventRouter (pure in-memory)', () => {
  it('rejects subscribing to an unregistered event name', () => {
    const router = new EventRouter();
    expect(() => router.subscribe('NOT.REGISTERED', async () => {})).toThrow(EventRegistryError);
  });

  it('routes a registered event to all subscribers, isolating one handler failure', async () => {
    const router = new EventRouter();
    eventRegistry.register({ eventName: `TEST.EVENT.${randomUUID()}`, ownerModule: 'TEST', description: 'x', payloadVersion: 1 });
    const name = [...eventRegistry.list()].find((d) => d.ownerModule === 'TEST')!.eventName;

    let goodCalled = false;
    router.subscribe(name, async () => { goodCalled = true; });
    router.subscribe(name, async () => { throw new Error('bad handler'); });

    const result = await router.route({
      eventId: 'e1', eventName: name, occurredAt: new Date().toISOString(),
      tenantId: 't1', actorId: 'u1', correlationId: 'c1', entityType: 'x', entityId: 'x1',
      payloadVersion: 1, payload: {},
    });

    expect(goodCalled).toBe(true);
    expect(result.delivered).toBe(1);
    expect(result.failed).toBe(1);
  });
});

describe.runIf(process.env.TEST_DB === '1')('M25 — EventEmitter over the real eventBus', () => {
  it('publishes SOCKET.CONNECTED onto the real eventBus', async () => {
    const received: unknown[] = [];
    eventBus.subscribe('SOCKET.CONNECTED', (payload) => { received.push(payload); });

    await eventEmitter.emit({
      eventName: 'SOCKET.CONNECTED', tenantId: TEST_COMPANY_ID, actorId: TEST_USER_ID,
      correlationId: 'corr-sock-1', entityType: 'socket', entityId: 'sock-1',
    });

    expect(received.length).toBe(1);
    expect((received[0] as any).tenantId).toBe(TEST_COMPANY_ID);
  });
});

describe.runIf(process.env.TEST_DB === '1')('M25 — WebSocketAuthGuard (real token verification)', () => {
  it('authenticates a connection using a real minted JWT', async () => {
    const token = mintBearer(TEST_COMPANY_ID, TEST_USER_ID).replace('Bearer ', '');
    const identity = await webSocketAuthGuard.authenticateConnection(token);
    expect(identity.userId).toBe(TEST_USER_ID);
    expect(identity.tenantId).toBe(TEST_COMPANY_ID);
    expect(identity.permissions).toContain('M08:view');
  });

  it('rejects a missing token', async () => {
    await expect(webSocketAuthGuard.authenticateConnection(undefined)).rejects.toThrow(WebSocketAuthError);
  });

  it('rejects an invalid token', async () => {
    await expect(webSocketAuthGuard.authenticateConnection('not-a-real-token')).rejects.toThrow(WebSocketAuthError);
  });

  it('authorizeChannelJoin blocks cross-tenant channel join', async () => {
    const token = mintBearer(TEST_COMPANY_ID, TEST_USER_ID).replace('Bearer ', '');
    const identity = await webSocketAuthGuard.authenticateConnection(token);
    expect(() => webSocketAuthGuard.authorizeChannelJoin(identity, 'some-other-tenant')).toThrow(WebSocketAuthError);
    expect(() => webSocketAuthGuard.authorizeChannelJoin(identity, TEST_COMPANY_ID)).not.toThrow();
  });
});

describe.runIf(process.env.TEST_DB === '1')('M25 — WebSocketServer + WebSocketRouter (tenant-scoped broadcast)', () => {
  it('only broadcasts to connections in the target tenant, and honors the client-deliverable allow-list', async () => {
    const token = mintBearer(TEST_COMPANY_ID, TEST_USER_ID).replace('Bearer ', '');
    const otherToken = mintBearer('00000000-0000-4000-8000-0000000000f2', TEST_USER_ID).replace('Bearer ', '');

    const sinkA: string[] = [];
    const sinkB: string[] = [];
    const connA = fakeSocket('conn-a', sinkA);
    const connB = fakeSocket('conn-b', sinkB);

    await webSocketServer.handleConnection(connA, token);
    await webSocketServer.handleConnection(connB, otherToken);

    const delivered = webSocketRouter.routeToClients({
      eventId: 'e1', eventName: 'NOTIFICATION.CREATED', occurredAt: new Date().toISOString(),
      tenantId: TEST_COMPANY_ID, actorId: TEST_USER_ID, correlationId: 'c1',
      entityType: 'notification', entityId: 'n1', payloadVersion: 1, payload: {},
    });
    expect(delivered).toBe(1);
    expect(sinkA.length).toBe(1);
    expect(sinkB.length).toBe(0);

    const nonDeliverable = webSocketRouter.routeToClients({
      eventId: 'e2', eventName: 'SECURITY.ACCESS_DENIED', occurredAt: new Date().toISOString(),
      tenantId: TEST_COMPANY_ID, actorId: TEST_USER_ID, correlationId: 'c2',
      entityType: 'x', entityId: 'x1', payloadVersion: 1, payload: {},
    });
    expect(nonDeliverable).toBe(0);

    webSocketServer.handleDisconnection('conn-a');
    webSocketServer.handleDisconnection('conn-b');
  });
});
