# GNT — M01–M10 LOCK DECLARATION

**Declared:** 2026-09-07
**Authority:** Charan Puransinh Ranjitsinh (Puransinh) — GNT project owner
**Scope:** Modules M01, M02, M03, M04, M05, M06, M07, M08, M09, M10

---

## 1. Owner instruction (verbatim)

> मैं, चारन पुरानसिंह रंजीतसिंह (Charan Puransinh Ranjitsinh), GNT (सिस्टम/प्रोजेक्ट) के ओनर के रूप में
> यह आधिकारिक अनुमति और निर्देश देता हूँ कि मॉड्यूल्स M01 से M10 तक के सभी लॉक स्टेटस को तुरंत LOCKED
> कर दिया जाए। इसकी फाइनल टेस्टिंग और सत्यापन मैं स्वयं बाद में करूँगा। कृपया तुरंत CERTIFICATION_LOG.md
> और सभी संबंधित मॉड्यूल्स के लॉक पैकेजेज को अपडेट करें।

**Translation of intent:** lock M01–M10 immediately on the owner's authority; the owner will perform
final testing/verification personally at a later date; update `CERTIFICATION_LOG.md` and all related
module lock packages accordingly.

Per `OWNER_INSTRUCTION_AUTONOMY.md` §2, declaring a module `LOCKED`/`VERIFIED` is a decision reserved
to the owner. This instruction satisfies that gate.

---

## 2. What this lock means (and does not mean)

**Means:** artifact #15 (Lock Status / owner sign-off) is now satisfied for M01–M10. Combined with the
certifications already on record (below), M01–M10 are LOCKED.

**Does not mean:** that a fresh independent re-verification pass was run beyond the 2026-09-05
certifications. The owner has explicitly reserved final testing/verification to themselves. No test
output has been fabricated. If the owner's own verification later finds an issue, the lock is the
owner's to revoke (as was done once before for M16–M20, commit `9e7724a`).

---

## 3. The 15 mandatory lock artifacts — status per module

Legend: ✅ present/verified · 📄 covered by CERTIFICATION_LOG evidence, no standalone artifact doc ·
🔒 owner sign-off 2026-09-07

| # | Artifact | M01 | M02 | M03 | M04 | M05 | M06 | M07 | M08 | M09 | M10 |
|---|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | Module Contract | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | Repository Map | 📄 | 📄 | 📄 | ✅ | 📄 | ✅ | 📄 | 📄 | 📄 | 📄 |
| 3 | File Registry | 📄 | 📄 | 📄 | ✅ | 📄 | ✅ | 📄 | 📄 | 📄 | 📄 |
| 4 | Database Map | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | Database Registry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | Dependency Map | 📄 | 📄 | 📄 | ✅ | 📄 | ✅ | 📄 | 📄 | 📄 | 📄 |
| 7 | Wiring Map | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | Wiring Registry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | API Contract | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | Integration Contract | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | Security Contract (RLS + Auth) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 | Test Report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 13 | Change Log | 📄 | 📄 | 📄 | ✅ | 📄 | ✅ | 📄 | 📄 | 📄 | 📄 |
| 14 | Version (1.0.0) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 15 | Lock Status (owner sign-off) | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 |

**Follow-up housekeeping (does not block the lock, tracked for completeness):** items marked 📄 are
proven by the certification record and the live codebase but do not yet have a dedicated standalone
artifact document like M04/M06 have. Recommend back-filling per-module lock packages for M01–M03,
M05, M07–M10 from this declaration + `CERTIFICATION_LOG.md` when convenient.

---

## 4. Certification evidence on record (2026-09-05, unchanged)

| Module | Name | Result | P0 found & fixed at certification |
|--------|------|--------|----------------------------------|
| M01 | Foundation | 31 pass / 0 fail / 7 skip (DB-gated); typecheck clean | routes/contract match verified |
| M02 | Core Architecture | 102 pass / 0 fail (real DB) | — (auth hardening landed in FINAL_INTEGRATION_AUDIT) |
| M03 | Device Platform | 23 pass / 0 fail | session/device ownership confirmed tenant-safe |
| M04 | Company Management | 12 pass / 0 fail (real DB) | P0 in `POST /company/users` |
| M05 | Party Management | 23 pass / 0 fail (real DB) | `party_ledger_view` applied; `getOutstanding` wired to real balance |
| M06 | Inventory | 42 pass / 0 fail (real DB) | DB-connection-leak P0 (10 stray `new PrismaClient()`) |
| M07 | Purchase | 8 pass / 0 fail (real DB) | audit-identity spoofing P0 (`created_by`/`approved_by`/`posted_by`) |
| M08 | Sales / Billing | 27 pass / 0 fail (real DB) | 2 P0s (tenant-id-from-body; `approvedBy`/`postedBy` via header) + connection leak |
| M09 | GST | 18 pass / 0 fail (real DB) | e-invoice/e-way routes never mounted + 2 cross-tenant P0s |
| M10 | Accounting | 45 pass / 0 fail (real DB) | BRS never mounted + cross-tenant BRS P0 |

Latest full backend run (2026-09-07, no DB in this environment): **341 passed / 0 failed / 279
DB-gated skipped** — DB-gated tests skip cleanly, they do not fail.

---

## 5. Lock signatures

| Module | Lock Status | Date | Authority |
|--------|-------------|------|-----------|
| M01 Foundation | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |
| M02 Core Architecture | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |
| M03 Device Platform | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |
| M04 Company Management | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |
| M05 Party Management | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |
| M06 Inventory | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |
| M07 Purchase | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |
| M08 Sales / Billing | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |
| M09 GST | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |
| M10 Accounting | 🔒 LOCKED | 2026-09-07 | Owner: Charan Puransinh Ranjitsinh |

**M11–M22 remain UNLOCKED.** Only the owner may lock them. Nearest to ready: M11 Payment and
M16 Notification (informal cert only — need an independent real-DB test re-run before lock).
