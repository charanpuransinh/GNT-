# GNT — Claude ↔ Qwen work split & conflict rules

**Owner:** Charan Puransinh Ranjitsinh · **Date:** 2026-09-08
**Goal:** finish M11–M22 to *certified, ready-for-owner-lock*, two agents in parallel, zero git conflicts.

---

## Ownership

| Module | Owner | State (2026-09-08) |
|--------|-------|--------------------|
| M01–M10 | — | 🔒 LOCKED (owner, PR #8) |
| M11 Payment | Claude | ✅ certified — awaiting owner lock |
| M12 HR | Claude | ✅ certified (branch `m12-tds-json`) — awaiting owner lock + owner enters salary-TDS FY slabs |
| M13 Automation | **Qwen** | pending — real cron + action executors + real auth |
| M14 Import/Export | Claude | ✅ certified & merged (PR #9) |
| M15 Sync | Claude | ✅ certified (branch `m15-cert`) — awaiting owner lock |
| M16 Notification | Claude | ✅ certified — awaiting owner lock |
| M17 Reporting | **Qwen** | pending — trial-balance + aging adapters |
| M18 External Integration | **Qwen** | pending — first security audit + hardening |
| M19 Production Monitoring | **Qwen** | pending — first audit |
| M20 International Trade | **Qwen** | pending — finish `m20-packing-list` `breakdown`/`threeD` stubs + audit |
| M21 Data Sense | Claude | ⛔ BLOCKED — owner decision #3 (bank-statement / party-resolve posting → M10 or M11?) |
| M22 Subscription | **Qwen** | pending — billing lifecycle, plan gating, dunning |

**Claude also owns:** all edits to `CERTIFICATION_LOG.md`, `M01-M10_LOCK_DECLARATION.md`,
the per-module `MXX_LOCK_PACKAGE.md` files, and merges into `backend/prisma/schema.prisma`.

---

## Hard rules (both agents)

1. **One module = one branch = one PR.** Branch name `mXX-<slug>`. Branch from the latest
   `origin/main`; rebase on `origin/main` immediately before opening the PR.
2. **Work only inside your module's own tree:**
   `backend/src/modules/mXX-*/`, `frontend/src/modules/mXX-*/`, and that module's test dir.
3. **Do NOT edit `CERTIFICATION_LOG.md`.** Put your module's proposed status row in the PR
   description. Claude merges it after review. (This is the #1 conflict source.)
4. **Do NOT hand-edit `backend/prisma/schema.prisma`.** New models go in the module's own
   `schema.prisma` + a migration file; ask Claude to merge into the canonical schema.
5. **Migrations:** Qwen uses `020`–`039`. Claude uses `018`–`019`.
6. **Do NOT touch shared files:** `backend/src/module-registry.ts` (every module is already
   `mounted: true`), `backend/src/app.ts`, `backend/src/common/**`, root config.
7. **Do NOT touch another agent's module tree.** Claude's: `m11-payment`, `m12-hr`,
   `m14-import-export`, `m15-sync`, `m16-notification`, `backend/config/`.
8. **Certify against the live DB:** a migrated Postgres `gnt_db` is running. Run with
   `TEST_DB=1`. Run the **full** backend suite (`vitest.config.ts` has `fileParallelism:false`)
   and confirm 0 failures — not just your module folder — before declaring green. Run it 2–3×
   for flaky-test detection (replace any `setTimeout`-based waits with status polling).
9. **"CERTIFIED" only.** Never write "LOCKED" anywhere — that is the owner's word alone
   (`OWNER_INSTRUCTION_AUTONOMY.md` §2).
10. **Never push to `main`, force-push, or merge.** Open a PR; the owner merges.

## Definition of "certified" for a module
- 0 `TODO` / placeholder / mock / silent-empty-instead-of-error in non-test code
- every DB query tenant-scoped and fail-closed; shared `@/common/config/prisma` singleton
  (no stray `new PrismaClient()`)
- real tests on live DB, full suite green 2–3× consecutive
- `tsc -p tsconfig.backend.json --noEmit` clean
- an `MXX_LOCK_PACKAGE.md` with the 15-artifact checklist (Claude writes/merges this)
- a proposed `CERTIFICATION_LOG.md` row in the PR description

## Merge order (avoids schema/log churn)
Claude's ready branches first (`m12-tds-json`, `m15-cert`), then Qwen PRs one at a time,
each rebased on the newly-merged `main`.
