# M13_LOCK_PACKAGE.md
# ============================================================================
# GNT MASTER BLUEPRINT V2 — M13 SMART AUTOMATION — CERTIFICATION PACKAGE
# Status: CERTIFIED - PRODUCTION READY (Claude, 2026-09-07)
# ============================================================================

> ⚠️ 2026-09-07 rewrite: the previous version of this file described a
> BullMQ + Redis + 33-file implementation with placeholder cron and
> "logs only, no real calls" action execution. **That implementation was
> deleted and rebuilt.** None of those files exist any more. This document
> now reflects what is actually in the tree and passing tests.

## Module Identity
- Module Code: M13
- Module Name: Smart Automation (Scheduler + Event-driven Rules)
- Blueprint: §7.13 — Scheduler, Alerts, Reminders, Notification hooks
- Layer: Backend
- Mount: `/api/v1/automation` (via `initM13Module()` in `module-registry.ts`)

## Architecture
- Modular monolith. Node + Express + Prisma + PostgreSQL.
- **No BullMQ, no Redis, no external queue.** A single `unref`'d
  `setInterval` (30s) polls due jobs; a hand-rolled 5-field cron matcher
  (`utils/cron.ts`) computes `nextRunAt` in the job's timezone.
- Cross-module input is consumed **only** off the shared in-process event
  bus (`@/common/events/event-bus` → `subscribeAll`). Cross-module output
  is **only** via M16's public `notificationService` (NOTIFY action) or an
  outbound HTTPS webhook (WEBHOOK action). No direct DB access to other
  modules; no direct financial posting; no direct stock mutation.

## Files (actual)

| Layer | File |
|---|---|
| Entry | `index.ts` — `initM13Module()`, `shutdownM13Module()`, public exports |
| Controller | `controllers/automation.controller.ts` (rules + executions) |
| Controller | `controllers/scheduler.controller.ts` (schedules/jobs) |
| Service | `services/automation.service.ts` (rule CRUD + manual trigger) |
| Service | `services/automation.internal.ts` (action executor: NOTIFY / WEBHOOK / LOG, SSRF guard) |
| Service | `services/scheduler.service.ts` (due-job poll loop + `runJobNow`) |
| Events | `events/automation.handlers.ts` (`registerAutomationEventHandlers` → `subscribeAll`) |
| Repository | `repositories/automation.repository.ts` (tenant-scoped, fail-closed) |
| Validators | `validators/automation.schema.ts` (zod) |
| Middleware | `middleware/m13.middleware.ts` (`validateMiddleware` — real zod, not a mock) |
| Utils | `utils/cron.ts` (5-field cron matcher + `nextRunAfter` + timezone check) |
| Types | `types/m13.types.ts` |

## Database (Prisma models, migrations `003_M13_automation_rule.sql`, `011_M13_automation_tables.sql`)
- `automationRule` — id, tenantId, name, triggerType (`EVENT` | `SCHEDULE` | `MANUAL`),
  triggerEvent, triggerConfig (json), actions (json[]), isActive, audit columns
- `scheduledJob` — id, tenantId, ruleId, cronExpr, timezone, payload (json),
  status (`ACTIVE` | `PAUSED`), lastRunAt, nextRunAt
- `jobExecutionLog` — id, tenantId, ruleId, jobId, status (`RUNNING` | `SUCCESS` | `FAILED`),
  message, metadata (json), startedAt, finishedAt

## API (13 routes, all under global auth + tenant + permission `M13:*`)
- `GET/POST /rules`, `GET/PATCH/DELETE /rules/:id`, `POST /rules/:id/trigger`
- `GET/POST /schedules`, `PATCH/DELETE /schedules/:id`,
  `POST /schedules/:id/run`, `GET /schedules/:id/executions`
- `GET /executions`

## Security
- Auth / tenant / permission enforced globally on `/api/v1` (`app.ts`);
  `M13` is registered in `common/auth/permission-catalog.ts`.
- Every repository query is `tenantId`-scoped; `SchedulerController.tenant()`
  throws `FORBIDDEN_NO_TENANT` if absent. Tenant/user come from the verified
  token (`req.tenant` / `req.user`), never headers or body.
- WEBHOOK action: `assertSafeWebhookUrl` — https only, no credentials in URL,
  blocks `localhost`/`127.*`/`::1`/`10.*`/`192.168.*`/`172.16–31.*`/`169.254.*`
  (cloud-metadata), `redirect: 'error'`, 10s abort timeout, strips
  `host`/`content-length` headers.
- Event handler derives tenant from `tenantId` | `companyId` | `company_id`
  (snake_case modules) — prevents cross-tenant rule execution
  (regression-tested in `tests/m06-wiring.db.test.ts`).

## Cross-module wiring (verified by live-DB tests)
| Direction | Event | Test |
|---|---|---|
| M06 → M13 | `stock.low` | `tests/m06-wiring.db.test.ts` |
| M09 → M13 | `gst.einvoice.generated` | `tests/m09-wiring.db.test.ts` |
| M12 → M13 | `payroll.*` | `m12-hr/tests/unit/m13-wiring.db.test.ts` |
| M14 → M13 | `import.completed` / `export.completed` | `tests/m14-wiring.db.test.ts` |
| M13 → M16 | NOTIFY action → `notificationService.sendNotification` | `tests/automation.db.test.ts` |

## Tests — 25 / 25 passing (`TEST_DB=1`, live PostgreSQL)
- `tests/automation.db.test.ts` — rule CRUD, manual trigger, scheduled job run, execution log
- `tests/m06-wiring.db.test.ts`, `tests/m09-wiring.db.test.ts`, `tests/m14-wiring.db.test.ts`
- `tests/webhook-ssrf.db.test.ts` — SSRF guard rejects private/metadata targets
- `tests/unit/cron.test.ts` — cron field parsing, DOM/DOW OR semantics, timezone, `nextRunAfter`

## Certification checklist
- [x] `vitest run` M13 — 25 passed / 0 failed / 0 skipped (`TEST_DB=1`)
- [x] `tsc -p tsconfig.backend.json --noEmit` — 0 errors
- [x] No TODO / FIXME / stub / "not implemented" / placeholder in module source
- [x] Mounted and reachable (`/api/v1/automation`)
- [x] Tenant isolation on every path + every event
- [x] SSRF-safe outbound webhooks
- [x] Cross-module event consumption proven with real DB tests
- [x] Stale BullMQ-era docs replaced (this file, `M13_WIRING_MAP.md`, `M13_DEPENDENCY_MAP.md`)

## Signature
MODULE: M13 Smart Automation
STATUS: CERTIFIED - PRODUCTION READY
CERTIFIED BY: Claude — 2026-09-07
NOTE: "LOCKED" is an owner-only declaration and has not been made.
