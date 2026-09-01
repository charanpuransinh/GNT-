# GNT D — FULL ARCHITECTURE BLUEPRINT (M16-M20)

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

## 11. ASSIGNED MODULES — M16-M20

## 7.16 M16 - NOTIFICATION ENGINE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M16: NOTIFICATION ENGINE                                                        │
│ Purpose: In-App, WhatsApp, SMS, Email notifications + delivery tracking         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (8 files):                                                            │
│  +-- pages/                                                                     │
│  │   +-- NotificationCenterPage.tsx  [Top-bar dropdown panel]                  │
│  +-- components/                                                                │
│  │   +-- NotificationBell.tsx        [Bell icon + badge]                       │
│  │   +-- NotificationList.tsx        [Actionable notification list]            │
│  +-- services/                                                                  │
│  │   +-- notification.service.ts     [Notification API calls]                  │
│  │   +-- notification.types.ts       [Notification DTOs]                     │
│  +-- state/                                                                     │
│      +-- notification.store.ts       [Notification state]                      │
│                                                                                  │
│  BACKEND (12 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- notification.controller.ts  [Notification CRUD]                       │
│  +-- services/                                                                  │
│  │   +-- notification.service.ts     [Notification logic - PUBLIC]             │
│  │   +-- notification.internal.ts    [Channel routing]                         │
│  │   +-- whatsapp.service.ts         [WhatsApp Business API]                   │
│  │   +-- sms.service.ts              [SMS Gateway]                             │
│  +-- repositories/                                                              │
│  │   +-- notification.repository.ts  [notification_master access]              │
│  +-- routes/                                                                    │
│      +-- notification.routes.ts     [Notification endpoints]                   │
│                                                                                  │
│  API CONTRACT (3 files):                                                        │
│  +-- M16-notification.contract.yaml [Notification APIs]                       │
│  +-- M16-wiring-map.json            [M05, M08, M09, M11, M13]               │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- notification_master            [Notification records - CANONICAL]         │
│  +-- notification_delivery_log      [Sent/Delivered/Failed log]                │
│                                                                                  │
│  PROVIDES: Notification sending, Delivery tracking, Channel routing            │
│  USES: M05 (Party contact), M18 (External gateways)                           │
│  FORBIDDEN: Direct business logic, Financial data in notifications              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.17 M17 - REPORTING

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M17: REPORTING                                                                  │
│ Purpose: Sales, Purchase, Inventory, GST, Accounting, HR reports                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (14 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- SalesReportsPage.tsx        [Sales register + margin]                 │
│  │   +-- PurchaseReportsPage.tsx     [Purchase register + PO status]           │
│  │   +-- InventoryReportsPage.tsx    [Stock summary + valuation]               │
│  │   +-- GSTReportsPage.tsx          [Tax liability + HSN summary]             │
│  │   +-- AccountingReportsPage.tsx   [Daybook + cashflow + aging]              │
│  │   +-- HRReportsPage.tsx           [Attendance + salary register]            │
│  +-- services/                                                                  │
│  │   +-- report.service.ts           [Report API calls]                       │
│  │   +-- report.types.ts             [Report DTOs]                            │
│  +-- state/                                                                     │
│      +-- report.store.ts             [Report state]                            │
│                                                                                  │
│  BACKEND (16 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- report.controller.ts        [Report CRUD]                            │
│  +-- services/                                                                  │
│  │   +-- report.service.ts           [Report logic - PUBLIC]                   │
│  │   +-- report.internal.ts         [Query builder]                            │
│  │   +-- report.generator.ts         [PDF/Excel generation]                    │
│  +-- repositories/                                                              │
│  │   +-- report.repository.ts        [report_config access]                    │
│  +-- routes/                                                                    │
│      +-- report.routes.ts            [Report endpoints]                        │
│                                                                                  │
│  API CONTRACT (4 files):                                                        │
│  +-- M17-reporting.contract.yaml    [Report APIs]                             │
│  +-- M17-wiring-map.json            [M06, M07, M08, M09, M10, M12]          │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- report_config                  [Saved report configurations]              │
│  +-- report_template                [Report layouts]                            │
│                                                                                  │
│  PROVIDES: Report generation, Data aggregation, Export (PDF/Excel)             │
│  USES: M06-M12 (All transactional modules)                                    │
│  FORBIDDEN: Direct DB write, Data modification, Transaction creation            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.18 M18 - EXTERNAL INTEGRATION

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M18: EXTERNAL INTEGRATION                                                       │
│ Purpose: WhatsApp/SMS Gateways, Payment Gateways, GSTN, Webhook monitors        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (10 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- GatewayConfigPage.tsx       [SMS/WhatsApp/Payment config]             │
│  │   +-- IntegrationStatusPage.tsx   [Live connection status]                  │
│  │   +-- APIKeyManagerPage.tsx       [API key creation + management]           │
│  +-- services/                                                                  │
│  │   +-- integration.service.ts     [Integration API calls]                   │
│  │   +-- integration.types.ts       [Integration DTOs]                        │
│  +-- state/                                                                     │
│      +-- integration.store.ts       [Integration state]                        │
│                                                                                  │
│  BACKEND (12 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- integration.controller.ts   [Integration CRUD]                        │
│  │   +-- webhook.controller.ts       [Webhook receivers]                       │
│  +-- services/                                                                  │
│  │   +-- integration.service.ts      [Integration logic - PUBLIC]              │
│  │   +-- gateway.service.ts          [Gateway connector]                       │
│  │   +-- webhook.service.ts          [Webhook processor]                       │
│  +-- repositories/                                                              │
│  │   +-- integration.repository.ts   [integration_config access]               │
│  +-- routes/                                                                    │
│      +-- integration.routes.ts      [Integration endpoints]                    │
│                                                                                  │
│  API CONTRACT (4 files):                                                        │
│  +-- M18-integration.contract.yaml  [Gateway/Webhook/API Key APIs]            │
│  +-- M18-wiring-map.json            [M09, M11, M16, External APIs]          │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- integration_config             [Gateway configurations]                    │
│  +-- api_key_registry               [Generated API keys]                        │
│  +-- webhook_log                    [Webhook delivery log]                      │
│                                                                                  │
│  PROVIDES: External API connectivity, Gateway management, Webhook handling     │
│  USES: M09 (GSTN), M11 (Payment), M16 (WhatsApp/SMS)                          │
│  FORBIDDEN: Direct business logic, Financial posting, Data modification         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.19 M19 - PRODUCTION & MONITORING

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M19: PRODUCTION & MONITORING                                                    │
│ Purpose: Activity logs, Login history, Permission tracker, System health        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (10 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- ActivityLogPage.tsx         [Timestamped audit trail]                 │
│  │   +-- LoginHistoryPage.tsx        [IP + device fingerprint log]             │
│  │   +-- PermissionTrackerPage.tsx   [Permission change audit]                 │
│  +-- services/                                                                  │
│  │   +-- security.service.ts        [Security API calls]                      │
│  │   +-- security.types.ts          [Security DTOs]                           │
│  +-- state/                                                                     │
│      +-- security.store.ts          [Security state]                           │
│                                                                                  │
│  BACKEND (12 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- audit.controller.ts         [Audit log queries]                       │
│  │   +-- security.controller.ts      [Security event handlers]                 │
│  +-- services/                                                                  │
│  │   +-- audit.service.ts            [Audit logic - PUBLIC]                    │
│  │   +-- security.internal.ts        [Anomaly detection]                       │
│  +-- repositories/                                                              │
│  │   +-- audit.repository.ts         [audit_log access - APPEND ONLY]          │
│  +-- routes/                                                                    │
│      +-- security.routes.ts         [Security endpoints]                       │
│                                                                                  │
│  API CONTRACT (4 files):                                                        │
│  +-- M19-production.contract.yaml   [Audit/Security/Health APIs]              │
│  +-- M19-wiring-map.json            [ALL MODULES (reads audit)]             │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- audit_log                      [CRUD actions - APPEND ONLY]               │
│  +-- login_history                  [Login attempts]                            │
│  +-- security_event                 [Security alerts]                           │
│                                                                                  │
│  PROVIDES: Audit trail, Security monitoring, Anomaly detection                  │
│  USES: ALL MODULES (receives audit events)                                    │
│  FORBIDDEN: Audit log modification, Log deletion, Data tampering                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---


## M20 — INTERNATIONAL TRADE & 8-DIGIT HSN ENGINE (DESIGN-EXPANSION)

### Repository tree

```text
frontend/src/modules/m20-international-trade/
├── pages/
│   ├── InternationalTradeDashboardPage.tsx
│   ├── ExportShipmentPage.tsx
│   ├── ImportShipmentPage.tsx
│   ├── HSNCodeSearchPage.tsx
│   ├── HSNClassificationPage.tsx
│   ├── ForeignExchangePage.tsx
│   ├── CustomsDutyPage.tsx
│   ├── TradeDocumentsPage.tsx
│   ├── ExportDocumentPreviewPage.tsx
│   └── BillOfEntryPage.tsx
├── components/
│   ├── HSNSelector.tsx
│   ├── FXRateCard.tsx
│   └── CustomsDutySummary.tsx
├── services/
│   ├── internationalTrade.service.ts
│   └── internationalTrade.types.ts
├── state/
│   └── internationalTrade.store.ts
├── validators/
│   └── internationalTrade.schema.ts
├── routes/
│   └── internationalTrade.routes.ts
└── index.ts

backend/src/modules/m20-international-trade/
├── controllers/
│   ├── trade.controller.ts
│   ├── hsn.controller.ts
│   └── customs.controller.ts
├── services/
│   ├── trade.service.ts
│   ├── hsn.service.ts
│   ├── fx.service.ts
│   ├── customs.service.ts
│   ├── trade-document.service.ts
│   └── trade.internal.ts
├── repositories/
│   ├── trade.repository.ts
│   ├── hsn.repository.ts
│   ├── fx.repository.ts
│   └── customs.repository.ts
├── models/
│   ├── trade.model.ts
│   └── hsn.model.ts
├── validators/
│   └── trade.schema.ts
├── routes/
│   └── trade.routes.ts
├── events/
│   ├── trade.events.ts
│   └── trade.handlers.ts
├── types/
│   └── trade.types.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── api/
└── index.ts

api-contracts/v1/
├── M20-international-trade-hsn.contract.yaml
├── M20-hsn.contract.yaml
├── M20-customs.contract.yaml
├── M20-fx.contract.yaml
├── M20-document.contract.yaml
└── M20-wiring-map.json

database/
├── schema/m20/
│   ├── hsn_master.sql
│   ├── trade_job.sql
│   ├── fx_rate.sql
│   ├── customs_rule.sql
│   └── trade_document.sql
└── migrations/m20/

wiring-maps/module-wiring/M20-wiring-map.json
wiring-maps/cross-module-flows/international-trade-flow.wiring.json
```

### M20 owned data

```text
hsn_master
trade_job
fx_rate
customs_rule
trade_document
```

### M20 call chain

```text
ExportShipmentPage
 -> internationalTrade.service.ts
 -> api-client.ts
 -> trade.routes.ts
 -> auth/tenant/trace/validation middleware
 -> trade.controller.ts
 -> trade.service.ts
 -> M05 party.service.ts PUBLIC
 -> M06 product.service.ts PUBLIC
 -> M09 gst.service.ts PUBLIC
 -> M10 ledger.service.ts PUBLIC
 -> trade.repository.ts OWNER ONLY
 -> database
 -> trade.events.ts
 -> M18 integration.service.ts PUBLIC
 -> M19 audit-logger
```

### M20 prohibition

No duplicate Party Master, Product Master, Invoice Master, Payment Master or
Ledger Master may be created inside M20.


## 12. DECLARED FILE TARGETS AND REGISTRY GATE

### M16 declared target
- Frontend: 8
- Backend: 12
- API/Wiring: 3
- Tests: 6
- Any files not explicitly named in the source must be registered as DESIGN-EXPANSION before implementation.
### M17 declared target
- Frontend: 14
- Backend: 16
- API/Wiring: 4
- Tests: 8
- Any files not explicitly named in the source must be registered as DESIGN-EXPANSION before implementation.
### M18 declared target
- Frontend: 10
- Backend: 12
- API/Wiring: 4
- Tests: 6
- Any files not explicitly named in the source must be registered as DESIGN-EXPANSION before implementation.
### M19 declared target
- Frontend: 10
- Backend: 12
- API/Wiring: 4
- Tests: 6
- Any files not explicitly named in the source must be registered as DESIGN-EXPANSION before implementation.
### M20 declared target
- Frontend: 14
- Backend: 16
- API/Wiring: 6
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

## D GROUP SCOPE

**Modules:** M16 Notification; M17 Reporting; M18 External Integration; M19 Production & Monitoring; M20 International Trade & 8-digit HSN

**Internal road:** `events/data → M16/M17/M19; M20 ↔ approved modules/M18`

**External boundary:** D → A/B/C public contracts only.


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
