# GNT A — FULL ARCHITECTURE BLUEPRINT (M01-M05)

## 0. AUTHORITY AND STATUS

This document is a **team-level implementation architecture** derived from the
GNT Advanced Software Blueprint. The global GNT Master Blueprint Rules 1–93 are
binding. Module ownership, numbering, canonical database ownership, security,
contracts and controlled wiring may not be changed by the team.

**Do not guess. Do not duplicate. Do not call private files of another module.**
Every module must be built as a complete package before its integration wiring is
accepted.

## 1. WHAT THIS BLUEPRINT MUST ENABLE

A developer or AI receiving only this team blueprint must be able to determine:

- exactly which modules belong to the team;
- the repository root and module folder locations;
- frontend/backend/API/database/test placement;
- the files that are required;
- each file's owner and purpose;
- which file calls which file;
- which cross-module calls are public;
- which database tables are owned by each module;
- what must never be called or modified;
- what must be tested before the module is locked.

## 2. REPOSITORY MASTER MAP

```text
GNT/
├── GNT_MASTER_BLUEPRINT/
│   ├── 01_MASTER_RULES/
│   ├── 02_DATABASE_SCHEMA/
│   ├── 03_MODULE_INTEGRATION/
│   ├── 04_TRANSACTION_ENGINE/
│   ├── 05_API_CONTRACT/
│   ├── 06_SECURITY_IMPLEMENTATION/
│   ├── 07_OFFLINE_SYNC/
│   ├── 08_AUTOMATION/
│   ├── 09_UI_UX/
│   ├── 10_TESTING_PRODUCTION/
│   ├── 11_IMPLEMENTATION_STATUS/
│   └── 99_ADVANCED_MASTER/
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── core/
│       ├── components/
│       ├── state/
│       ├── hooks/
│       ├── utils/
│       ├── styles/
│       └── modules/
│           └── mXX-module-name/
│
├── backend/
│   └── src/
│       ├── common/
│       ├── modules/
│       │   └── mXX-module-name/
│       └── app/
│
├── api-contracts/
│   ├── v1/
│   └── common/
│
├── wiring-maps/
│   ├── module-wiring/
│   ├── cross-module-flows/
│   └── event-registry/
│
├── integration-registry/
│   ├── external/
│   └── internal/
│
├── database/
│   ├── schema/
│   ├── migrations/
│   ├── seeders/
│   └── views/
│
└── tests/
    ├── unit/
    ├── module/
    ├── integration/
    ├── transaction/
    ├── security/
    ├── offline-sync/
    ├── device/
    ├── performance/
    └── production/
```

## 3. UNIVERSAL MODULE INTERNAL STRUCTURE

```text
frontend/src/modules/mXX-module-name/
├── pages/
├── components/
├── services/
├── state/
├── validators/
├── routes/
└── index.ts

backend/src/modules/mXX-module-name/
├── controllers/
├── services/
├── repositories/
├── models/
├── validators/
├── routes/
├── events/
├── types/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── api/
└── index.ts
```

## 4. GOLDEN FILE CALL CHAIN

```text
USER
 ↓
Frontend Page
 ↓
Frontend Validator
 ↓
Frontend Service
 ↓
frontend/core/api-client.ts
 ↓
API Route
 ↓
common/auth-middleware.ts
 ↓
common/tenant-middleware.ts
 ↓
common/request-tracer.ts
 ↓
common/validation-middleware.ts
 ↓
Controller
 ↓
PUBLIC Service
 ↓
[PUBLIC cross-module service interfaces only]
 ↓
OWNER Repository
 ↓
Database
 ↓
Event Bus
 ↓
Event Handlers
 ↓
Audit Logger
 ↓
API Response
 ↓
Frontend Store / UI
```

### Hard boundary

```text
LEGAL:
M08 sales.service.ts -> M06 stock.service.ts PUBLIC method

ILLEGAL:
M08 -> M06 stock.repository.ts
M08 -> M06 stock.internal.ts
M08 -> M06 database table directly
```

## 5. FILE-TO-FILE WIRING RULE

Every module blueprint contains a file-call matrix. The notation is:

```text
CALLER FILE
  -> CALLEE FILE
  -> METHOD / PURPOSE
  -> CONTRACT OR EVENT USED
```

A cross-module call is valid only if the callee is explicitly marked **PUBLIC**.

## 6. DATABASE OWNERSHIP RULE

A module owns its tables and its repositories. Other modules may obtain data
through the owner's public service/API/event contract. Direct cross-module
database writes are forbidden.

## 7. LOCK PACKAGE

Before a team/module is LOCKED, these 15 artifacts are mandatory:

1. Module Contract
2. Repository Map
3. File Registry
4. Database Map
5. Database Registry
6. Dependency Map
7. Wiring Map
8. Wiring Registry
9. API Contract
10. Integration Contract
11. Security Contract
12. Test Report
13. Change Log
14. Version
15. Lock Status

Without all 15, the module is NOT LOCKED.

## 8. SOURCE-OF-TRUTH NOTE

The original Advanced Blueprint is M01–M19 and contains declared file counts and
module manifests. Where its declared count is larger than the explicitly listed
file names, this team blueprint treats the count as a **required target**, not
permission to invent silently. Any newly specified implementation file is
labelled **DESIGN-EXPANSION** and must be registered before coding.


## 9. GLOBAL FEATURE OWNERSHIP USED BY ALL FOUR TEAMS

```text
Purchase Bill OCR
  -> M07 owner; OCR proposes data; validation/approval before posting.

Auto Stock Alert / PO Draft
  -> M06 emits stock-low event
  -> M13 evaluates rule
  -> M07 creates purchase-order draft.

Barcode / QR
  -> M06 owner.

GST / HSN Security Lock
  -> M09 blocks invalid tax/HSN/GST progression.

Dual Backup
  -> M15 owner.

Offline + Auto Sync
  -> M15 owner; public sync contract only.

Generic Import/Export
  -> M14 owner.

International Trade + 8-digit HSN
  -> M20 owner.

Executive BI
  -> M17 owner.

Workflow Approval
  -> M13 orchestration + business-module approval contract.

Real-Time Collaboration
  -> M15 synchronization + controlled integration layer.

Advanced Search
  -> common search foundation + module public search interfaces.
```

## 10. FOUR TEAM BOUNDARIES

```text
A4-APPLE   M01-M05
      ↓
B4-BRAVO   M06-M10
      ↓
C4-CHARLIE M11-M15
      ↓
D4-DELTA   M16-M20
```

The boundary does NOT mean one team may inspect or directly call another team's
private implementation. Integration is through registered public contracts only.

## 11. ASSIGNED MODULES — M01-M05

## 7.1 M01 - FOUNDATION

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M01: FOUNDATION                                                                 │
│ Purpose: System base, app shell, global configuration                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (12 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- AppShellPage.tsx              [Root layout wrapper]                    │
│  │   +-- NotFoundPage.tsx              [404 error page]                         │
│  │   +-- ErrorPage.tsx                 [Global error fallback]                  │
│  +-- services/                                                                  │
│  │   +-- app.service.ts               [App config API]                         │
│  │   +-- app.types.ts                 [App DTOs]                               │
│  +-- state/                                                                     │
│  │   +-- app.store.ts                 [Global app state]                       │
│  +-- routes/                                                                    │
│      +-- app.routes.ts                [Root route definitions]                 │
│                                                                                  │
│  BACKEND (10 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- app.controller.ts            [Health check, config]                   │
│  +-- services/                                                                  │
│  │   +-- app.service.ts               [App config logic]                       │
│  │   +-- app.internal.ts              [Internal helpers]                       │
│  +-- repositories/                                                              │
│  │   +-- app.repository.ts            [Config DB access]                       │
│  +-- routes/                                                                    │
│  │   +-- app.routes.ts                [Health routes]                          │
│  +-- tests/                                                                     │
│      +-- app.controller.test.ts       [Health check tests]                     │
│                                                                                  │
│  API CONTRACT (4 files):                                                        │
│  +-- M01-foundation.contract.yaml     [OpenAPI spec]                           │
│  +-- M01-wiring-map.json              [No external connections]                │
│  +-- health.contract.yaml             [Health check endpoints]                 │
│                                                                                  │
│  DATABASE: No owned tables (uses common config)                                 │
│                                                                                  │
│  PROVIDES: App config, Health check, Error handling patterns                    │
│  USES: None (base module)                                                       │
│  FORBIDDEN: Business logic, Financial operations                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.2 M02 - CORE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M02: CORE ARCHITECTURE                                                          │
│ Purpose: User, Role, Permission, Authentication, Authorization                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (14 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- LoginPage.tsx                [Company + User login]                   │
│  │   +-- OTPVerifyPage.tsx            [OTP/2FA verification]                   │
│  │   +-- RoleSelectPage.tsx           [Workspace/Role selection]               │
│  │   +-- SessionLockPage.tsx          [Auto-lock + PIN unlock]                 │
│  +-- services/                                                                  │
│  │   +-- auth.service.ts              [Login/OTP/Session APIs]                 │
│  │   +-- auth.types.ts                [Auth DTOs]                              │
│  +-- state/                                                                     │
│  │   +-- auth.store.ts                [Auth state + user context]              │
│  +-- validators/                                                                │
│      +-- auth.schema.ts               [Login/OTP validation]                   │
│                                                                                  │
│  BACKEND (18 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- auth.controller.ts           [Login, OTP, Logout handlers]            │
│  │   +-- user.controller.ts           [User CRUD handlers]                     │
│  │   +-- role.controller.ts           [Role/Permission handlers]               │
│  +-- services/                                                                  │
│  │   +-- auth.service.ts              [JWT, Session, OTP logic]                │
│  │   +-- user.service.ts              [User management logic]                  │
│  │   +-- role.service.ts              [Role/Permission logic]                  │
│  │   +-- auth.internal.ts             [Token generation, Hashing]              │
│  +-- repositories/                                                              │
│  │   +-- user.repository.ts           [user_master access]                     │
│  │   +-- role.repository.ts           [role_master, permission_master access]  │
│  +-- models/                                                                    │
│  │   +-- user.model.ts                [Prisma user extensions]                 │
│  +-- routes/                                                                    │
│  │   +-- auth.routes.ts               [Auth endpoints]                         │
│  +-- tests/                                                                     │
│      +-- auth.service.test.ts         [Unit tests]                             │
│      +-- auth.integration.test.ts     [Integration tests]                      │
│                                                                                  │
│  API CONTRACT (6 files):                                                        │
│  +-- M02-core.contract.yaml           [Auth/User/Role APIs]                    │
│  +-- auth.contract.yaml               [Login/OTP/Session]                      │
│  +-- M02-wiring-map.json              [Connections to all modules]             │
│  +-- event: user.login.failed         [Security event]                         │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- user_master                    [User accounts]                             │
│  +-- role_master                    [Role definitions]                          │
│  +-- permission_master              [Permission definitions]                    │
│  +-- user_role                      [User-Role mapping]                         │
│                                                                                  │
│  PROVIDES: Authentication, Authorization, User context, Role/Permission data    │
│  USES: M04 (Company context)                                                    │
│  FORBIDDEN: Business logic, Financial data access                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.3 M03 - DEVICE & PLATFORM

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M03: DEVICE & PLATFORM                                                          │
│ Purpose: Device registration, sessions, app updates, deployment                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (10 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- DeviceSessionsPage.tsx       [Active sessions list]                   │
│  │   +-- AppUpdatePage.tsx            [Version + update center]                │
│  │   +-- DeploymentSettingsPage.tsx   [Local server config]                    │
│  +-- services/                                                                  │
│  │   +-- device.service.ts            [Device API calls]                       │
│  │   +-- device.types.ts              [Device DTOs]                            │
│  +-- state/                                                                     │
│      +-- device.store.ts              [Device state]                           │
│                                                                                  │
│  BACKEND (8 files):                                                             │
│  +-- controllers/                                                               │
│  │   +-- device.controller.ts         [Device CRUD handlers]                   │
│  +-- services/                                                                  │
│  │   +-- device.service.ts            [Device logic]                           │
│  │   +-- device.internal.ts           [Session cleanup]                        │
│  +-- repositories/                                                              │
│  │   +-- device.repository.ts         [device_registry access]                 │
│  +-- routes/                                                                    │
│      +-- device.routes.ts             [Device endpoints]                       │
│                                                                                  │
│  API CONTRACT (4 files):                                                        │
│  +-- M03-device.contract.yaml         [Device/Session APIs]                    │
│  +-- M03-wiring-map.json              [M02 (Auth), M19 (Monitoring)]           │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- device_registry                [Registered devices]                        │
│  +-- active_session                 [Session tracking]                          │
│                                                                                  │
│  PROVIDES: Device info, Session tracking, Force logout                         │
│  USES: M02 (Auth), M04 (Company)                                              │
│  FORBIDDEN: Business logic, Direct financial operations                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.4 M04 - COMPANY MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M04: COMPANY MANAGEMENT                                                         │
│ Purpose: Company profile, branches, financial year, system settings             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (18 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- CompanyProfilePage.tsx       [Company details + branding]             │
│  │   +-- BranchManagementPage.tsx     [Branch/Godown list]                     │
│  │   +-- FinancialYearPage.tsx        [FY list + switch engine]                │
│  │   +-- RolePermissionPage.tsx       [CRUD permission grid]                   │
│  │   +-- UserManagementPage.tsx       [User CRUD + sessions]                   │
│  │   +-- ThemeSettingsPage.tsx        [Color picker + presets]                 │
│  +-- services/                                                                  │
│  │   +-- company.service.ts           [Company API calls]                      │
│  │   +-- company.types.ts             [Company DTOs]                           │
│  +-- state/                                                                     │
│  │   +-- company.store.ts             [Active company state]                   │
│  +-- validators/                                                                │
│      +-- company.schema.ts            [Company validation]                     │
│                                                                                  │
│  BACKEND (16 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- company.controller.ts        [Company CRUD]                           │
│  │   +-- branch.controller.ts         [Branch CRUD]                            │
│  +-- services/                                                                  │
│  │   +-- company.service.ts           [Company logic]                          │
│  │   +-- branch.service.ts            [Branch logic]                           │
│  │   +-- company.internal.ts          [FY engine]                              │
│  +-- repositories/                                                              │
│  │   +-- company.repository.ts        [company_master access]                  │
│  │   +-- branch.repository.ts         [branch_master access]                   │
│  +-- models/                                                                    │
│  │   +-- company.model.ts             [Prisma extensions]                      │
│  +-- routes/                                                                    │
│      +-- company.routes.ts            [Company endpoints]                      │
│                                                                                  │
│  API CONTRACT (5 files):                                                        │
│  +-- M04-company.contract.yaml        [Company/Branch/FY APIs]                 │
│  +-- M04-wiring-map.json              [All modules depend on M04]              │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- company_master                 [Company definition - CANONICAL]           │
│  +-- branch_master                  [Branch/Godown definition]                 │
│  +-- financial_year                 [FY periods]                               │
│                                                                                  │
│  PROVIDES: Company context, Branch list, FY settings, Invoice prefixes         │
│  USES: M02 (User/Role for permissions)                                        │
│  FORBIDDEN: Party data, Product data, Transaction data                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.5 M05 - PARTY MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M05: PARTY MANAGEMENT                                                           │
│ Purpose: Customer & Supplier master, outstanding, aging, ledger view            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (16 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- PartyListPage.tsx            [Customer/Supplier table]                │
│  │   +-- PartyEntryDrawer.tsx         [Add/Edit party drawer]                  │
│  │   +-- PartyDetailHubPage.tsx       [Ledger + history + aging]               │
│  +-- services/                                                                  │
│  │   +-- party.service.ts             [Party API calls]                        │
│  │   +-- party.types.ts               [Party DTOs]                             │
│  +-- state/                                                                     │
│  │   +-- party.store.ts               [Party state]                            │
│  +-- validators/                                                                │
│      +-- party.schema.ts              [Party validation]                       │
│                                                                                  │
│  BACKEND (14 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- party.controller.ts          [Party CRUD handlers]                    │
│  +-- services/                                                                  │
│  │   +-- party.service.ts             [Party logic]                            │
│  │   +-- party.internal.ts            [Aging calculation]                      │
│  +-- repositories/                                                              │
│  │   +-- party.repository.ts          [party_master access]                    │
│  +-- routes/                                                                    │
│      +-- party.routes.ts              [Party endpoints]                        │
│                                                                                  │
│  API CONTRACT (5 files):                                                        │
│  +-- M05-party.contract.yaml          [Party CRUD + Outstanding APIs]          │
│  +-- M05-wiring-map.json              [M08, M07, M10, M11]                   │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- party_master                   [Customer/Supplier - CANONICAL]            │
│  +-- party_ledger_view              [Running balance view]                     │
│                                                                                  │
│  PROVIDES: Party data, Outstanding, Credit limit, Aging analysis               │
│  USES: M04 (Company context), M10 (Ledger for balance)                        │
│  FORBIDDEN: Product master, Stock data, Direct invoice creation                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 12. DECLARED FILE TARGETS AND REGISTRY GATE

### M01 declared target
- Frontend: 12
- Backend: 10
- API/Wiring: 4
- Tests: 8
- Any files not explicitly named in the source must be registered as DESIGN-EXPANSION before implementation.
### M02 declared target
- Frontend: 14
- Backend: 18
- API/Wiring: 6
- Tests: 12
- Any files not explicitly named in the source must be registered as DESIGN-EXPANSION before implementation.
### M03 declared target
- Frontend: 10
- Backend: 8
- API/Wiring: 4
- Tests: 6
- Any files not explicitly named in the source must be registered as DESIGN-EXPANSION before implementation.
### M04 declared target
- Frontend: 18
- Backend: 16
- API/Wiring: 5
- Tests: 10
- Any files not explicitly named in the source must be registered as DESIGN-EXPANSION before implementation.
### M05 declared target
- Frontend: 16
- Backend: 14
- API/Wiring: 5
- Tests: 10
- Any files not explicitly named in the source must be registered as DESIGN-EXPANSION before implementation.


## 13. TEAM-WIDE CALL / WIRING MAP

```text
Frontend Page
  -> module frontend service
  -> common api-client
  -> module route
  -> common security middleware
  -> module controller
  -> module PUBLIC service
  -> owner repository
  -> owner database
  -> event bus
  -> registered event handlers
  -> audit logger
  -> response
  -> frontend store
```

### Cross-module rule

```text
PUBLIC SERVICE / PUBLIC API / EVENT = allowed
PRIVATE SERVICE / INTERNAL SERVICE / REPOSITORY / DIRECT DB = forbidden
```

## 14. TEAM COMPLETION CHECKLIST

```text
[ ] Every assigned module has a repository tree.
[ ] Every assigned module has a file registry.
[ ] Every declared file count is reconciled.
[ ] Any DESIGN-EXPANSION file is explicitly registered.
[ ] Every frontend file has a purpose.
[ ] Every backend file has a purpose.
[ ] Every API/wiring file has an owner.
[ ] Every database table has one owner.
[ ] Every cross-module call names caller + callee + public method.
[ ] No private cross-module call exists.
[ ] Tests cover unit/module/integration/security as applicable.
[ ] Wiring map is machine-readable.
[ ] Test map is machine-readable.
[ ] Lock package contains all 15 mandatory artifacts.
[ ] Team package is ready for independent verification.
```

## 15. FINAL TEAM RULE

This document is an implementation map, not permission to alter the GNT
repository. Build the assigned package in isolation, produce the ZIP/package,
and submit it for verification. Repository placement and final integration
occur only after approval.

## A GROUP SCOPE

**Modules:** M01 Foundation; M02 Core Architecture; M03 Device & Platform; M04 Company Management; M05 Party Management

**Internal road:** `M01 → M02 → M03/M04 → M05`

**External boundary:** M05 → B public Party contract.


# FINAL CONSTRUCTION CONTROL LAYER — READ THIS BEFORE CODING

> **Purpose:** This layer turns the architecture into a road-map: first build this, then this; this file calls that file; this module may call that public interface; these things are forbidden. No team should have to guess.

## TABLE 1 — STRUCTURE / PLACEMENT

| Level | What is created | Exact home | Owner | Rule |
|---|---|---|---|---|
| 1 | Master/shared foundation | `frontend/src/core`, `backend/src/common`, `api-contracts/common` | Master/shared | Shared only; no business ownership |
| 2 | Module root | `frontend/src/modules/<Mxx-module-name>` and `backend/src/modules/<Mxx-module-name>` | Assigned Mxx | One owner per module |
| 3 | UI pages/components/state/services/validators/routes/types | Inside the module root | Assigned Mxx | UI uses only its own module services + approved shared components |
| 4 | Controller/service/domain/repository/model/validator/routes/events | Inside backend module root | Assigned Mxx | Internal calls stay inside module unless public contract says otherwise |
| 5 | API contracts | `api-contracts/v1/<module>` | API contract owner | Contract before consumer coding |
| 6 | Database schema/migrations/seeders/views | `database/...` with Mxx ownership registry | Mxx owner | Other modules cannot write directly |
| 7 | Wiring maps | `wiring-maps/module-wiring`, `cross-module-flows`, `event-registry` | Architecture | Wiring documents real calls; it does not replace implementation |
| 8 | Tests | `tests/...` and module `backend/.../tests` | Mxx | Tests mirror ownership and contracts |

### FILE REGISTRY RULE
Every file gets one row in the registry before implementation:

`File ID | Exact filename | Exact path | Type | Owner module | Purpose | Calls | Called by | DB objects | Events in/out | Public/Private | Build order | Status`

**No file count is guessed.** The authoritative count is the sum of registered files. If the Master Blueprint declares a target count greater than the explicit manifest, the missing names are a DESIGN-EXPANSION and must be approved/registered before coding.

## TABLE 2 — CALL / ROAD MAP

| From | To | How | Allowed? |
|---|---|---|---|
| Page | Own frontend service | direct function call | YES |
| Frontend service | API contract/HTTP client | typed request | YES |
| API route | Controller | route dispatch | YES |
| Controller | Own application/domain service | direct internal call | YES |
| Service | Own repository | repository interface | YES |
| Repository | Own DB objects | ORM/query layer | YES |
| Module | Another module PUBLIC service/API/event | public contract only | YES |
| Module | Another module private repository/internal file | direct | NO |
| Module | Another module DB table | direct | NO |
| UI | Another module DB/service internals | direct | NO |

### ROAD-MAP DIAGRAM
```text
[User]
  ↓
[Page]
  ↓
[Own Frontend Service]
  ↓
[API Client / Contract]
  ↓
[Route]
  ↓
[Controller]
  ↓
[Own Application/Domain Service]
  ↓
[Own Validator/Policy]
  ↓
[Own Repository]
  ↓
[OWN DB]
  ↓
[Event / Outbox]
  ↓
[PUBLIC Contract]
  ↓
[Approved Consumer Module]
```

## TABLE 3 — BUILD ORDER / CONSTRUCTION SEQUENCE

| Order | Build | Why now | Gate before next order |
|---:|---|---|---|
| 01 | Folder tree + module boundaries | Prevents misplaced files | tree reviewed |
| 02 | File registry + ownership | Prevents duplicate/missing files | every file has owner/path |
| 03 | Shared design system + shared contracts | Prevents UI/design collision | style/contract locked |
| 04 | Database schema + ownership | Backend depends on data contract | schema reviewed |
| 05 | API contracts + types | Frontend/backend need stable interface | contracts frozen |
| 06 | Backend domain/services/repositories | Implements business rules | unit tests pass |
| 07 | Controllers/routes/middleware wiring | Exposes backend safely | API tests pass |
| 08 | Frontend services/state | Connects UI to stable APIs | contract tests pass |
| 09 | Pages/components | UI consumes stable services | UI tests pass |
| 10 | Events + cross-module adapters | Integration only after owners exist | wiring map matches code |
| 11 | Integration/E2E/error/recovery tests | Finds real path failures | tests pass |
| 12 | Registry + maps + lock package | Prevents future drift | all 15 lock artifacts present |

**Deletion protection:** A file cannot be deleted/renamed merely because another file seems similar. First update the File Registry, dependency map, call map, tests, and change log; then approve the change.

## TABLE 4 — FORBIDDEN / DO NOT DO

| Do NOT do this | Why | Required alternative |
|---|---|---|
| Create a duplicate file because the name “looks missing” | Creates 2 sources of truth | Check File Registry first |
| Rename/delete a registered file silently | Breaks mapped calls | Change request + registry + tests |
| Call another module’s private repository | Breaks ownership | Public service/API/event |
| Write another module’s DB table directly | Bypasses business rules | Owner module contract |
| Create a second color palette | Causes UI collision | Shared UI Style Guide |
| Create business logic inside shared UI components | Blurs ownership | Keep business logic in owning module |
| Make circular module dependencies | Makes build/wiring unstable | One-way public contracts/events |
| Skip validation because “another module will do it” | Creates unsafe gaps | Each owner validates its boundary |
| Use undocumented APIs/events | Hidden coupling | Register contract first |
| Mark unfinished work complete | Causes downstream deletion/rework | Keep status BLOCKED/PENDING |

# SHARED UI DESIGN SYSTEM — SAME FOR A, B, C, D

All four teams use the **same** design tokens. Teams do not invent module-specific primary colors. Business modules may have different content, but the visual language is shared.

| Token | Shared rule |
|---|---|
| Primary brand | `#2563EB` |
| Secondary | `#64748B` |
| Success | `#16A34A` |
| Warning | `#F59E0B` |
| Error/Danger | `#DC2626` |
| Info | `#0EA5E9` |
| Page background | `#F8FAFC` |
| Surface/card | `#FFFFFF` |
| Main text | `#0F172A` |
| Muted text | `#64748B` |
| Border | `#E2E8F0` |
| Font | Inter / system fallback |
| Radius | 8px standard; 12px for major cards |
| Spacing | 4px base scale; use multiples consistently |
| Buttons/forms/tables | Shared components only |

**Important:** These colors are design tokens, not module ownership. Sales, Purchase, Inventory, etc. all use the same components/tokens. Do not create “Sales green” or “Purchase yellow”.

## FINAL AI HANDOFF CARD

The receiving AI must follow this order: **READ → MAP → REGISTER → BUILD → CONNECT → TEST → LOCK.**

If a requested file, call, dependency, table, API, event, or design decision is not present in the registry or Master Blueprint, **STOP and mark it as BLOCKING/NEEDS APPROVAL instead of guessing.**
