# GNT — Module Certification Log (M1–M21)

Each module is certified only after: (1) errors fixed, (2) blueprint/contract rules verified intact,
(3) tests run and actually passing (not just compiling), (4) commit made per module.

| Module | Status | Date | Evidence |
|--------|--------|------|----------|
| M01 Foundation | CERTIFIED - PRODUCTION READY | 2026-09-05 | 31 passed / 0 failed / 7 skipped (DB-gated); typecheck clean; routes match contract |
| M02 Core Architecture | CERTIFIED - PRODUCTION READY | 2026-09-05 | 102 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean |
| M03 Device Platform | CERTIFIED - PRODUCTION READY | 2026-09-05 | 23 passed / 0 failed / 0 skipped; typecheck clean; mount path + permission catalog verified; session/device ownership checks confirmed tenant-safe |
| M04 Company Management | CERTIFIED - PRODUCTION READY | 2026-09-05 | 12 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; P0 in POST /company/users fixed |
| M05 Party Management | CERTIFIED - PRODUCTION READY | 2026-09-05 | 23 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; party_ledger_view applied, getOutstanding wired to real balance |
| M06 Inventory | CERTIFIED - PRODUCTION READY | 2026-09-05 | 42 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; DB-connection-leak P0 fixed (7 stray `new PrismaClient()`, 3 per-call inside stock.internal.ts) |
| M07 Purchase | CERTIFIED - PRODUCTION READY | 2026-09-05 | 8 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; audit-identity spoofing P0 fixed (created_by/approved_by/posted_by no longer trusted from request body) |
| M08 Sales | CERTIFIED - PRODUCTION READY | 2026-09-05 | 27 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; 2 P0s fixed (tenant-id-from-body on challans, approvedBy/postedBy spoofable via x-user-id header) + DB-connection-leak (10 stray `new PrismaClient()`) |
| M09 GST | CERTIFIED - PRODUCTION READY | 2026-09-05 | 18 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; e-invoice/e-way-bill routes were never mounted (404 always) + cross-tenant IRN generation P0 + calculateTax cross-tenant P0, all fixed |
| M10 Accounting | pending | — | — |
| M11 Payment | pending | — | — |
| M12 HR | pending | — | — |
| M13 Automation | pending | — | — |
| M14 Import/Export | pending | — | — |
| M15 Sync | pending | — | — |
| M16 Notification | pending | — | — |
| M17 Reporting | pending | — | — |
| M18 External Integration | pending | — | — |
| M19 Production Monitoring | pending | — | — |
| M20 International Trade | pending | — | — |
| M21 Data Sense | pending | — | — |
