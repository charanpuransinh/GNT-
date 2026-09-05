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
| M10 Accounting | CERTIFIED - PRODUCTION READY | 2026-09-05 | 45 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; BRS feature was never mounted (404 always) + cross-tenant BRS P0, fixed |
| M11 Payment | CERTIFIED by DeepSeek (informal docs commit `fd27d8c`) + wired to M10/M05 by Claude | 2026-09-05/06 | 17/17 M11 tests (real DB); M10 ledger/voucher + M05 party validation wiring added and proven with new tests; full backend 590/590 at last check |
| M12 HR | CERTIFIED by DeepSeek (informal docs commit `11830be`) | 2026-09-05 | 9/9 at cert time; **but `payroll.service.ts` still has a live `PENDING OWNER/ACCOUNTANT` marker (placeholder TDS slabs)** — by this log's own rule #1 ("not a single TODO/not-implemented piece"), this is not actually a clean CERTIFIED state until the owner supplies real slabs |
| M13 Automation | NOT certified by anyone | — | Explicitly assigned to Claude to certify (both `log.md` and `DEEPSEEK_LOG.md` say so) — Claude has done wiring/security fixes (M06/M09/M11/M16 event wiring, WEBHOOK SSRF guard) but has not run a full certification pass or declared it CERTIFIED |
| M14 Import/Export | NOT certified by anyone | — | Was found completely non-functional end-to-end (file never persisted, processJob never triggered, no real inserts) on 2026-09-06; DeepSeek then fixed all of that same day (commits `8e2e4f7`, `4c8b6fd`) and Claude verified the fixes by running the tests directly — but no CERTIFIED declaration has been made, and known dead files (`uploadMiddleware.ts`, `upload.middleware.ts`, `routes/importExport.routes.ts`) are still unremoved |
| M15 Sync | NOT certified by anyone | — | Real engine confirmed honest (returns empty rather than fake data where unfinished); dead-file cleanup in progress (some done, not confirmed complete); external system (Tally/Zoho) connector still doesn't exist |
| M16 Notification | CERTIFIED by DeepSeek (informal docs commit `63c1efb`) | 2026-09-05 | 13/13 at cert time; all 6 bugs Claude found afterward (order-link hardcoded secret, etc.) are fixed and verified |
| M17 Reporting | NOT certified by anyone | — | Was almost entirely empty stub adapters; DeepSeek has been actively filling in real data (sales/HR/GST/purchase/inventory/accounting-cashflow) through 2026-09-06 — trial-balance/aging still open per DeepSeek's own commit message |
| M18 External Integration | NOT certified by anyone | — | Active work through 2026-09-06 (webhook e2e wiring, payment-confirm wiring) — not yet independently audited |
| M19 Production Monitoring | NOT certified by anyone | — | Not independently audited |
| M20 International Trade | NOT certified by anyone | — | Not independently audited |
| M21 Data Sense | NOT certified by anyone | — | Active work through 2026-09-06 (sales→M08 adapter); export-adapter party/product-resolve design gap previously logged as needing an owner decision |
| M22 Subscription | NOT certified by anyone | — | New module, not audited |

**⚠️ 2026-09-06 note (Claude):** a claim circulated that "all 16 modules M01–M16 are CERTIFIED and LOCKED, nothing remaining." This table is the correction: only M01–M10 (Claude's own certifications, each with a real P0 found and fixed) and the *informal* M11/M12/M16 (DeepSeek) hold any certification record at all — and M12's is undermined by a still-live PENDING marker. M13/M14/M15 have **no** certification record from anyone, and M13 was explicitly assigned to Claude to certify, not DeepSeek. "LOCKED" has never been validly declared for any of M11-M21 — it was declared once before for M16-M20 and had to be revoked (commit `9e7724a`). Only the owner can declare LOCKED, per this project's own standing rule.
