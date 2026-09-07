# M13_DEPENDENCY_MAP.md
# ============================================================================
# GNT MASTER BLUEPRINT V2 — M13 SMART AUTOMATION — DEPENDENCY MAP
# Rewritten 2026-09-07 (previous version listed bullmq/ioredis — both removed)
# ============================================================================

## External packages actually used by M13

| Package | Purpose |
|---|---|
| `@prisma/client` | DB access (`automationRule`, `scheduledJob`, `jobExecutionLog`) |
| `express` | routing (controllers are Express handlers) |
| `zod` | request validation (`validators/automation.schema.ts`) |
| Node built-ins | `fetch`, `AbortController`, `setTimeout`, `Intl.DateTimeFormat`, `URL` |

**Not used (removed):** `bullmq`, `ioredis`, any Redis client, any cron library,
any HTTP client library. The cron matcher and the poll loop are hand-rolled in
`utils/cron.ts` and `services/scheduler.service.ts`.

## Internal shared dependencies (backend/src/common)

| Import | Used by |
|---|---|
| `@/common/config/prisma` (singleton) | repository, routes, handlers, scheduler |
| `@/common/events/event-bus` (singleton) | `events/automation.handlers.ts` |
| `@/common/errors/error-classes` (`AppError`) | repository, controllers, scheduler, cron guard |

## Cross-module code dependency

| Import | Direction | Notes |
|---|---|---|
| `@/modules/m16-notification` (`notificationService`, types) | M13 → M16 | **only** public entrypoint used; NOTIFY action |

No other `@/modules/*` import exists in M13. M13 consumes M06/M09/M12/M14
purely through event names on the bus (string coupling, no code import).

## Intra-module dependency order

```
types/m13.types.ts        (no deps)
utils/cron.ts             → AppError
validators/automation.schema.ts → zod
repositories/automation.repository.ts → prisma, AppError, types
services/automation.internal.ts → m16 notificationService, types
services/scheduler.service.ts   → repository, automation.internal, cron, prisma, AppError
services/automation.service.ts  → repository, automation.internal
events/automation.handlers.ts   → eventBus, prisma, repository, automation.internal
controllers/*.ts                → services, repository, cron, AppError
routes/automation.routes.ts     → controllers, services, validators, middleware, prisma
index.ts                        → routes, scheduler.service, automation.handlers
```
