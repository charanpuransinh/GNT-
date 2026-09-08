# M16 — NOTIFICATION ENGINE — LOCK PACKAGE

## Module Info
- **Module ID:** M16
- **Name:** Notification Engine (in-app / email / SMS / WhatsApp notifications, campaigns, secure order links)
- **Mount:** `/api/v1/notifications`
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 16/16 M16 tests on live PostgreSQL (`TEST_DB=1`); combined M11+M16 run 33/33; full backend suite 637/637; typecheck clean; biome lint clean (23 files).

## Database Ownership
`NotificationMaster`, `NotificationDeliveryLog`, `NotificationCampaign` — M16 OWNER.
Migration: `012_M16_campaigns.sql`.

## Public Surface (`/api/v1/notifications`)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/send` | send a notification (`notificationService.sendNotification` — the public API M13/M12/M18 call) |
| GET | `/` · GET `/unread-count` | list / unread count (per user, tenant-scoped) |
| PATCH | `/:id/read` · POST `/batch/read` | mark read |
| GET | `/delivery-log/:id` | per-channel delivery status |
| POST/GET/PATCH/DELETE | `/campaigns` `/campaigns/:id` | campaign CRUD |
| POST | `/campaigns/:id/order-link` | generate a **secure** buyer order link (signed token) |
| POST | `/campaigns/:id/send` | dispatch a campaign |
| GET | `/order-link/:token` | resolve an order link (token-verified, no session) |

## Prior fixes (Claude, on record in CERTIFICATION_LOG)
6 bugs fixed after the informal DeepSeek cert — including a **hardcoded secret in the order-link
token** (now a proper signed token), recipient-default resolution, and event-name / `companyId`
alignment so M11/M12 events actually reach M16 handlers.

## Events
- Publishes: `notification.sent`
- Subscribes: `sales.invoice.created`, `purchase.invoice.approved`, `stock.low`, `payment.completed`
  (received), `payroll.paid` (salary processed), `gst.return.due` — each mapped to a notification
  template + recipient set (company admins by default)

## Security
- `sendNotification` / list / read are tenant-scoped (`companyId`) and user-scoped where relevant
- Order-link tokens are signed and expiry-checked; `/order-link/:token` is the only unauthenticated
  route and it verifies the token before returning anything
- Shared `@/common/config/prisma` singleton — no stray `new PrismaClient()`
- Gateway sends (email/SMS/WhatsApp) go through M18; failures are logged in `NotificationDeliveryLog`
  (no fake "sent" success)

## Cross-Module Rules
- ✅ M16 is called by M12 (HR), M13 (automation NOTIFY action), M18 (integration alerts) via the
  PUBLIC `notificationService`
- ✅ M16 → M18 for actual channel delivery
- ❌ M16 → any module's private repo/DB — FORBIDDEN

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/*` + notification types)
- [x] Repository Map (`notification.repository.ts`, `campaign.repository.ts`)
- [x] File Registry (controllers, services, repositories, events, gateway binding, validators, types)
- [x] Database Map (`NotificationMaster`, `NotificationDeliveryLog`, `NotificationCampaign`)
- [x] Database Registry (migration `012`; canonical `prisma/schema.prisma`)
- [x] Dependency Map (consumed by M12/M13/M18; delivers via M18; subscribes to M06–M12 events)
- [x] Wiring Map (`wiring-maps/module-wiring/m16/`)
- [x] Wiring Registry
- [x] API Contract (endpoint table above)
- [x] Integration Contract (`sendNotification` payload contract; order-link token contract; event→template map)
- [x] Security Contract — tenant/user-scoped, signed order-link tokens, prisma singleton, honest delivery log
- [x] Test Report — 16/16 live-DB (33/33 combined with M11); send/list/read, delivery log, campaign CRUD, secure order-link generate + resolve, event→notification wiring
- [x] Change Log — 2026-09-08: formal cert pass. Earlier (Claude): 6 post-cert bugs fixed (order-link secret, recipient default, event alignment)
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF**

## Known scope boundaries (not defects)
- Live email/SMS/WhatsApp delivery needs M18 gateway credentials; without them the send is logged
  as failed in `NotificationDeliveryLog` (never a fake success). In-app notifications work fully.
