# Dependency Analysis Report — GNT backend (M11–M22)

Generated with `dependency-cruiser` (2026-09-06).

## TL;DR

- **Circular dependencies: 19 found → 0 (sab FIXED)** ✅
- **Broken imports: 1 → false positive** (`csv-stringify/sync` — package + `./sync` export valid, tsc 0 + tests pass; dependency-cruiser ka `exports`-field resolution limitation)
- **Orphan files: 26 → real, abhi baaki** (mostly M15 sync ke payment/hr sub-modules jo main routes se wire nahi hue)

## 1. Circular dependencies — FIXED (19 → 0)

**Root cause:** M21 (`data-sense`) ke `index.ts` (barrel) mein `DataGroup`,
`DataSenseStatus`, `DATA_GROUP_OWNER` define the, aur internal files
(`types/dataSense.types.ts`, `services/*.engine.ts`, `transfer.planner.ts`,
`validate.engine.ts`, `controllers/dataSense.controller.ts`) unhe **`../index`
(barrel) se hi import** karte the → barrel cycle.

**Fix:** yeh types/registry alag `types/dataGroup.ts` mein move kiye; index.ts
unhe re-export karta hai, internal files ab seedha `types/dataGroup.ts` se
import karte hain.

**Verify:** tsc 0 · M21 28/28 tests pass · depcruise circular = 0.

## 2. Broken imports — false positive (1)

- `m14-import-export/utils/excelHandler.ts → csv-stringify/sync`

`csv-stringify@6.6.0` installed hai (root `package.json`) aur `./sync` export
valid hai. `tsc` 0 errors + `excelHandler.test.ts` pass. dependency-cruiser ka
`exports`-field subpath resolution is package ko resolve nahi kar pa raha.

## 3. Orphan files — 26 (real, pending)

Mostly **M15 (sync)** ke payment/hr sub-modules jo `index.ts`/`sync.routes.ts`
se wire nahi hue (dead/not-reachable):

- validators: `sync.schema.ts`, `payment.schema.ts`, `hr.schema.ts`
- types: `payment.types.ts`, `hr.types.ts`
- services: `payment.service.ts`, `payment.internal.ts`, `hr.internal.ts`
- routes: `payment.routes.ts`, `hr.routes.ts`
- repositories: `payment.repository.ts`, `employee.repository.ts`, `attendance.repository.ts`
- events: `payment.handlers.ts`, `payment.events.ts`, `hr.handlers.ts`, `hr.events.ts`
- controllers: `payment.controller.ts`, `employee.controller.ts`, `attendance.controller.ts`

Baaki orphans:
- `m14/validators/importExport.schema.ts`
- `m11/events/event.bus.ts` (M11 ka apna local bus, shared nahi)
- `.d.ts` ambient type files (expected — type declarations)

**Note:** yeh orphans "delete karo" ka matlab nahi — inhe ya to main routes se
wire karna hai, ya confirm karke remove karna hai. Owner/architecture decision.

## Files

- `depcruise-report.txt` — text report (current state)
- `depcruise-report.html` — HTML report
- `.dependency-cruiser.cjs` — config (circular + unresolvable + orphan rules)
