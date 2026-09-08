# M15 — SYNC — LOCK PACKAGE

## Module Info
- **Module ID:** M15
- **Name:** Sync (internal ↔ external data synchronisation, conflict resolution, backup/restore)
- **Mount:** `/api/v1/sync`
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 22/22 tests on live PostgreSQL (`TEST_DB=1`), 3× consecutive; typecheck clean; full backend suite green.

## P0 fixed at certification
**3 stray `new PrismaClient()`** — `services/sync.service.ts`, `services/integration.service.ts`,
`routes/sync.routes.ts` — each opened its own connection pool. Replaced with the shared
`@/common/config/prisma` singleton. Same DB-connection-leak class as the M06 (7 stray) and
M08 (10 stray) P0s.

## Database Ownership
`SyncConfig`, `SyncEntityConfig`, `SyncJob`, `SyncEntityLog`, `SyncConflict`, `SyncState`,
`BackupJob` — M15 OWNER.

## Public Surface (`/api/v1/sync`)
| Area | Endpoints |
|------|-----------|
| Configs | GET/POST/PUT/DELETE `/configs`, POST `/configs/:id/trigger` |
| Jobs | GET `/jobs`, GET `/jobs/:id`, POST `/jobs/:id/cancel` |
| Conflicts | GET `/conflicts`, POST `/conflicts/:id/resolve`, POST `/conflicts/bulk-resolve` |
| Integrations | GET/POST/PUT/DELETE `/integrations`, POST `/integrations/:id/health` |
| Backups | GET/POST `/backups`, DELETE `/backups/:id`, POST `/backups/:id/restore`, `/restores/:id/rollback` |
| Webhooks | present but return **`501 WEBHOOK_IS_M18`** — deliberate boundary (task #008: webhooks belong to M18) |

## Data sources
**Internal → external** (`fetchInternalEntities`): real tenant-scoped reads for
- `PAYMENT` → `paymentTransaction` (M11)
- `CUSTOMER` / `PARTY` / `SUPPLIER` → `party_master` (M05)
- `ITEM` / `PRODUCT` / `INVENTORY` → `product_master` (M06)
- `INVOICE` → `SalesInvoice` (M08)
- anything else ⇒ **throws** ⇒ sync job `FAILED` (never a silent empty sync).

**External source** (`external.connector.ts`): **FILE only** — uploaded Excel/CSV/JSON
(owner decision: no API/credentials). `INTERNAL` source ⇒ `[]` (engine fills the external side).
TALLY / ZOHO / QUICKBOOKS / … ⇒ **throws** a clear "use FILE source" error (the API connectors
were removed in commit `5f97acb`; no silent 0-sync).

## Events
- Publishes: `sync.job.completed`, `sync.job.failed`, `sync.conflict.detected` (shared eventBus)
- Subscribes: cross-module change events (M05–M14) via `sync.handlers.ts`

## Cross-Module Rules
- ✅ Reads M05/M06/M08/M11 canonical tables — READ-ONLY, tenant-scoped
- ✅ Reuses M14 file parsers (`csvParser`/`excelParser`/`jsonParser`) for FILE source
- ❌ No cross-module writes; no private-repo access
- ⛔ Webhooks explicitly delegated to M18

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/sync.routes.ts` + `schema.prisma`)
- [x] Repository Map (services ×9 mapped)
- [x] File Registry (controllers ×5, services ×9, events ×3, middleware ×2, utils ×2, validators/types)
- [x] Database Map (7 models above)
- [x] Database Registry (`src/modules/m15-sync/schema.prisma` → canonical `prisma/schema.prisma`)
- [x] Dependency Map (M05/M06/M08/M11 public reads; M14 parsers; shared eventBus)
- [x] Wiring Map (`wiring-maps/module-wiring/m15-sync/`)
- [x] Wiring Registry (`m15.lock.json`)
- [x] API Contract (endpoint table above)
- [x] Integration Contract (entity fetch contract; FILE source contract; webhook→M18 boundary)
- [x] Security Contract — every query tenant-scoped, fail-closed; shared prisma singleton; main-app #009 auth chain on every `/api/v1/sync` route; no x-tenant-id header trust (`sync.api.test.ts`)
- [x] Test Report — 22/22 live-DB, 3× consecutive (2026-09-08); flaky waits replaced with polling; 5 placeholder `SELECT 1` files removed
- [x] Change Log — 2026-09-08: prisma-singleton P0; CUSTOMER/ITEM/INVOICE internal fetch; honest failure on unknown entity + removed API connector; test cleanup + determinism
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF**

## Known scope boundaries (not defects)
- No API connectors — FILE source only (owner decision).
- Webhook endpoints return `501` pointing to M18 (task #008).
- `syncDirection: FROM_EXTERNAL` write-back into internal modules is limited; the certified,
  tested path is config → fetch (internal + external) → conflict-detect → job/entity logs.
