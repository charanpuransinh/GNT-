# M13_WIRING_MAP.md
# ============================================================================
# GNT MASTER BLUEPRINT V2 — M13 SMART AUTOMATION — WIRING & CALL MAP
# Rewritten 2026-09-07 (previous version described a deleted BullMQ design)
# ============================================================================

## INBOUND (other modules → M13)

All inbound cross-module signals arrive on the **shared in-process event bus**
(`@/common/events/event-bus`). `registerAutomationEventHandlers()` calls
`eventBus.subscribeAll(...)`; for each event it looks up active `EVENT`-trigger
rules whose `triggerEvent` equals the event name **and** whose `tenantId`
matches the event's `tenantId | companyId | company_id`.

| Source | Event name | Effect |
|---|---|---|
| M06 Inventory | `stock.low` | run matching rules (e.g. NOTIFY purchasing) |
| M09 GST | `gst.einvoice.generated` | run matching rules |
| M12 HR | `payroll.generated`, `payroll.paid` (`payroll.*`) | run matching rules |
| M14 Import/Export | `import.completed`, `export.completed` | run matching rules |
| any module | any published event | eligible if a tenant rule names it |

No module imports M13 code. No module calls an M13 service directly.

## OUTBOUND (M13 → other modules)

| Target | Interface | Exit point | Purpose |
|---|---|---|---|
| M16 Notification | `notificationService.sendNotification(...)` (public API) | `services/automation.internal.ts` → `runNotifyAction` | NOTIFY action |
| external HTTP | `fetch()` — HTTPS only, SSRF-guarded | `services/automation.internal.ts` → `runWebhookAction` | WEBHOOK action |
| (self) `jobExecutionLog` | Prisma | repository | audit trail of every run |

M13 never posts to a ledger, never mutates stock, never writes another
module's tables. LOG actions write only to `jobExecutionLog`.

## INTERNAL WIRING

```
routes/automation.routes.ts
  ├── AutomationController → AutomationService → AutomationRepository → prisma(automationRule)
  └── SchedulerController  → AutomationRepository → prisma(scheduledJob)
                           → schedulerService.runJobNow()

services/scheduler.service.ts  (setInterval 30s, unref)
  runDueJobsOnce() → repo.findDueJobs() → runJob()
    → repo.findRuleById() (fail-closed if rule missing/inactive → PAUSE job)
    → executeRuleActions(rule, tenantId, payload)   [automation.internal.ts]
    → repo.finishLog()
    → repo.updateJob({ lastRunAt, nextRunAt: nextRunAfter(cron, now, tz) })

events/automation.handlers.ts  (eventBus.subscribeAll)
  runEventRules(eventName, payload)
    → payloadTenant(payload)  (tenantId | companyId | company_id)
    → repo.findActiveRulesByEvent(eventName, tenantId)
    → executeRuleActions(...) per rule → repo.finishLog()

services/automation.internal.ts  executeRuleActions()
  for each action (stops at first failure — never reports half-success):
    NOTIFY  → applyTemplate({{keys}}) → notificationService.sendNotification()
    WEBHOOK → assertSafeWebhookUrl() → fetch(https, redirect:error, 10s)
    LOG     → applyTemplate() → string into jobExecutionLog.metadata.steps
```

## Trigger types
- `EVENT` — fired by the bus (see INBOUND)
- `SCHEDULE` — a `scheduledJob` row with a cron expr drives it (30s poll)
- `MANUAL` — `POST /rules/:id/trigger` with a payload
