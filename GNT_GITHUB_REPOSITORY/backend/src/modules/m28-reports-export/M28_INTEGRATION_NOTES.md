# M28 — Reports & Export — wiring status

Updated 2026-09-12.

## Dropped as duplicates — NOT copied into this module
- `communication/email-dispatcher.ts`, `communication/email-sms.service.ts`,
  `communication/communication-log.service.ts` — M16-notification already
  owns email/SMS delivery end to end (real senders, delivery logs, its own
  events). Same resolution as M25-vs-M16.
- `reports/report-template.service.ts` (+ its `ReportTemplate` interface) —
  M17-reporting already owns a real, persisted `ReportTemplate` Prisma
  model (`@@map("report_template")`, companyId/name/templateType/layoutJson/
  headerHtml/footerHtml). A second, differently-shaped "report template"
  table under the same real table name would be genuinely confusing, not
  just duplicated. `ReportBuilder` now takes a plain inline `ReportSpec`
  (metric keys + columns) instead of a persisted template.

## What's wired
- `reports/report-builder.ts` — `ReportDataProvider` backed by the real,
  wired M27 `analyticsService.computeMetric()`.
- `reports/report-export.service.ts` — real, dependency-free CSV renderer
  (verified: no pdfkit/exceljs/xlsx/puppeteer in `package.json`). PDF/XLSX
  renderers stay unregistered — a new production dependency is an owner
  decision, not guessed here.

## Verified, BLOCKED — not a guess, a real API gap
`scheduler/export-scheduler.ts`'s `SchedulerPort` is NOT wired to M13.
M13's real scheduler exists (`scheduler.service.ts`, genuine 30s-poll job
runner over `scheduled_job`), but M13's public `index.ts` only exports
`AutomationService` (rule CRUD + manual trigger) and `schedulerService`
(start/stop/runDueJobsOnce) — job creation (`createJob`/`updateJob`) lives
on `AutomationRepository`, which is not exported publicly. Reaching into it
directly would violate the same Calling Rule this file is itself written
to respect. `ExportScheduler`'s own logic is complete and tested (with a
mock `SchedulerPort`); it just has no real adapter to inject until M13
exposes a public job-creation method, or the owner decides otherwise.
