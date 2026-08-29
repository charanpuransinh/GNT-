# M04 — COMPANY MANAGEMENT — LOCK PACKAGE

## Module Info
- **Module ID:** M04
- **Name:** Company Management
- **Owner:** Team A4-APPLE (M01-M05)
- **Status:** READY FOR LOCK

## File Registry (35 files)
- Frontend: 16 files (6 pages, 4 components, 2 services, 1 store, 1 schema, 1 routes, 1 index)
- Backend: 13 files (1 controller, 3 services, 2 repositories, 1 model, 1 schema, 1 routes, 2 events, 1 types, 1 index)
- API: 2 files (contract YAML, wiring JSON)
- Database: 1 file (schema SQL — company_master, branch_master, financial_year)
- Tests: 3 files (unit, integration, API)

## Database Ownership
- **company_master** — M04 OWNER (CANONICAL ROOT ENTITY)
- **branch_master** — M04 OWNER (CANONICAL)
- **financial_year** — M04 OWNER (CANONICAL)

## Cross-Module Rules
- ✅ M04 -> M02 auth/permission (PUBLIC) — ALLOWED
- ✅ M04 -> M19 audit-logger (EVENT) — ALLOWED
- ❌ M04 -> M05/M06 repository — FORBIDDEN
- ❌ M04 -> Any module DB directly — FORBIDDEN

## Events
- Publishes: `company.profile.updated`, `company.branch.created`, `company.branch.deleted`, `company.fy.switched`, `company.user.created`
- Subscribes: None

## Lock Checklist
- [x] Module Contract
- [x] Repository Map
- [x] File Registry
- [x] Database Map
- [x] Database Registry
- [x] Dependency Map
- [x] Wiring Map
- [x] Wiring Registry
- [x] API Contract
- [x] Integration Contract
- [x] Security Contract (RLS + Auth)
- [ ] Test Report (PENDING — requires DB setup)
- [x] Change Log
- [x] Version: 1.0.0
- [ ] Lock Status: PENDING VERIFICATION
