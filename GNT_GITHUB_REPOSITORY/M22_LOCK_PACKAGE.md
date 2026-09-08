# M22 — SUBSCRIPTION & BILLING — LOCK PACKAGE

## Module Info
- **Module ID:** M22
- **Name:** Subscription & Billing (plan catalog, company subscription lifecycle, feature gating, invoicing, dunning)
- **Mount:** `/api/v1/subscriptions`
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 11/11 M22 tests on live PostgreSQL (`TEST_DB=1`); typecheck clean; biome lint clean.

## Fixed / added at certification
1. **Security — M22 had NO permission check.** It was missing from `permission-catalog.ts` `MODULES`,
   so `resolveRequiredPermission` returned `null` for every `/api/v1/subscriptions/*` route — any
   authenticated user could create/edit the SaaS plan catalog. Added
   `{ code: 'M22', path: '/api/v1/subscriptions', resource: 'subscription', department: 'admin' }`
   → plan write ops now require `M22:create` / `M22:edit`.
2. **Billing lifecycle + dunning** (the "not audited / skeleton" gap):
   - `runBillingCycle(now?, graceDays=7)` — idempotent, safe to run daily from cron / `POST /billing/run`:
     (a) auto-renew subs whose period ends within 3 days → generate the next invoice (no duplicate),
     (b) `PENDING` invoice past its `periodEnd` → `OVERDUE` + subscription → `PAST_DUE`,
     (c) `OVERDUE` invoice older than the grace window → subscription → `EXPIRED`, `autoRenew` off.
   - `markInvoicePaid` now runs in a transaction: sets `PAID`, extends the subscription `endDate` to
     the invoice's `periodEnd`, and reactivates a `PAST_DUE` / `EXPIRED` sub to `ACTIVE`.
   - `canAccess` grace semantics: `ACTIVE` / `TRIAL` / `PAST_DUE` → access; `EXPIRED` / `CANCELLED` → no.
   - New `PAST_DUE` status added to the type + schema comment.
3. Wired the routes for methods the service already had but never exposed: `/trial`,
   `/access/:feature`, `/invoices/generate`, `/invoices`, `/invoices/:id/pay`, `/billing/run`.

## Database Ownership
`SubscriptionPlan` (global catalog), `CompanySubscription` (per company, `@@unique([companyId])`),
`SubscriptionInvoice` — M22 OWNER. Migrations: `015_M22_subscription.sql`, `016_M22_subscription_invoice.sql`.

## Public Surface (`/api/v1/subscriptions`)
| Method | Path | Purpose | Permission |
|--------|------|---------|-----------|
| GET | `/plans` | plan catalog (pricing page) | `M22:view` |
| POST | `/plans` · PATCH `/plans/:id` | plan CRUD (platform admin) | `M22:create` / `M22:edit` |
| POST | `/subscribe` | subscribe the company to a plan (upsert) | `M22:create` |
| POST | `/trial` | start a trial (default 7 days) | `M22:create` |
| GET | `/active` | company's current subscription + plan | `M22:view` |
| POST | `/cancel` | cancel (status → CANCELLED) | `M22:create` |
| GET | `/access/:feature` | feature-gate check → `{ allowed }` | `M22:view` |
| POST | `/invoices/generate` | invoice for the current period from plan price | `M22:create` |
| GET | `/invoices` | company invoice history | `M22:view` |
| POST | `/invoices/:id/pay` | mark paid → renew + reactivate | `M22:create` |
| POST | `/billing/run` | run the billing lifecycle (cron / admin) | `M22:create` |

## Subscription state machine
`TRIAL` → `ACTIVE` (on subscribe/pay) → `PAST_DUE` (invoice overdue, grace access) → `EXPIRED` (after grace)
· `ACTIVE`/`TRIAL`/`PAST_DUE` → `CANCELLED` (user cancels) · `PAST_DUE`/`EXPIRED` → `ACTIVE` (invoice paid)

## Feature gating
`canAccess(companyId, feature)` — plan `features: ['*']` opens everything; else the feature must be in
the list; `EXPIRED`/`CANCELLED` (or an elapsed `endDate` on ACTIVE/TRIAL) → denied. This is the hook
other modules call to gate premium functionality.

## Security
- All company-subscription / invoice queries tenant-scoped (`companyId`); tenant isolation tested
- Plan catalog is global (the SaaS's own products) — write-guarded by `M22:create/edit`
- Shared `@/common/config/prisma` singleton; `markInvoicePaid` / dunning transitions use `$transaction`
- `runBillingCycle` is system-wide by design (a platform operation) and idempotent

## Cross-Module Rules
- ✅ Other modules call `subscriptionService.canAccess()` (PUBLIC) to gate features
- ✅ A payment gateway confirm (M18 → M11) can call `markInvoicePaid` for a subscription invoice
- ❌ M22 → any module's private repo/DB — FORBIDDEN

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/subscription.routes.ts` + `subscription.types.ts`)
- [x] Repository Map (service-only by blueprint rule — no repository layer)
- [x] File Registry (controller ×1, service ×1, routes, validators, types, index)
- [x] Database Map (`SubscriptionPlan`, `CompanySubscription`, `SubscriptionInvoice`)
- [x] Database Registry (migrations `015`, `016`; canonical `prisma/schema.prisma`)
- [x] Dependency Map (M01/M02 auth + permission catalog; consumed by any module for feature gating; M11/M18 for invoice payment)
- [x] Wiring Map (`wiring-maps/module-wiring/m22/`)
- [x] Wiring Registry
- [x] API Contract (endpoint table above)
- [x] Integration Contract (`canAccess` gate contract; `markInvoicePaid` contract; billing-cycle contract)
- [x] Security Contract — **permission catalog entry added**, tenant-scoped, transactional transitions, prisma singleton
- [x] Test Report — 11/11 live-DB: plan CRUD, subscribe/upsert/cancel, feature gate (+ wildcard), trial, invoice generate/list/pay, **dunning (OVERDUE→PAST_DUE→EXPIRED), pay-reactivates-with-period-extension, auto-renew invoice generation**, HTTP flow, tenant isolation
- [x] Change Log — 2026-09-08: permission-catalog gap fixed; billing lifecycle + dunning + auto-renew; `markInvoicePaid` renewal; routes wired; `PAST_DUE` status
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF**

## Known scope boundaries (not defects)
- `runBillingCycle` is driven by cron / `POST /billing/run` — hook it into an M13 schedule at deploy time.
- Actual money movement (charging a card for a subscription invoice) goes through M18/M11 gateway
  flow; M22 records the invoice and reacts to the confirm.
- Proration on mid-cycle plan changes is not implemented — a plan change takes effect from the next
  invoice period.
