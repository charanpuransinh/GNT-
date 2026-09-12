# M27 — Analytics, KPI & Dashboard — wiring status

Updated 2026-09-12.

## Verified against real repo
- M17-reporting already has real Prisma-backed adapters (sales/HR/accounting/
  GST/inventory/purchase). M27's `AnalyticsQueryService.registerSource()` is
  exactly the extension point this needs — one real source is wired
  (`sales_invoice`, direct read against the real `SalesInvoice` table,
  same "public schema, read-only" pattern M17's own `SalesAdapter` uses).
  Additional sources (HR, accounting, ...) are left as future
  `registerSource()` calls, not guessed wholesale in this pass.
- Fictional `M27.ANALYTICS.READ`/`M27.KPI.READ`/`M27.DASHBOARD.READ`
  permission strings replaced with the real format: all three are read
  operations, mapped to `M27:view` (added M27 to the real permission
  catalog as resource `analytics`).
- New tenant-owned table `analytics_dashboard` (migration 022) for
  dashboard layout/config — genuinely new, no overlap with any M01-M22 table.
- Mounted live at `/api/v1/analytics` (module-registry.ts): `GET /metrics`,
  `POST /kpi/evaluate`, `POST /dashboard/widget`. Two additive
  `ACTION_OVERRIDES` entries added (`/evaluate$`, `/widget$` -> `view`,
  since these are POST-for-body reads, not writes).

## Not done yet
Only one analytics data source is wired (`sales_invoice`). KPI/dashboard
features work end-to-end for any metric backed by that source; a metric
defined against an unregistered `sourceEntity` returns an empty series
(by design — "return empty rather than guessing a query"), not an error.
