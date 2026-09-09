# GNT — M11–M20 + M22 LOCK DECLARATION (prepared for owner sign-off)

**Prepared:** 2026-09-08 (by Claude)
**Authority required:** Charan Puransinh Ranjitsinh (Puransinh) — GNT project owner
**Scope:** Modules M11, M12, M13, M14, M15, M16, M17, M18, M19, M20, M22
**Not in scope:** M01–M10 already LOCKED (see `M01-M10_LOCK_DECLARATION.md`). **M21 no longer exists** —
its pipeline was folded into M11 on 2026-09-08 (owner decision; see `CERTIFICATION_LOG.md` and
`M11_LOCK_PACKAGE.md`). Current module set: **M01–M20 + M22 = 21 modules.**

---

## 1. Owner instruction to LOCK (verbatim — to be pasted/confirmed by the owner)

> _[OWNER: paste your written LOCK authorization for M11–M20 + M22 here, the same way it was done for
> M01–M10. Suggested text below — edit freely.]_
>
> मैं, चारन पुरानसिंह रंजीतसिंह (Charan Puransinh Ranjitsinh), GNT प्रोजेक्ट के ओनर के रूप में यह
> आधिकारिक निर्देश देता हूँ कि मॉड्यूल्स **M11 से M20 तक और M22** के लॉक स्टेटस को LOCKED कर दिया जाए।
> इनकी सर्टिफिकेशन Claude द्वारा पूरी हो चुकी है (हर मॉड्यूल का `MXX_LOCK_PACKAGE.md` — 15 में से 14
> आर्टिफैक्ट पूरे, #15 यानी यह ओनर साइन-ऑफ बाकी था)। फाइनल टेस्टिंग मैं स्वयं करूँगा। कृपया
> `CERTIFICATION_LOG.md` और सभी लॉक पैकेजेज अपडेट करें।

Per `OWNER_INSTRUCTION_AUTONOMY.md` §2, only the owner may declare a module `LOCKED`. **Until the owner
confirms the block above, artifact #15 stays PENDING for every module in this declaration** — Claude
has NOT marked any of them LOCKED.

---

## 2. What this lock will mean (and will not mean)

**Will mean:** artifact #15 (Lock Status / owner sign-off) becomes satisfied for M11–M20 + M22.
Combined with the certifications already on record (§4), the modules become LOCKED.

**Will not mean:** a fresh independent third-party re-verification. Every certification here was run by
Claude on the live PostgreSQL database (`TEST_DB=1`) with real assertions — no fabricated output — but
the owner has reserved final acceptance testing to themselves. A lock the owner grants, the owner can
revoke (as happened once for M16–M20, commit `9e7724a`).

---

## 3. The 15 mandatory lock artifacts — status per module

Legend: ✅ present & verified in the module's `MXX_LOCK_PACKAGE.md` · ⏳ PENDING owner sign-off

| # | Artifact | M11 | M12 | M13 | M14 | M15 | M16 | M17 | M18 | M19 | M20 | M22 |
|---|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | Module Contract | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | Repository Map | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | File Registry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | Database Map | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | Database Registry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | Dependency Map | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | Wiring Map | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | Wiring Registry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | API Contract | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | Integration Contract | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | Security Contract (tenant + auth) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 | Test Report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 13 | Change Log | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 14 | Version (1.0.0) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 15 | **Lock Status (owner sign-off)** | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

Artifacts 1–14 are all evidenced in each module's `MXX_LOCK_PACKAGE.md` (14 boxes ticked per file,
verified 2026-09-08). #15 is the only outstanding item and it is the owner's alone.

---

## 4. Certification evidence on record (Claude, live DB, `TEST_DB=1`)

| Module | Name | Module suite | Key P0 / P1 fixed at certification |
|--------|------|--------------|-----------------------------------|
| M11 | Payment | 17/17 (+2 new FIFO-settlement) | "M10 finance integration" was a comment only → real double-entry voucher via `ledgerBridge` → M10 `VoucherService`; party existence checked; direction from party type (was hardcoded `OUT`). **2026-09-08:** absorbed the former M21 data-sense pipeline + implemented decision-#3 bank-receipt FIFO settlement. |
| M12 | HR | 30–32/32 | vendor TDS (194C/J/I) config-driven with flagged fallback; real attendance in payroll; DB salary slabs; `assertValidConfig` rejects a bad `tds_slabs.json`. Owner still enters real FY salary slabs via `/hr/tax-slabs`. |
| M13 | Automation | 25/25 (3× consecutive) | real cron matcher; SSRF-guarded WEBHOOK action; real 30s scheduler; cross-tenant P0 (snake_case `company_id` bypassed tenant check). |
| M14 | Import/Export | 39/39 (3× consecutive) | fake PDF (JSON in a `.pdf`) → real `pdfkit` table; unknown export entity silently empty → throws → job `FAILED`; added `invoice` entity; flaky waits → job-status polling. |
| M15 | Sync | 22/22 (3× consecutive) | **P0** 3× stray `new PrismaClient()` → singleton; PAYMENT-only internal fetch → real CUSTOMER/ITEM/INVOICE; removed API connectors now throw (no silent `[]`); `assertNotTruncated` (limit 5000) fails loudly instead of truncating. |
| M16 | Notification | 16/16 | signed order-link tokens (hardcoded-secret bug + 5 others fixed); real event→template→recipient wiring; honest `NotificationDeliveryLog`. |
| M17 | Reporting | 15/15 | real trial balance (`ledger` grouped by account), real cashflow, real receivables aging (0-30/31-60/61-90/91+); cache invalidation wired to 5 upstream events (was never invalidating). |
| M18 | External Integration | 19/19 | **P1** multi-tenant webhook routing: provider lookup returned the oldest integration across *all* tenants → 2nd tenant always 401. New per-integration URL `/integrations/webhook/:provider/:integrationId`; bare URL 400s if ambiguous. |
| M19 | Production Monitoring | 19/19 | **P0** stray `new PrismaClient()` in `security.routes.ts` → singleton; tamper-evident audit trail (DB-level REVOKE UPDATE/DELETE, migration `006`); 5 real anomaly rules. |
| M20 | International Trade | 52/52 | **P0** 4× stray `new PrismaClient()` → singleton; all trade data `company_id`-scoped; customs/FX/freight calculators tested to the rupee; `customs_tariff` intentionally global. |
| M22 | Subscription | 13/13 | **Security** M22 missing from `permission-catalog.ts` → no permission check on any `/subscriptions` route → added; built the billing lifecycle (`runBillingCycle`, `markInvoicePaid`, `canAccess` grace); Qodo round: removed self-service `/invoices/:id/pay`, grace-deadline check, `@@unique([subscriptionId, periodStart])` (migration `018`), atomic `PENDING→OVERDUE`. |

Whole-branch verification at certification: full backend suite green on live PostgreSQL, `tsc` clean,
biome lint clean, no stray `new PrismaClient()` in these modules, no placeholder / mock / silent-empty
in non-test code.

---

## 5. Lock signatures (to be completed by the owner)

| Module | Lock Status | Date | Authority |
|--------|-------------|------|-----------|
| M11 Payment (incl. Data Sense) | ⏳ PENDING | — | Owner: _________________ |
| M12 HR | ⏳ PENDING | — | Owner: _________________ |
| M13 Automation | ⏳ PENDING | — | Owner: _________________ |
| M14 Import/Export | ⏳ PENDING | — | Owner: _________________ |
| M15 Sync | ⏳ PENDING | — | Owner: _________________ |
| M16 Notification | ⏳ PENDING | — | Owner: _________________ |
| M17 Reporting | ⏳ PENDING | — | Owner: _________________ |
| M18 External Integration | ⏳ PENDING | — | Owner: _________________ |
| M19 Production Monitoring | ⏳ PENDING | — | Owner: _________________ |
| M20 International Trade | ⏳ PENDING | — | Owner: _________________ |
| M22 Subscription | ⏳ PENDING | — | Owner: _________________ |

Once the owner confirms §1, Claude (or the owner) will flip each `MXX_LOCK_PACKAGE.md` artifact #15 to
`🔒 LOCKED`, update `CERTIFICATION_LOG.md`, and this table.

---

## 6. Open owner to-dos before / at lock (not code defects)

- **M12:** enter real FY salary-tax slabs via the `/hr/tax-slabs` admin screen (returns 0 until then —
  honest, not a placeholder).
- **M09/M20:** live IRP / customs credentials remain owner-supplied at deploy time.
- **Migrations to run at deploy:** `018_M22_invoice_period_unique.sql` (M22 dedup + unique index).
- **M11 Data Sense:** RBAC for `/api/v1/payments/data-sense` currently inherits the M11 `payment`
  permission — fine for launch; split into its own permission later if a data-migration operator role
  is wanted.
