# M13 — AUTOMATION — LOCK PACKAGE

## Module Info
- **Module ID:** M13
- **Name:** Automation (rules engine, scheduler, event-driven automation)
- **Mount:** `/api/v1/automation`
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 25/25 M13 tests on live PostgreSQL (`TEST_DB=1`), 3× consecutive; full backend suite 623/623 (2×); typecheck clean; biome lint clean (19 files).
- **Prerequisite:** the `registerModules` memoize + `hookTimeout` 60s test-infra fix (`fix-registermodules-memoize`) — without it M13's `automation.db.test.ts` `beforeAll` intermittently hit the old 20s hook timeout under full-suite load.

## Database Ownership
`AutomationRule`, `ScheduledJob`, `JobExecutionLog` — M13 OWNER.
Migrations: `003_M13_automation_rule.sql`, `011_M13_automation_tables.sql`.

## Public Surface (`/api/v1/automation`)
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/rules` | list / create automation rule (zod-validated) |
| GET/PATCH/DELETE | `/rules/:id` | read / update / delete (tenant-scoped) |
| POST | `/rules/:id/trigger` | manual trigger → runs actions → execution log |
| GET | `/schedules` · POST `/schedules` | list / create scheduled job (cron + timezone validated) |
| PATCH/DELETE | `/schedules/:id` | update / delete |
| POST | `/schedules/:id/run` | run a job now |
| GET | `/schedules/:id/executions` · GET `/executions` | execution history |

## Trigger types
- **MANUAL** — via `/rules/:id/trigger`
- **SCHEDULE** — cron expression, real matcher in `utils/cron.ts` (5 fields, `*` `,` `-` `/`, ranges, IANA timezone via `Intl`, standard "dom & dow both restricted ⇒ OR" rule), `nextRunAfter` searches up to 366 days
- **EVENT** — subscribes to the shared in-process eventBus (`subscribeAll`); rules with `triggerEvent: 'payroll.generated'` etc. fire on real M06/M09/M11/M12/M14/M16 events

## Action executor (`services/automation.internal.ts`)
| Action | Behaviour |
|--------|-----------|
| `NOTIFY` | real `notificationService.sendNotification()` (M16 public API), `{{key}}` templates filled from payload, **missing key ⇒ clear error** |
| `WEBHOOK` | real `fetch()` **behind `assertSafeWebhookUrl`**: https-only, rejects `localhost`/`127.0.0.1`/`::1`/`10.`/`192.168.`/`172.16–31.`/`169.254.` (cloud metadata), rejects URL credentials, `redirect: 'error'`, 10s `AbortController` timeout, strips `host`/`content-length` headers |
| `LOG` | recorded in the execution log |
Actions run in order; **first failure stops and returns FAILED** — never a partial "success".

## Events
- Publishes: `workflow.executed`, `workflow.failed` (via execution log + bus relay)
- Subscribes: **all** bus events (filters by `triggerEvent` + tenant)

## Security
- Identity from verified token only (`req.tenant` / `req.user`), never headers — `401` without token (tested)
- Every rule/job/log query tenant-scoped; cross-tenant read + write blocked (tested)
- **Cross-tenant P0 fixed:** `events/automation.handlers.ts` `payloadTenant()` now also reads snake_case `company_id` (M06–M10 events use it); before, tenantId came back `undefined` and *every* company's matching rules ran on another company's event — caught by `m06-wiring.db.test.ts`
- WEBHOOK SSRF guard (above), 5 attack vectors tested
- Shared `@/common/config/prisma` singleton — no stray `new PrismaClient()`

## Cross-Module Rules
- ✅ M13 → M16 `notificationService` (PUBLIC) — ALLOWED
- ✅ M13 reacts to M06/M09/M11/M12/M14/M16 events (bus) — READ-ONLY
- ❌ M13 → direct financial posting / direct stock modification — FORBIDDEN (not present)
- ❌ M13 → any module's private repo/DB — FORBIDDEN

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/automation.routes.ts` + schema)
- [x] Repository Map (`automation.repository.ts`, 237 lines, 33 tenant-scoped queries)
- [x] File Registry (controllers ×2, services ×3, events ×1, middleware ×1, repo ×1, utils ×1 (cron), validators, types)
- [x] Database Map (`AutomationRule` → `ScheduledJob` → `JobExecutionLog`)
- [x] Database Registry (migrations `003`, `011`; canonical `prisma/schema.prisma`)
- [x] Dependency Map (M16 public API; shared eventBus; M01/M02 auth)
- [x] Wiring Map (`wiring-maps/module-wiring/m13/`)
- [x] Wiring Registry
- [x] API Contract (endpoint table above)
- [x] Integration Contract (action-executor contract; event-trigger contract; SSRF policy)
- [x] Security Contract — token-only identity, tenant-scoped, SSRF guard, cross-tenant P0 fixed
- [x] Test Report — 25/25 live-DB, 3× consecutive (2026-09-08); cron unit ×8, rule/schedule/tenant-isolation, EVENT-via-bus, M06/M09/M14 wiring, SSRF ×5
- [x] Change Log — 2026-09-08: full cert pass; earlier (Claude): real cron, action executors + SSRF guard, scheduler loop, cross-tenant handler P0
- [x] Version: 2.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF**

## Known scope boundaries (not defects)
- In-process scheduler (30s poll, `unref`'d) — no external queue library (network-restricted env). Deterministic `runDueJobsOnce()` entrypoint for tests.
- Action set is NOTIFY / WEBHOOK / LOG — the deliberately safe set (no direct writes into other modules).
