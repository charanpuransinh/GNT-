# GNT — Module Certification Log (M1–M21)

Each module is certified only after: (1) errors fixed, (2) blueprint/contract rules verified intact,
(3) tests run and actually passing (not just compiling), (4) commit made per module.

---

## 🔒 OWNER LOCK AUTHORIZATION — M01–M10 (2026-09-07)

The owner has issued an official written instruction to LOCK modules **M01 through M10**:

> मैं, चारन पुरानसिंह रंजीतसिंह (Charan Puransinh Ranjitsinh), GNT (सिस्टम/प्रोजेक्ट) के ओनर के रूप में
> यह आधिकारिक अनुमति और निर्देश देता हूँ कि मॉड्यूल्स M01 से M10 तक के सभी लॉक स्टेटस को तुरंत LOCKED
> कर दिया जाए। इसकी फाइनल टेस्टिंग और सत्यापन मैं स्वयं बाद में करूँगा। कृपया तुरंत CERTIFICATION_LOG.md
> और सभी संबंधित मॉड्यूल्स के लॉक पैकेजेज को अपडेट करें।
>
> — चारन पुरानसिंह रंजीतसिंह (owner), 2026-09-07

**Effect:** M01–M10 `Lock Status` = **LOCKED** as of 2026-09-07, on the owner's authority (the only party
who may declare LOCKED, per this project's standing rule and `OWNER_INSTRUCTION_AUTONOMY.md` §2).

**Honesty note recorded at the owner's own direction:** the owner has stated that *final testing and
verification will be performed by the owner personally at a later date*. This lock is therefore an
**owner-authorised lock ahead of the owner's own final verification** — it is NOT a claim that an
additional independent re-verification pass was run beyond the certifications already logged below
(each of which found and fixed a real P0 and passed real-DB tests). No test result has been fabricated.

Full per-module artifact status: see `M01-M10_LOCK_DECLARATION.md`.

---

| Module | Status | Date | Evidence |
|--------|--------|------|----------|
| M01 Foundation | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 31 passed / 0 failed / 7 skipped (DB-gated); typecheck clean; routes match contract |
| M02 Core Architecture | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 102 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean |
| M03 Device Platform | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 23 passed / 0 failed / 0 skipped; typecheck clean; mount path + permission catalog verified; session/device ownership checks confirmed tenant-safe |
| M04 Company Management | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 12 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; P0 in POST /company/users fixed |
| M05 Party Management | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 23 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; party_ledger_view applied, getOutstanding wired to real balance |
| M06 Inventory | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 42 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; DB-connection-leak P0 fixed (7 stray `new PrismaClient()`, 3 per-call inside stock.internal.ts) |
| M07 Purchase | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 8 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; audit-identity spoofing P0 fixed (created_by/approved_by/posted_by no longer trusted from request body) |
| M08 Sales | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 27 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; 2 P0s fixed (tenant-id-from-body on challans, approvedBy/postedBy spoofable via x-user-id header) + DB-connection-leak (10 stray `new PrismaClient()`) |
| M09 GST | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 18 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; e-invoice/e-way-bill routes were never mounted (404 always) + cross-tenant IRN generation P0 + calculateTax cross-tenant P0, all fixed. Live IRP credentials/endpoints remain owner-supplied at deploy time. |
| M10 Accounting | 🔒 LOCKED (owner auth) | 2026-09-07 | Certified 2026-09-05: 45 passed / 0 failed / 0 skipped (real DB, TEST_DB=1); typecheck clean; BRS feature was never mounted (404 always) + cross-tenant BRS P0, fixed |
| M11 Payment | CERTIFIED by DeepSeek (informal docs commit `fd27d8c`) + wired to M10/M05 by Claude | 2026-09-05/06 | 17/17 M11 tests (real DB); M10 ledger/voucher + M05 party validation wiring added and proven with new tests; full backend 590/590 at last check. NOT yet owner-locked. |
| M12 HR | CERTIFIED by DeepSeek (informal docs commit `11830be`) | 2026-09-05 | 9/9 at cert time; **but `payroll.service.ts` still has a live `PENDING OWNER/ACCOUNTANT` marker (placeholder TDS slabs)** — by this log's own rule #1 ("not a single TODO/not-implemented piece"), this is not actually a clean CERTIFIED state until the owner supplies real slabs |
| M13 Automation | NOT certified by anyone | — | Explicitly assigned to Claude to certify (both `log.md` and `DEEPSEEK_LOG.md` say so) — Claude has done wiring/security fixes (M06/M09/M11/M16 event wiring, WEBHOOK SSRF guard) but has not run a full certification pass or declared it CERTIFIED |
| M14 Import/Export | CERTIFIED by Claude — awaiting owner lock | 2026-09-08 | Full cert pass 2026-09-08: **39/39 tests pass** on live PostgreSQL (`TEST_DB=1`), 3× consecutive (was flaky — e2e tests now poll job status instead of `setTimeout(800)`); typecheck clean. Dead files (`uploadMiddleware.ts` etc.) were **already removed** — the earlier note was stale. Fixes this pass: (1) PDF export was fake (wrote JSON to a `.pdf` file) → now a real `pdfkit` tabular PDF; (2) unknown export entity silently produced an empty file → now throws, job goes `FAILED` (no false `COMPLETED`); (3) added `invoice` (SalesInvoice) as a supported export entity. Deps (`xlsx`, `csv-writer`, `pdfkit`) are declared at workspace root — not a bug. See `M14_LOCK_PACKAGE.md`. |
| M15 Sync | CERTIFIED by Claude — awaiting owner lock | 2026-09-08 | Full cert pass 2026-09-08: **22/22 tests** on live PostgreSQL (`TEST_DB=1`), 3× consecutive; typecheck clean; full backend suite green. Fixes this pass: (1) **P0 — 3 stray `new PrismaClient()`** (`sync.service.ts`, `integration.service.ts`, `routes/sync.routes.ts`) → shared `@/common/config/prisma` singleton (same connection-leak class as the M06/M08 P0s); (2) internal sync fetch was PAYMENT-only, others silently empty → now real data for CUSTOMER/PARTY, ITEM/PRODUCT, INVOICE too, unknown entity throws → job `FAILED`; (3) removed API connectors (TALLY/ZOHO) returned silent `[]` → now throw a clear "use FILE source" error; (4) removed 5 placeholder `SELECT 1` test files; (5) flaky `setTimeout(800)` e2e waits → job-status polling; (6) SonarCloud pass — unused imports removed, `processJobAsync` cognitive-complexity split into 5 helpers, dead ternary + divide-by-zero fixed, `external.connector` ternary→helper + Set lookups (biome lint clean, behaviour unchanged). Webhook endpoints are a deliberate loud `501 WEBHOOK_IS_M18` boundary (task #008). See `M15_LOCK_PACKAGE.md`. |
| M16 Notification | CERTIFIED by DeepSeek (informal docs commit `63c1efb`) | 2026-09-05 | 13/13 at cert time; all 6 bugs Claude found afterward (order-link hardcoded secret, etc.) are fixed and verified. NOT yet owner-locked. |
| M17 Reporting | NOT certified by anyone | — | Was almost entirely empty stub adapters; DeepSeek has been actively filling in real data (sales/HR/GST/purchase/inventory/accounting-cashflow) through 2026-09-06 — trial-balance/aging still open per DeepSeek's own commit message |
| M18 External Integration | NOT certified by anyone | — | Active work through 2026-09-06 (webhook e2e wiring, payment-confirm wiring) — not yet independently audited |
| M19 Production Monitoring | NOT certified by anyone | — | Not independently audited |
| M20 International Trade | NOT certified by anyone | — | Not independently audited |
| M21 Data Sense | NOT certified by anyone | — | Active work through 2026-09-06 (sales→M08 adapter); export-adapter party/product-resolve design gap previously logged as needing an owner decision |
| M22 Subscription | NOT certified by anyone | — | New module, not audited |

**⚠️ 2026-09-06 note (Claude):** a claim circulated that "all 16 modules M01–M16 are CERTIFIED and LOCKED, nothing remaining." This table is the correction: only M01–M10 (Claude's own certifications, each with a real P0 found and fixed) and the *informal* M11/M12/M16 (DeepSeek) hold any certification record at all — and M12's is undermined by a still-live PENDING marker. M13/M14/M15 have **no** certification record from anyone, and M13 was explicitly assigned to Claude to certify, not DeepSeek.

**✅ 2026-09-07 update:** the owner (Charan Puransinh Ranjitsinh) has now formally LOCKED M01–M10 in writing (see authorization block above). LOCKED remains **not** declared for M11–M22. The earlier revoked lock (M16–M20, commit `9e7724a`) stays revoked. Only the owner may lock the remaining modules, and only M11/M16 are near-ready (informal cert, need an independent test re-run first).
