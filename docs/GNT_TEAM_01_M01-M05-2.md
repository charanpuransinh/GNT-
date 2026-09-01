# GARUDA NEXTECH (GNT) — TEAM IMPLEMENTATION HANDOFF

## MASTER AUTHORITY
This is a controlled team handoff derived from the GNT Advanced Software Blueprint V2.
The GNT Master Blueprint Rules 1–93 remain globally binding. No team may change
module ownership, numbering, database ownership, public contracts, security rules,
or cross-module architecture by assumption.

## UNIVERSAL COMPLETION RULE
The assigned modules must be COMPLETE before integration:
Frontend + Backend + API Contracts + Database + Tests + Repository Map +
Dependency Map + Wiring Map + Test Map.

Only public contracts and controlled wiring may cross module/team boundaries.
Private/internal/repository files must never be called directly by another module.

# PART 1 — M01-M05

## ASSIGNED SCOPE
**M01–M05**

```text
M01 Foundation
M02 Core Architecture
M03 Device & Platform
M04 Company Management
M05 Party Management
```

## TEAM-SPECIFIC RULES
PART 1 is the foundation/business-base boundary.
Only 1–2 controlled public integration/wiring artifacts may cross to PART 2.
No unfinished internal implementation may be hidden behind wiring.

## MANDATORY FEATURE OWNERSHIP

- Smart Purchase Bill OCR → M07; OCR proposes data, validation/approval is mandatory.
- Auto Stock Alert + Purchase Order Draft → M13 automation + M07 purchase.
- Barcode / QR Tracking → M06.
- GST + HSN Security Lock → M09.
- Dual Backup → M15.
- Offline-first + Auto Sync → M15.
- International Trade + 8-Digit HSN → M20.
- Executive BI Dashboard → M17.
- Workflow Approval Engine → M13 + owning business module contracts.
- Advanced Search → common search foundation + module public search contracts.
- Real-Time Collaboration → M15 sync + M18 controlled integration layer.

## CONTROLLED GROUP-TO-GROUP WIRING MAP

```text
PART 1 (M01-M05)
   |
   | public contracts + controlled wiring only
   v
PART 2 (M06-M10)
   |
   | public contracts + controlled wiring only
   v
PART 3 (M11-M15)
   |
   | public contracts + controlled wiring only
   v
PART 4 (M16-M20)

CORE FLOWS
M05 -> M06 -> M07/M08 -> M09 -> M10 -> M11
M06 -> M13 -> M07
M15 -> ALL MODULES (offline/sync contract only)
M18 -> external systems
M20 -> M05/M06/M07/M08/M09/M10/M11/M18
M19 <- audit/security/health events from all modules
```

## FILE-PLACEMENT MASTER MAP

```text
Frontend:
frontend/src/modules/<module>/...

Backend:
backend/src/modules/<module>/...

API Contracts:
api-contracts/v1/

Module Wiring:
wiring-maps/module-wiring/

Cross-Module Flows:
wiring-maps/cross-module-flows/

Event Registry:
wiring-maps/event-registry/

Database:
controlled database schema/migration paths

Tests:
module test directories + master test registry
```

Rules:
1. Every file has exactly one owning module.
2. Shared technical files belong only in the approved shared foundation.
3. API contracts are public boundaries.
4. Wiring files connect completed modules; they do not replace missing implementation.
5. Private/internal/repository files are never legal cross-module dependencies.

## LOCK GATE

The team delivers its modules as a self-contained, tested package.
Integration is permitted only after:
- all assigned files are present,
- API contracts are complete,
- database ownership is verified,
- dependency/wiring maps are complete,
- tests pass,
- no forbidden direct cross-module access exists,
- the package is ready for ChatGPT verification.

**No repository placement or architecture change is authorized merely by this handoff.**
