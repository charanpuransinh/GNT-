# M17 — REPORTING — LOCK PACKAGE

## Module Info
- **Module ID:** M17
- **Name:** Reporting (cross-module read-only reports, executive dashboard, export, cache)
- **Mount:** `/api/v1/reports`
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 15/15 M17 tests on live PostgreSQL (`TEST_DB=1`); full backend suite green; typecheck clean; biome lint clean (25 files).

## Database Ownership
`ReportConfig`, `ReportTemplate` — M17 OWNER (report definitions + saved templates; canonical `prisma/schema.prisma`).
M17 owns **no transactional data** — it only reads other modules through their public services / canonical tables.

## Public Surface (`/api/v1/reports`)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/generate` | generate any report type with filters |
| GET | `/sales` `/purchase` `/inventory` `/gst` `/accounting` `/hr` | per-domain report |
| GET | `/executive` | executive dashboard (cross-domain summary) |
| POST | `/export` | export a generated report (Excel via `exceljs`, PDF) |
| POST/GET/PUT/DELETE | `/configs` `/configs/:id` | saved report config CRUD |
| POST/GET/PUT/DELETE | `/templates` `/templates/:id` | report template CRUD |

## Adapters — all REAL, tenant-scoped, READ ONLY
| Adapter | Reads from | Notes |
|---------|-----------|-------|
| `accounting.adapter` | M10 `accountingService` + `ledger` / `SalesInvoice` | **day book**, **trial balance** (`ledger` grouped by `account_id`, summed debit/credit), **cashflow** (inflow/outflow in window), **receivables aging** (unpaid/partial invoice outstanding, bucketed 0‑30 / 31‑60 / 61‑90 / 91+, grouped by customer) — all tested |
| `sales.adapter` | M08 `SalesInvoice` | real rows, no fake empty |
| `purchase.adapter` | M07 `purchase_invoice` | real |
| `gst.adapter` | M09 `gst_transaction` + HSN summary | real |
| `inventory.adapter` | M06 stock | real, stock-status classification |
| `hr.adapter` | M12 attendance + salary register | real |

`buildAccountingReport` (`report.internal.ts`) calls all four accounting methods and merges
`{ rows, cashflow, aging, trialBalance }` — the earlier "trial/cashflow/aging अभी खाली" comment was
stale and has been corrected.

## Cache (`services/report.cache.ts`)
Real in-memory per-company / per-report-type cache. `events/report.handlers.ts` subscribes to
`sales.invoice.created`, `purchase.invoice.approved`, `stock.low`, `payment.completed`,
`payroll.paid` and invalidates the matching cache entry (with a double-subscribe guard). Before this
wiring the cache never invalidated — stale reports were served after source data changed.

## Events
- Publishes: `report.generated`, `report.exported`, `report.scheduled`
- Subscribes: the 5 upstream source events above (cache invalidation only — no writes)

## Security
- Auth: token-only via the main `/api/v1` chain
- Every adapter query filtered by `companyId` / `company_id`; a report without a company id returns empty, not cross-tenant data
- Repo takes `PrismaClient` by DI; adapters use the shared `@/common/config/prisma` singleton — no stray `new PrismaClient()`
- M17 is strictly read-only across modules — no cross-module writes, no private-repo access

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/report.routes.ts` + `report.types.ts`)
- [x] Repository Map (`report.repository.ts` + 6 adapters + generator/cache/internal/service)
- [x] File Registry (controller ×1, services ×5, adapters ×6, events ×2, repo ×1, model, validators, types)
- [x] Database Map (`ReportConfig`, `ReportTemplate`)
- [x] Database Registry (canonical `prisma/schema.prisma`)
- [x] Dependency Map (reads M06/M07/M08/M09/M10/M12 public; shared eventBus)
- [x] Wiring Map (`wiring-maps/module-wiring/m17/`)
- [x] Wiring Registry
- [x] API Contract (endpoint table above)
- [x] Integration Contract (adapter contracts; cache-invalidation event contract)
- [x] Security Contract — token identity, per-company filtering, DI/singleton prisma, read-only
- [x] Test Report — 15/15 live-DB: trial balance + receivables aging (with exact bucket assertions), sales/hr/accounting adapters, report generator, repository, event→cache-invalidation wiring
- [x] Change Log — 2026-09-08: trial-balance + aging confirmed real & wired; stale adapter comment fixed; cert pass
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF**

## Known scope boundaries (not defects)
- Aging report is **receivables** (customer) aging. Payables (vendor) aging can be added with the
  same pattern against `purchase_invoice` when needed.
- Cashflow `openingBalance` is 0 (period cashflow, not a running balance sheet).
- Report cache is in-process (no Redis) — invalidated on the 5 source events; acceptable for a
  single-instance deployment.
