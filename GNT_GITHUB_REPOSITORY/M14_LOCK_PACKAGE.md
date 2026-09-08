# M14 — IMPORT / EXPORT — LOCK PACKAGE

## Module Info
- **Module ID:** M14
- **Name:** Import / Export
- **Mount:** `/api/v1/imports`
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 39/39 tests pass on live PostgreSQL (`TEST_DB=1`), 3× consecutive; typecheck clean; full backend suite green.

## Database Ownership
- **ImportJob** — M14 OWNER
- **ExportJob** — M14 OWNER
- **ImportTemplate** — M14 OWNER
- **ExportTemplate** — M14 OWNER
- **ImportHistory** — M14 OWNER

## Public Surface
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/imports/upload` | multipart file upload → real persisted file → ImportJob |
| POST | `/imports/:jobId/validate` | dry-run validation |
| GET | `/imports/:jobId` / `GET /imports` | job status / list |
| POST | `/imports/:jobId/cancel` · `/retry` | lifecycle |
| POST | `/exports` | create export job (auto-triggers processing) |
| GET | `/exports/:jobId` / `GET /exports` / `/exports/:jobId/download` | status / list / download |
| POST/GET/PUT/DELETE | `/templates...` | import template CRUD |
| GET | `/jobs/dashboard` · POST `/jobs/cleanup` | ops |

## Supported export entities
`customer` / `party` / `supplier` → `party_master`;
`product` / `item` / `inventory` → `product_master`;
`invoice` → `SalesInvoice`.
**Unknown entity ⇒ job `FAILED` with a clear error** (never a silent empty file).

## Formats
CSV (`csv-writer`), XLSX (`xlsx`), JSON, **PDF (`pdfkit` — real tabular PDF)**.
Deps declared at workspace root `GNT_GITHUB_REPOSITORY/package.json` (npm workspace).

## Events
- Publishes: `import.completed`, `export.completed` (shared in-process eventBus → M13 automation, M17 report-cache-invalidate)
- Subscribes: none

## Cross-Module Rules
- ✅ M14 → M01/M02 auth/permission (PUBLIC) — ALLOWED
- ✅ M14 reads M05 `party_master`, M06 `product_master`, M08 `SalesInvoice` for export — READ-ONLY, tenant-scoped
- ❌ M14 → any module's private repository — FORBIDDEN

## 15-Artifact Lock Checklist
- [x] Module Contract (routes/index.ts + schema.prisma)
- [x] Repository Map (services/ + utils/ mapped)
- [x] File Registry (controllers ×4, services ×4, utils ×5, types ×5, validators ×1, routes ×2)
- [x] Database Map (5 models above)
- [x] Database Registry (`src/modules/m14-import-export/schema.prisma`, merged into canonical `prisma/schema.prisma`)
- [x] Dependency Map (uses M01/M02/M05/M06/M08 public + shared eventBus)
- [x] Wiring Map (`wiring-maps/module-wiring/m14-import-export/`)
- [x] Wiring Registry (`m14.lock.json`)
- [x] API Contract (route table above)
- [x] Integration Contract (export entity contract; event payloads)
- [x] Security Contract — every query tenant-scoped (`company_id` / `tenantId`), fail-closed; upload type-checked; tenant-isolation covered by `tenant-isolation.db.test.ts`
- [x] Test Report — 39/39 live-DB, 3× consecutive (2026-09-08); flaky `setTimeout` e2e waits replaced with job-status polling
- [x] Change Log — 2026-09-08: real PDF export; honest unknown-entity failure; `invoice` export entity; e2e test determinism
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF** (Claude may certify; only the owner may LOCK)

## Known scope boundaries (not defects)
- Export entity coverage is 3 entities; more can be added in `fetchEntityData` without touching the framework.
- PDF layout is a plain paginated table (no theming) — sufficient for data export.
