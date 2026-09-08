# M12 — HR — LOCK PACKAGE

## Module Info
- **Module ID:** M12
- **Name:** HR (employees, departments, attendance, leave, payroll, salary + vendor TDS)
- **Mount:** `/api/v1/hr`
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
  *(owner still needs to seed real FY salary-tax slabs via the admin screen — data entry, not code)*
- **Certification evidence:** 30/30 M12 tests on live PostgreSQL (`TEST_DB=1`); typecheck clean; full backend suite green (this branch: `m12-tds-json`).

## Database Ownership
`Employee`, `Department`, `EmployeeDocument`, `Attendance`, `LeaveType`, `Leave`, `LeaveBalance`,
`Payroll`, `PayrollTemplate`, `TaxSlabMaster`, `hr_event_log` — M12 OWNER.
Migrations: `002_M12_employee_master.sql`, `014_M12_leave_number_per_tenant.sql`,
`017_M12_tax_slab_master.sql`.

## Public Surface (`/api/v1/hr`)
| Area | Endpoints |
|------|-----------|
| Employees | POST/GET `/employees`, GET/PATCH/DELETE `/employees/:id`, GET `/employees/stats`, POST `/employees/:id/documents` |
| Attendance | POST `/attendance/check-in` · `/check-out`, GET `/attendance/employee/:id` · `/attendance/monthly-report`, POST `/attendance/bulk` |
| Leave | POST `/leaves`, GET `/leaves/pending` · `/leaves/employee/:id` · `/leaves/balance/:id`, POST `/leaves/:id/approve` · `/reject` |
| Departments | POST/GET `/departments`, GET `/departments/tree`, PATCH/DELETE `/departments/:id` |
| Payroll | POST `/payroll/generate`, GET `/payroll/employee/:id` · `/payroll/summary`, POST `/payroll/:id/pay` |
| Salary TDS slabs (s.192) | GET/POST `/tax-slabs` — DB-backed, effective-dated, owner/accountant editable |
| Vendor TDS (194C/194J/194I) | GET `/tds-sections`, POST `/tds-sections/calculate` |

## TDS — two separate, honest mechanisms
| | Salary TDS (s.192) | Vendor TDS (194C / 194J / 194I) |
|---|---|---|
| Where | `services/tax-slab.service.ts` | `services/tds-section.service.ts` |
| Source | `TaxSlabMaster` DB table, effective-dated, regime OLD/NEW | `config/tds_slabs.json` (owner-editable, hot-reloaded on mtime change, no redeploy) |
| Empty state | returns **0** (no dummy slabs) until owner enters real FY slabs | in-code fallback (owner-supplied current rates), **every API response flagged `source:"fallback"`** so a missing file is visible |
| Edit path | `/hr/tax-slabs` admin screen | edit `config/tds_slabs.json` |

The old `payroll.service.ts` "PENDING OWNER/ACCOUNTANT placeholder (placeholder TDS slabs)" marker
that the CERTIFICATION_LOG flagged **does not exist in the code** — payroll computes TDS via
`taxSlabService.calculateMonthlyTDS()` which returns 0 for unconfigured years (honest, not a placeholder).

## Events (`events/hr.events.ts`)
- Publishes: `employee.created/updated/deleted`, `leave.applied/approved/rejected`,
  `payroll.generated/paid` — an audit row in `hr_event_log` (`processed: true`, no fake pending
  queue) **plus** a dot-case relay on the shared eventBus (`payroll.generated` etc.) so M13
  EVENT-rules and M11/M16 pick them up. `tenantId` is required in the payload (M13 rule-matching
  is tenant-safe because of it).

## Security
- Identity from verified token; tenant-scoped queries; cross-tenant read + write blocked
- Shared `@/common/config/prisma` singleton (no stray `new PrismaClient()`)
- Payroll `daysWorked`/`daysAbsent` from real `AttendanceService.getMonthlyReport` (was hardcoded 0)

## Cross-Module Rules
- ✅ M12 → M01/M02 auth (PUBLIC)
- ✅ M12 publishes to shared eventBus → M11 (payroll payment), M13 (automation), M16 (notification)
- ❌ M12 → any module's private repo/DB — FORBIDDEN

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/hr.routes.ts` + schema)
- [x] Repository Map (services ×8 mapped)
- [x] File Registry (controllers, services ×8, events, validators ×2, types)
- [x] Database Map (11 models above)
- [x] Database Registry (migrations `002`, `014`, `017`; `m12.lock.json`; canonical schema)
- [x] Dependency Map (M01/M02 auth; shared eventBus; M11/M13/M16 consume M12 events)
- [x] Wiring Map (`wiring-maps/module-wiring/m12-hr/`)
- [x] Wiring Registry (`m12.lock.json`)
- [x] API Contract (endpoint table above)
- [x] Integration Contract (event payloads; TDS config-file contract; `config/tds_slabs.json` schema — see `backend/config/README.md`)
- [x] Security Contract — token identity, tenant-scoped, prisma singleton, TDS fallback flagged
- [x] Test Report — 30/30 live-DB (17 base + 13 vendor-TDS: file source, hot-reload, new-section-in-file, missing-file fallback, malformed JSON, per-section fallback, rate/threshold math)
- [x] Change Log — 2026-09-08: full cert pass. 2026-09-07: config-driven vendor TDS (194C/J/I). Earlier: real attendance in payroll, DB tax slabs, prisma singleton
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF** — and owner enters real FY salary slabs via `/hr/tax-slabs`

## Owner-authorised exception on record
The in-code `FALLBACK_DEFAULTS` in `tds-section.service.ts` (194C 1%/2%>30k, 194J 10%>50k,
194I 2%>2.4L) are an explicit owner-authorised exception to the "no placeholder constants" rule
(owner instruction 2026-09-07). They serve only if `config/tds_slabs.json` is missing/unreadable,
and every response says `source:"fallback"` when they are in use.
