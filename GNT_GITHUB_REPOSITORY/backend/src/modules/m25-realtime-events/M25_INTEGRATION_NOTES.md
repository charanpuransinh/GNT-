# M25 — Real-Time & Events — wiring status

Updated 2026-09-12.

## Dropped as duplicates — NOT copied into this module
`notifications/notifications.service.ts`, `notifications/notification-router.ts`,
`notifications/notification-preferences.service.ts` from the source zip are
NOT integrated. `backend/src/modules/m16-notification/` already fully owns
this domain: real email/SMS/WhatsApp senders, `notification_master` +
`notification_delivery_log` Prisma models, read/unread tracking, its own
`NotificationEvents`. Wiring M25's parallel version would create two
competing notification systems — same class of problem found in M23-vs-M19
and M34-vs-M22, resolved the same way (reuse the existing owner, don't
duplicate).

## What's wired
- `events/event-emitter.ts` — `EventTransport` over the real `eventBus`
  (`adapters/real-event-transport.ts`). These 3 event names
  (`EVENT.PUBLISHED`, `SOCKET.CONNECTED`, `SOCKET.DISCONNECTED`) are
  intra-module lifecycle events, deliberately NOT added to
  `event-catalog.ts`'s `GNT_EVENTS` (that catalog is scoped to cross-module
  business events).
- `websocket/websocket-auth.guard.ts` — real `TokenVerifier`
  (`adapters/real-token-verifier.ts`), using the same `authInternal.verifyAccessToken`
  + `permissionService` as HTTP `auth-middleware.ts`. Fully real, fully testable.

## Verified, NOT wired — infrastructure decision, not a guess
`backend/package.json` has no `ws`/`socket.io` dependency: there is no live
WebSocket server in this repo. `WebSocketServer`/`WebSocketRouter` are
library-agnostic by design (`SocketConnection = {id, send, close}`), so
their connection-tracking/broadcast logic is fully wired and tested against
real auth — only the actual live transport (which library, which HTTP-upgrade
path in `app.ts`, a new production dependency) is left for the owner to
decide. Plugging in `ws` later is a thin adapter, not a rewrite.
