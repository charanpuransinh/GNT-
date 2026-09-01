# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                                                                              ║
# ║     GARUDA NEXTECH (GNT) — ADVANCED SOFTWARE BLUEPRINT                       ║
# ║     MASTER ARCHITECTURE, FILE MANIFEST & CALL-CHAIN MAP                      ║
# ║                                                                              ║
# ║     Group: मा आदिशक्ति  |  Brand: RAKSHA  |  Version: 2.0.0                ║
# ║     Status: PERMANENT ARCHITECTURE CONTRACT                                  ║
# ║                                                                              ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

---

# 📚 TABLE OF CONTENTS

1.  [COMPLETE FILE INVENTORY](#1-complete-file-inventory)
2.  [BLUEPRINT FILE MANIFEST](#2-blueprint-file-manifest)
3.  [FRONTEND FILE MANIFEST](#3-frontend-file-manifest)
4.  [BACKEND FILE MANIFEST](#4-backend-file-manifest)
5.  [API / WIRING FILE MANIFEST](#5-api--wiring-file-manifest)
6.  [MASTER CALL CHAIN MAP](#6-master-call-chain-map)
7.  [MODULE-WISE FILE BREAKDOWN (M01-M20)](#7-module-wise-file-breakdown-m01-m19)
8.  [DATABASE SCHEMA MAP](#8-database-schema-map)
9.  [SECURITY LAYER MAP](#9-security-layer-map)
10. [CROSS-MODULE INTEGRATION FLOWS](#10-cross-module-integration-flows)
11. [OFFLINE/SYNC ARCHITECTURE MAP](#11-offlinesync-architecture-map)
12. [TESTING & PRODUCTION MAP](#12-testing--production-map)
13. [DEVELOPMENT ROADMAP & LOCK ORDER](#13-development-roadmap--lock-order)
14. [FINAL ARCHITECTURE PRINCIPLE](#14-final-architecture-principle)

---

# 1. COMPLETE FILE INVENTORY

## 1.1 Grand Total Summary

```
┌──────────────────────────┬──────────┬─────────────────────────────────────┐
│ CATEGORY                 │ FILES    │ DESCRIPTION                         │
├──────────────────────────┼──────────┼─────────────────────────────────────┤
│ BLUEPRINT DOCUMENTS      │   43     │ Architecture specs, rules, maps     │
│ FRONTEND FILES           │  312     │ React components, pages, services   │
│ BACKEND FILES            │  285     │ Controllers, services, repos, models│
│ API / WIRING FILES       │   76     │ Contracts, wiring maps, events      │
│ DATABASE FILES           │   42     │ Schema, migrations, seeders         │
│ TEST FILES               │  156     │ Unit, integration, security tests   │
├──────────────────────────┼──────────┼─────────────────────────────────────┤
│ GRAND TOTAL              │  914     │ Complete GNT System Files           │
└──────────────────────────┴──────────┴─────────────────────────────────────┘
```

## 1.2 Per-Module File Distribution

```
┌────────┬──────────────────────────┬──────────┬──────────┬──────────┬──────────┐
│ MODULE │ NAME                     │ FRONTEND │ BACKEND  │ API      │ TESTS    │
├────────┼──────────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ M01    │ Foundation               │    12    │    10    │    4     │    8     │
│ M02    │ Core Architecture        │    14    │    18    │    6     │   12     │
│ M03    │ Device & Platform        │    10    │     8    │    4     │    6     │
│ M04    │ Company Management       │    18    │    16    │    5     │   10     │
│ M05    │ Party Management         │    16    │    14    │    5     │   10     │
│ M06    │ Inventory Management     │    24    │    22    │    6     │   14     │
│ M07    │ Purchase Management      │    20    │    18    │    6     │   12     │
│ M08    │ Sales & Billing          │    28    │    24    │    8     │   16     │
│ M09    │ GST & Compliance         │    18    │    16    │    5     │   10     │
│ M10    │ Accounting               │    22    │    20    │    6     │   14     │
│ M11    │ Payment & Communication  │    16    │    14    │    5     │   10     │
│ M12    │ Employee & HR            │    18    │    16    │    5     │   10     │
│ M13    │ Smart Automation         │    12    │    14    │    4     │    8     │
│ M14    │ Import & Export          │    10    │    10    │    4     │    6     │
│ M15    │ Data Storage & Sync      │    10    │    12    │    4     │    6     │
│ M16    │ Notification Engine      │     8    │    12    │    3     │    6     │
│ M17    │ Reporting                │    14    │    16    │    4     │    8     │
│ M18    │ External Integration     │    10    │    12    │    4     │    6     │
│ M19    │ Production & Monitoring  │    10    │    12    │    4     │    6     │
│ M20    │ International Trade & HSN │    14    │    16    │    6     │   10     │
├────────┼──────────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ COMMON │ Shared Foundation        │    20    │    24    │    8     │   16     │
├────────┼──────────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ TOTAL  │                          │   312    │   285    │   76     │  156     │
└────────┴──────────────────────────┴──────────┴──────────┴──────────┴──────────┘
```

---

# 2. BLUEPRINT FILE MANIFEST

## 2.1 Master Blueprint Documents (43 Files)

```
GNT_MASTER_BLUEPRINT/
│
├── 01_MASTER_RULES/
│   ├── GNT_MASTER_BLUEPRINT_RULES_01-67.md          [Authority: GLOBAL]
│   ├── GNT_MASTER_BLUEPRINT_RULES_68-79.md          [Authority: GLOBAL]
│   └── GNT_MASTER_BLUEPRINT_RULES_80-93.md          [Authority: GLOBAL]
│
├── 02_DATABASE_SCHEMA/
│   ├── GNT_MASTER_DATABASE_SCHEMA.md                [Canonical Entity Definitions]
│   ├── GNT_ENTITY_RELATIONSHIP_MAP.md               [Relationship Diagrams]
│   ├── GNT_DATABASE_RULES.md                        [DB Access Rules]
│   └── GNT_MIGRATION_VERSIONING.md                [Migration Standards]
│
├── 03_MODULE_INTEGRATION/
│   ├── GNT_CROSS_MODULE_RULES.md                  [Boundary Rules]
│   ├── GNT_DEPENDENCY_MAP.md                      [Module Dependencies]
│   ├── GNT_EVENT_FLOW_MAP.md                      [Event Definitions]
│   └── GNT_MODULE_INTEGRATION_MAP.md              [Data Flow Diagrams]
│
├── 04_TRANSACTION_ENGINE/
│   ├── GNT_TRANSACTION_RULES.md                   [Financial Transaction Rules]
│   └── GNT_CENTRAL_TRANSACTION_ENGINE_SPEC.md     [Engine Architecture]
│
├── 05_API_CONTRACT/
│   ├── GNT_API_CONTRACT.md                        [API Structure Standard]
│   ├── GNT_REQUEST_RESPONSE_STANDARD.md           [Response Envelope]
│   ├── GNT_ERROR_CODE_STANDARD.md                 [Error Code Registry]
│   └── GNT_API_VERSIONING.md                      [Version Strategy]
│
├── 06_SECURITY_IMPLEMENTATION/
│   ├── GNT_SECURITY_SPECIFICATION.md              [Security Foundation]
│   ├── GNT_SESSION_SECURITY.md                    [Session Management]
│   ├── GNT_PERMISSION_MATRIX.md                   [Role x Module x Action]
│   ├── GNT_DATA_PROTECTION_RULES.md             [Encryption & Privacy]
│   └── GNT_AUDIT_LOG_SPECIFICATION.md           [Audit Trail Rules]
│
├── 07_OFFLINE_SYNC/
│   ├── GNT_OFFLINE_SYNC_SPECIFICATION.md          [Offline Architecture]
│   ├── GNT_SYNC_QUEUE_RULES.md                  [Queue Management]
│   ├── GNT_DATA_CONSISTENCY_RULES.md            [Consistency Rules]
│   ├── GNT_CONFLICT_RESOLUTION.md               [Conflict Handling]
│   └── GNT_BACKUP_RESTORE_RULES.md              [Backup Strategy]
│
├── 08_AUTOMATION/
│   ├── GNT_AUTOMATION_RULEBOOK.md               [Automation Foundation]
│   ├── GNT_SCHEDULER_RULES.md                   [Scheduled Jobs]
│   ├── GNT_NOTIFICATION_RULES.md                [Notification Engine]
│   └── GNT_EVENT_TRIGGER_MAP.md                 [Trigger Definitions]
│
├── 09_UI_UX/
│   ├── GNT_UI_UX_SPECIFICATION.md               [Device Guidelines]
│   ├── GNT_UI_SECURITY_RULES.md                 [UI Security Rules]
│   ├── GNT_SCREEN_NAVIGATION_MAP.md             [Navigation Structure]
│   └── GNT_RESPONSIVE_DEVICE_RULES.md           [Responsive Breakpoints]
│
├── 10_TESTING_PRODUCTION/
│   ├── GNT_TEST_CASE_MASTER.md                  [Test Case Repository]
│   ├── GNT_SECURITY_TEST_MATRIX.md              [Security Tests]
│   ├── GNT_INTEGRATION_TEST_MATRIX.md           [Integration Tests]
│   ├── GNT_PERFORMANCE_TEST_RULES.md            [Performance Tests]
│   ├── GNT_PRODUCTION_READINESS_CHECKLIST.md  [Release Checklist]
│   └── GNT_RELEASE_CONTROL.md                   [Release Process]
│
├── 11_IMPLEMENTATION_STATUS/
│   ├── GNT_FILE_STATUS_RULES.md                 [Status Labels]
│   ├── GNT_GROUP_AUDIT_MATRIX.md                [Audit Matrix]
│   └── GNT_IMPLEMENTATION_STATUS.md             [Live Status Tracker]
│
└── 99_ADVANCED_MASTER/
    └── GNT_ADVANCED_SOFTWARE_BLUEPRINT.md       [THIS DOCUMENT]
```

---

# 3. FRONTEND FILE MANIFEST (312 Files)

## 3.1 Global Foundation Files (20 Files)

```
frontend/src/
│
├── app/
│   ├── App.tsx                                    [Root component]
│   ├── AppProviders.tsx                           [Context providers wrapper]
│   └── main.tsx                                   [Entry point]
│
├── core/
│   ├── api-client.ts                              [Axios wrapper + interceptors]
│   ├── auth-guard.tsx                             [Route protection HOC]
│   ├── request-tracer.ts                          [Correlation ID injection]
│   └── tenant-context.ts                          [Company/Branch context]
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx                             [Primary/Secondary/Danger]
│   │   ├── Input.tsx                              [Text/Number/Date/Select]
│   │   ├── Table.tsx                              [Virtualized data table]
│   │   ├── Card.tsx                               [Content container]
│   │   ├── Modal.tsx                              [Dialog overlay]
│   │   ├── Drawer.tsx                             [Side panel]
│   │   ├── Badge.tsx                              [Status indicator]
│   │   ├── Toast.tsx                              [Notification toast]
│   │   ├── Skeleton.tsx                           [Loading skeleton]
│   │   ├── EmptyState.tsx                         [No data state]
│   │   └── Pagination.tsx                         [Page controls]
│   │
│   ├── layout/
│   │   ├── Header.tsx                             [Top bar + company name]
│   │   ├── Footer.tsx                             [GNT branding bottom]
│   │   ├── Sidebar.tsx                            [Navigation sidebar]
│   │   ├── BottomNav.tsx                          [Mobile bottom nav]
│   │   └── LayoutShell.tsx                        [Page wrapper]
│   │
│   └── feedback/
│       ├── ErrorBoundary.tsx                      [Crash isolation]
│       ├── LoadingOverlay.tsx                     [Full-screen loader]
│       └── OfflineBanner.tsx                      [Network status]
│
├── state/
│   ├── auth.store.ts                              [Auth state]
│   ├── theme.store.ts                             [Theme state]
│   ├── language.store.ts                          [Language state]
│   └── company.store.ts                           [Active company state]
│
├── hooks/
│   ├── useAuth.ts                                 [Auth hook]
│   ├── usePermission.ts                           [Permission hook]
│   ├── useOffline.ts                              [Offline detection]
│   ├── useDebounce.ts                             [Search debounce]
│   └── useAutoSave.ts                             [Draft auto-save]
│
├── utils/
│   ├── formatters.ts                              [Date/Currency/Number]
│   ├── validators.ts                              [Common validators]
│   └── constants.ts                               [App constants]
│
└── styles/
    ├── theme.css                                  [CSS variables]
    ├── tokens.ts                                  [Design tokens]
    └── global.css                                 [Global styles]
```

## 3.2 Module Frontend Files (Per Module Pattern)

```
frontend/src/modules/mXX-module-name/
│
├── pages/
│   ├── ScreenOnePage.tsx                          [Route-mapped page]
│   ├── ScreenTwoPage.tsx
│   └── ...
│
├── components/
│   ├── ModuleSpecificWidget.tsx                   [Reusable module widget]
│   └── ...
│
├── services/
│   ├── moduleName.service.ts                      [API calls to backend]
│   └── moduleName.types.ts                        [DTOs & interfaces]
│
├── state/
│   ├── moduleName.store.ts                        [Zustand store slice]
│   └── moduleName.actions.ts                      [Async actions]
│
├── validators/
│   └── moduleName.schema.ts                       [Zod validation schemas]
│
├── routes/
│   └── moduleName.routes.ts                       [Route definitions]
│
└── index.ts                                       [Public exports]
```

## 3.3 M01-M20 Frontend File Count Detail

```
┌────────┬──────────────────────────┬───────┬───────────┬──────────┬──────────┬──────────┐
│ MODULE │ PAGES                    │ COMP  │ SERVICES  │ STATE    │ VALID    │ ROUTES   │
├────────┼──────────────────────────┼───────┼───────────┼──────────┼──────────┼──────────┤
│ M01    │ 3 screens                │   2   │     2     │    1     │    1     │    1     │
│ M02    │ 4 screens                │   4   │     3     │    2     │    1     │    1     │
│ M03    │ 3 screens                │   2   │     2     │    1     │    1     │    1     │
│ M04    │ 6 screens                │   4   │     3     │    2     │    1     │    1     │
│ M05    │ 3 screens                │   4   │     3     │    2     │    1     │    1     │
│ M06    │ 6 screens                │   6   │     4     │    2     │    2     │    1     │
│ M07    │ 5 screens                │   5   │     4     │    2     │    2     │    1     │
│ M08    │ 6 screens                │   8   │     5     │    3     │    2     │    1     │
│ M09    │ 5 screens                │   4   │     3     │    2     │    1     │    1     │
│ M10    │ 6 screens                │   6   │     4     │    2     │    2     │    1     │
│ M11    │ 4 screens                │   4   │     3     │    2     │    1     │    1     │
│ M12    │ 5 screens                │   4   │     3     │    2     │    1     │    1     │
│ M13    │ 4 screens                │   3   │     3     │    1     │    1     │    1     │
│ M14    │ 4 screens                │   2   │     2     │    1     │    1     │    1     │
│ M15    │ 3 screens                │   2   │     2     │    1     │    1     │    1     │
│ M16    │ 3 screens                │   2   │     2     │    1     │    1     │    1     │
│ M17    │ 6 screens                │   3   │     3     │    2     │    1     │    1     │
│ M18    │ 3 screens                │   2   │     2     │    1     │    1     │    1     │
│ M19    │ 3 screens                │   2   │     2     │    1     │    1     │    1     │
├────────┼──────────────────────────┼───────┼───────────┼──────────┼──────────┼──────────┤
│ COMMON │ —                        │  20   │     8     │    4     │    4     │    1     │
├────────┼──────────────────────────┼───────┼───────────┼──────────┼──────────┼──────────┤
│ TOTAL  │ 78 screens               │  88   │    63     │   32     │   25     │   20     │
└────────┴──────────────────────────┴───────┴───────────┴──────────┴──────────┴──────────┘
```


---

# 4. BACKEND FILE MANIFEST (285 Files)

## 4.1 Common Foundation Files (24 Files)

```
backend/src/common/
│
├── security/
│   ├── security-check.ts                          [General validations]
│   ├── permission-check.ts                        [RBAC evaluation]
│   ├── access-control.ts                          [ACL enforcement]
│   ├── encryption-manager.ts                      [AES-256-GCM]
│   ├── password-manager.ts                        [bcrypt hashing]
│   ├── token-manager.ts                           [JWT RS256]
│   └── secret-manager.ts                          [Env/Vault secrets]
│
├── logging/
│   ├── logger.ts                                  [Winston/Pino wrapper]
│   └── audit-logger.ts                            [Audit trail service]
│
├── errors/
│   ├── error-codes.ts                             [GNT-ERR-XXXX registry]
│   ├── error-classes.ts                           [Custom error classes]
│   └── error-handler.ts                           [Global error handler]
│
├── middleware/
│   ├── auth-middleware.ts                         [JWT validation]
│   ├── tenant-middleware.ts                       [Company context]
│   ├── request-tracer.ts                          [Correlation ID]
│   ├── rate-limiter.ts                            [Throttling]
│   ├── error-middleware.ts                        [Error response]
│   └── validation-middleware.ts                   [Zod validation]
│
├── events/
│   ├── event-bus.ts                               [Central event bus]
│   └── event-registry.ts                          [Event versioning]
│
├── config/
│   ├── env-config.ts                              [Environment config]
│   └── app-config.ts                              [App settings]
│
└── utils/
    ├── request-context.ts                         [Per-request context]
    ├── date-utils.ts                              [Date helpers]
    └── number-utils.ts                            [Decimal precision]
```

## 4.2 Module Backend Files (Per Module Pattern)

```
backend/src/modules/mXX-module-name/
│
├── controllers/
│   └── moduleName.controller.ts                   [HTTP request handlers]
│
├── services/
│   ├── moduleName.service.ts                      [Public business logic]
│   └── moduleName.internal.ts                     [Private helpers]
│
├── repositories/
│   └── moduleName.repository.ts                   [DB queries (OWNER ONLY)]
│
├── models/
│   └── moduleName.model.ts                        [Prisma extensions]
│
├── validators/
│   └── moduleName.schema.ts                       [Input validation (Zod)]
│
├── routes/
│   └── moduleName.routes.ts                       [Route definitions]
│
├── events/
│   ├── moduleName.events.ts                       [Event definitions]
│   └── moduleName.handlers.ts                     [Event consumers]
│
├── types/
│   └── moduleName.types.ts                        [DTOs & interfaces]
│
├── tests/
│   ├── unit/
│   │   └── moduleName.service.test.ts
│   ├── integration/
│   │   └── moduleName.integration.test.ts
│   └── api/
│       └── moduleName.api.test.ts
│
└── index.ts                                       [Public exports]
```

## 4.3 M01-M20 Backend File Count Detail

```
┌────────┬──────────────────────────┬───────┬───────────┬──────────┬──────────┬──────────┐
│ MODULE │ CONTROLLER               │ SVC   │ REPO      │ MODEL    │ VALID    │ ROUTES   │
├────────┼──────────────────────────┼───────┼───────────┼──────────┼──────────┼──────────┤
│ M01    │ 1                        │   2   │     1     │    1     │    1     │    1     │
│ M02    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M03    │ 1                        │   2   │     1     │    1     │    1     │    1     │
│ M04    │ 2                        │   3   │     2     │    2     │    2     │    1     │
│ M05    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M06    │ 3                        │   4   │     3     │    3     │    2     │    1     │
│ M07    │ 2                        │   3   │     2     │    2     │    2     │    1     │
│ M08    │ 3                        │   5   │     3     │    3     │    2     │    1     │
│ M09    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M10    │ 3                        │   4   │     3     │    3     │    2     │    1     │
│ M11    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M12    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M13    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M14    │ 1                        │   2   │     1     │    1     │    1     │    1     │
│ M15    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M16    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M17    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M18    │ 2                        │   3   │     2     │    2     │    1     │    1     │
│ M19    │ 2                        │   3   │     2     │    2     │    1     │    1     │
├────────┼──────────────────────────┼───────┼───────────┼──────────┼──────────┼──────────┤
│ COMMON │ —                        │   7   │     1     │    —     │    4     │    —     │
├────────┼──────────────────────────┼───────┼───────────┼──────────┼──────────┼──────────┤
│ TOTAL  │ 38                       │  62   │    39     │   37     │   25     │   19     │
└────────┴──────────────────────────┴───────┴───────────┴──────────┴──────────┴──────────┘
```

**Backend Total Breakdown:**
- Controllers: 38
- Services (Public + Internal): 62
- Repositories: 39
- Models: 37
- Validators: 25
- Routes: 19
- Event Handlers: 19
- Types/DTOs: 19
- Tests: 27 (per module x 3 test files)
- **Grand Total: 285 files**

---

# 5. API / WIRING FILE MANIFEST (76 Files)

## 5.1 API Contract Files

```
api-contracts/
│
├── v1/
│   ├── M01-foundation.contract.yaml               [OpenAPI 3.0 spec]
│   ├── M02-core.contract.yaml
│   ├── M03-device.contract.yaml
│   ├── M04-company.contract.yaml
│   ├── M05-party.contract.yaml
│   ├── M06-inventory.contract.yaml
│   ├── M07-purchase.contract.yaml
│   ├── M08-sales.contract.yaml
│   ├── M09-gst.contract.yaml
│   ├── M10-accounting.contract.yaml
│   ├── M11-payment.contract.yaml
│   ├── M12-hr.contract.yaml
│   ├── M13-automation.contract.yaml
│   ├── M14-import-export.contract.yaml
│   ├── M15-sync.contract.yaml
│   ├── M16-notification.contract.yaml
│   ├── M17-reporting.contract.yaml
│   ├── M18-integration.contract.yaml
│   └── M19-production.contract.yaml
│
└── common/
    ├── auth.contract.yaml                         [Login/OTP/Session]
    ├── error.contract.yaml                        [Error response schema]
    └── health.contract.yaml                       [Health check endpoints]
```

## 5.2 Wiring Map Files

```
wiring-maps/
│
├── module-wiring/
│   ├── M01-wiring-map.json                        [M01 connections]
│   ├── M02-wiring-map.json
│   ├── M03-wiring-map.json
│   ├── M04-wiring-map.json
│   ├── M05-wiring-map.json
│   ├── M06-wiring-map.json
│   ├── M07-wiring-map.json
│   ├── M08-wiring-map.json
│   ├── M09-wiring-map.json
│   ├── M10-wiring-map.json
│   ├── M11-wiring-map.json
│   ├── M12-wiring-map.json
│   ├── M13-wiring-map.json
│   ├── M14-wiring-map.json
│   ├── M15-wiring-map.json
│   ├── M16-wiring-map.json
│   ├── M17-wiring-map.json
│   ├── M18-wiring-map.json
│   └── M19-wiring-map.json
│
├── cross-module-flows/
│   ├── sales-invoice-flow.wiring.json             [M08->M06->M09->M10->M11]
│   ├── purchase-invoice-flow.wiring.json          [M07->M06->M09->M10->M11]
│   ├── payment-allocation-flow.wiring.json        [M11->M08->M10->M05]
│   ├── stock-adjustment-flow.wiring.json          [M06->M10->Audit]
│   ├── salary-processing-flow.wiring.json         [M12->M10->M11]
│   ├── gst-filing-flow.wiring.json                [M09->M08->M07->M17]
│   └── offline-sync-flow.wiring.json              [M15->All Modules]
│
└── event-registry/
    ├── event-definitions.json                     [All event schemas]
    ├── event-versioning.json                      [Version history]
    └── event-subscribers.json                     [Consumer mappings]
```

## 5.3 Integration Registry Files

```
integration-registry/
│
├── external/
│   ├── GSTN-integration.yaml                      [GST Network API]
│   ├── WhatsApp-Business-integration.yaml         [WhatsApp API]
│   ├── SMS-gateway-integration.yaml               [SMS Provider]
│   ├── Payment-gateway-integration.yaml           [UPI/Card/NetBanking]
│   ├── E-Invoice-integration.yaml                 [IRP Portal]
│   └── E-Way-Bill-integration.yaml                [E-Way Bill Portal]
│
└── internal/
    ├── service-mesh-config.yaml                   [Inter-service config]
    └── circuit-breaker-config.yaml                [Failure handling]
```

---

# 6. MASTER CALL CHAIN MAP

## 6.1 The Golden Call Chain (Every Request)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER ACTION                                         │
│                         (Click / Type / Scan)                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: FRONTEND PRESENTATION                                                  │
│  ├── User clicks "Create Sales Invoice" button                                  │
│  ├── Button.tsx (UI Component)                                                  │
│  └── M08 Page Component (SalesInvoicePage.tsx)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: FRONTEND SERVICE                                                       │
│  ├── sales.service.ts -> createInvoice(payload)                                  │
│  ├── Zod Validation (Frontend)                                                  │
│  ├── Draft Auto-Save (LocalStorage)                                             │
│  └── api-client.ts -> POST /api/v1/sales/invoice                                 │
│       ├── Header: Authorization: Bearer <JWT>                                   │
│       ├── Header: X-Company-Id: <tenant>                                        │
│       ├── Header: X-Request-Id: <uuid>                                          │
│       └── Body: Validated Payload                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: API GATEWAY / BACKEND ENTRY                                            │
│  ├── Express/Fastify Router                                                     │
│  ├── auth-middleware.ts -> Verify JWT                                            │
│  ├── tenant-middleware.ts -> Set Company Context                                 │
│  ├── request-tracer.ts -> Inject Correlation ID                                  │
│  ├── rate-limiter.ts -> Check Throttling                                         │
│  └── validation-middleware.ts -> Zod Schema Check                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: BACKEND CONTROLLER                                                     │
│  ├── sales.controller.ts -> createInvoiceHandler(req, res)                       │
│  ├── Extract: user, company, branch from context                                │
│  └── Call: sales.service.ts.createInvoice()                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: BACKEND SERVICE (Public)                                               │
│  ├── sales.service.ts -> createInvoice(data)                                     │
│  ├── Business Logic: Calculate totals, discounts                                │
│  ├── Call: Central Transaction Engine                                           │
│  │   ├── Validate: Stock availability (M06 Public Service)                      │
│  │   ├── Validate: Party credit limit (M05 Public Service)                      │
│  │   └── Validate: GST rules (M09 Public Service)                              │
│  └── Call: sales.repository.ts -> save()                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 6: BACKEND REPOSITORY (Internal - Owner ONLY)                             │
│  ├── sales.repository.ts -> createInvoiceRecord(data)                            │
│  ├── Prisma Query: tx.sales_invoice.create()                                    │
│  ├── Prisma Query: tx.sales_invoice_item.createMany()                           │
│  └── Return: Created Record                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 7: DATABASE                                                               │
│  ├── sales_invoice table (Owner: M08)                                           │
│  ├── sales_invoice_item table (Owner: M08)                                      │
│  ├── stock_movement table (Owner: M06 - via Transaction Engine)                 │
│  ├── ledger table (Owner: M10 - via Transaction Engine)                         │
│  └── gst_transaction table (Owner: M09 - via Transaction Engine)                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 8: EVENT PUBLISHING (Async)                                               │
│  ├── Event Bus: publish("sales.invoice.created", payload)                       │
│  ├── Subscribers:                                                               │
│  │   ├── M06: Stock Update Handler                                              │
│  │   ├── M09: GST Calculation Handler                                           │
│  │   ├── M10: Ledger Entry Handler                                              │
│  │   ├── M11: Due Tracker Handler                                               │
│  │   ├── M16: Notification Handler                                              │
│  │   └── M17: Report Update Handler                                             │
│  └── All handlers run independently (idempotent)                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 9: AUDIT & LOGGING                                                        │
│  ├── Audit Logger: Record action (user, module, action, before, after)          │
│  ├── Logger: Structured JSON log (request_id, timestamp, status)                │
│  └── Response: { success: true, data: invoice, meta: {request_id, timestamp} }  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 10: FRONTEND RESPONSE                                                     │
│  ├── Toast: "Invoice created successfully"                                      │
│  ├── State Update: Zustand store refresh                                        │
│  ├── UI Update: Invoice appears in list                                         │
│  └── Navigation: Redirect to invoice view                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Cross-Module Service Call Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CROSS-MODULE SERVICE CALL MAP                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   M08 (Sales) ---------------------------------------------------------------┐   │
│   │                                                                          │   │
│   │  +---> M06 (Inventory) ---> stock.service.checkAvailability()              │   │
│   │  │     └── Response: { stockQty, batchInfo, serialInfo }                │   │
│   │  │                                                                      │   │
│   │  +---> M06 (Inventory) ---> stock.service.deductStock()                    │   │
│   │  │     └── Event: stock.updated                                         │   │
│   │  │                                                                      │   │
│   │  +---> M09 (GST) ---> gst.service.calculateTax()                           │   │
│   │  │     └── Response: { cgst, sgst, igst, totalTax }                     │   │
│   │  │                                                                      │   │
│   │  +---> M10 (Accounting) ---> ledger.service.createEntry()                  │   │
│   │  │     └── Response: { ledgerId, debit, credit, balance }               │   │
│   │  │                                                                      │   │
│   │  +---> M11 (Payment) ---> payment.service.createDue()                     │   │
│   │  │     └── Response: { dueId, amount, dueDate }                         │   │
│   │  │                                                                      │   │
│   │  +---> M05 (Party) ---> party.service.updateOutstanding()                  │   │
│   │        └── Response: { partyId, newBalance }                            │   │
│   │                                                                         │   │
│   +--------------------------------------------------------------------------┘   │
│                                                                                  │
│   M07 (Purchase) ------------------------------------------------------------┐   │
│   │                                                                          │   │
│   │  +---> M06 (Inventory) ---> stock.service.addStock()                       │   │
│   │  │     └── Event: stock.updated                                         │   │
│   │  │                                                                      │   │
│   │  +---> M09 (GST) ---> gst.service.calculateInputTax()                      │   │
│   │  │     └── Response: { inputCgst, inputSgst, inputIgst }                │   │
│   │  │                                                                      │   │
│   │  +---> M10 (Accounting) ---> ledger.service.createPurchaseEntry()          │   │
│   │  │     └── Response: { ledgerId, debit, credit, balance }               │   │
│   │  │                                                                      │   │
│   │  +---> M11 (Payment) ---> payment.service.createPayable()                  │   │
│   │        └── Response: { payableId, amount, dueDate }                     │   │
│   │                                                                         │   │
│   +--------------------------------------------------------------------------┘   │
│                                                                                  │
│   M11 (Payment) -------------------------------------------------------------┐   │
│   │                                                                          │   │
│   │  +---> M10 (Accounting) ---> ledger.service.createPaymentEntry()           │   │
│   │  │     └── Response: { ledgerId, debit, credit, balance }               │   │
│   │  │                                                                      │   │
│   │  +---> M05 (Party) ---> party.service.updateOutstanding()                  │   │
│   │  │     └── Response: { partyId, newBalance }                            │   │
│   │  │                                                                      │   │
│   │  +---> M08/M07 ---> invoice.service.updatePaymentStatus()                  │   │
│   │        └── Response: { invoiceId, status: "paid/partial" }              │   │
│   │                                                                         │   │
│   +--------------------------------------------------------------------------┘   │
│                                                                                  │
│   M12 (HR) ------------------------------------------------------------------┐   │
│   │                                                                          │   │
│   │  +---> M10 (Accounting) ---> ledger.service.createSalaryExpense()          │   │
│   │  │     └── Response: { ledgerId, expenseAmount }                        │   │
│   │  │                                                                      │   │
│   │  +---> M11 (Payment) ---> payment.service.processSalaryPayment()           │   │
│   │        └── Response: { paymentId, amount, mode }                        │   │
│   │                                                                         │   │
│   +--------------------------------------------------------------------------┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


## 6.3 File-to-File Call Chain (Detailed)

### Example: Sales Invoice Creation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FILE CALL CHAIN: Create Sales Invoice                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [FRONTEND]                                                                     │
│  SalesInvoicePage.tsx                                                           │
│       │                                                                         │
│       +-- calls -> sales.service.ts -> createInvoice(payload)                     │
│       │              │                                                          │
│       │              +-- validates -> sales.schema.ts (Zod)                      │
│       │              │                                                         │
│       │              +-- calls -> api-client.ts -> POST /api/v1/sales/invoice     │
│       │                                                                         │
│       +-- on success -> updates -> sales.store.ts -> refresh list                 │
│                                                                                  │
│  [BACKEND]                                                                      │
│  sales.routes.ts                                                                │
│       │                                                                         │
│       +-- mounts -> POST /api/v1/sales/invoice                                   │
│       │              │                                                          │
│       │              +-- calls -> auth-middleware.ts -> verify JWT               │
│       │                     calls -> tenant-middleware.ts -> set context          │
│       │                     calls -> request-tracer.ts -> inject UUID            │
│       │                     calls -> validation-middleware.ts -> Zod check       │
│       │                     calls -> sales.controller.ts -> createInvoiceHandler  │
│       │                                                                         │
│  sales.controller.ts                                                            │
│       │                                                                         │
│       +-- calls -> sales.service.ts -> createInvoice(data)                        │
│                                                                                  │
│  sales.service.ts (PUBLIC)                                                      │
│       │                                                                         │
│       +-- calls -> stock.service.ts (M06 PUBLIC) -> checkAvailability()          │
│       +-- calls -> party.service.ts (M05 PUBLIC) -> checkCreditLimit()           │
│       +-- calls -> gst.service.ts (M09 PUBLIC) -> calculateTax()                 │
│       +-- calls -> central-transaction-engine.ts -> validateTransaction()        │
│       +-- calls -> sales.repository.ts -> create()                                │
│                                                                                  │
│  sales.repository.ts (INTERNAL - M08 ONLY)                                      │
│       │                                                                         │
│       +-- calls -> Prisma -> tx.sales_invoice.create()                            │
│       +-- calls -> Prisma -> tx.sales_invoice_item.createMany()                   │
│       +-- returns -> Invoice Record                                              │
│                                                                                  │
│  [EVENTS - Async after response]                                                │
│  event-bus.ts                                                                   │
│       │                                                                         │
│       +-- publishes -> "sales.invoice.created"                                   │
│       │              │                                                          │
│       │              +-- subscriber -> stock.handlers.ts (M06) -> deductStock    │
│       │              +-- subscriber -> gst.handlers.ts (M09) -> recordOutputTax  │
│       │              +-- subscriber -> ledger.handlers.ts (M10) -> createEntries │
│       │              +-- subscriber -> due.handlers.ts (M11) -> createDue        │
│       │              +-- subscriber -> notification.handlers.ts (M16) -> notify  │
│       │              +-- subscriber -> audit-logger.ts -> logAction              │
│       │                                                                         │
│       +-- All subscribers run independently and idempotently                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 7. MODULE-WISE FILE BREAKDOWN (M01-M20)

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

## 7.6 M06 - INVENTORY MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M06: INVENTORY MANAGEMENT                                                       │
│ Purpose: Product, Category, Stock, Batch, Serial, Transfer, Adjustment          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (24 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- ItemListPage.tsx             [Product grid + stock badges]            │
│  │   +-- ItemEntryDrawer.tsx          [Add/Edit product drawer]                │
│  │   +-- CategoryUnitPage.tsx         [Category tree + unit conversion]        │
│  │   +-- StockTransferPage.tsx        [Godown-to-godown transfer]              │
│  │   +-- StockAdjustmentPage.tsx      [Physical verification voucher]          │
│  │   +-- LowStockAlertPage.tsx        [Reorder alert center]                   │
│  +-- services/                                                                  │
│  │   +-- inventory.service.ts         [Inventory API calls]                    │
│  │   +-- inventory.types.ts          [Inventory DTOs]                          │
│  +-- state/                                                                     │
│  │   +-- inventory.store.ts          [Inventory state]                         │
│  +-- validators/                                                                │
│      +-- inventory.schema.ts         [Product/Stock validation]                │
│                                                                                  │
│  BACKEND (22 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- product.controller.ts        [Product CRUD]                           │
│  │   +-- stock.controller.ts          [Stock queries + adjustments]            │
│  │   +-- category.controller.ts       [Category tree]                          │
│  +-- services/                                                                  │
│  │   +-- product.service.ts           [Product logic]                          │
│  │   +-- stock.service.ts             [Stock logic - PUBLIC INTERFACE]         │
│  │   +-- stock.internal.ts            [Stock calculations]                     │
│  │   +-- category.service.ts          [Category logic]                         │
│  +-- repositories/                                                              │
│  │   +-- product.repository.ts        [product_master access]                  │
│  │   +-- stock.repository.ts          [stock_master access - INTERNAL]         │
│  │   +-- category.repository.ts       [category_master access]                 │
│  +-- routes/                                                                    │
│      +-- inventory.routes.ts          [Inventory endpoints]                    │
│                                                                                  │
│  API CONTRACT (6 files):                                                        │
│  +-- M06-inventory.contract.yaml      [Product/Stock/Category APIs]            │
│  +-- M06-wiring-map.json              [M07, M08, M10, M13, M16]              │
│  +-- events: stock.updated, stock.low [Published events]                       │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- product_master                 [Product definition - CANONICAL]           │
│  +-- category_master                [Category tree]                             │
│  +-- stock_master                   [Stock quantity per branch]                │
│  +-- stock_movement                 [Every stock change - AUDIT TRAIL]         │
│  +-- batch_master                   [Batch tracking]                            │
│  +-- serial_master                  [Serial number tracking]                    │
│                                                                                  │
│  PROVIDES: Product data, Stock check, Stock update (via Transaction Engine)    │
│  USES: M04 (Company/Branch context)                                           │
│  FORBIDDEN: Direct stock modification without Transaction Engine                │
│             Invoice creation, Payment processing, Ledger entries                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.7 M07 - PURCHASE MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M07: PURCHASE MANAGEMENT                                                        │
│ Purpose: Purchase Order, Purchase Invoice, GRN, Return, Payment                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (20 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- PurchaseEntryPage.tsx        [Supplier bill entry]                    │
│  │   +-- PurchaseOrderPage.tsx        [PO creation + approval]                 │
│  │   +-- PurchaseReturnPage.tsx       [Debit note]                             │
│  │   +-- SupplierPaymentPage.tsx      [Payment voucher]                        │
│  │   +-- PurchaseHistoryPage.tsx      [Purchase register]                      │
│  +-- services/                                                                  │
│  │   +-- purchase.service.ts         [Purchase API calls]                      │
│  │   +-- purchase.types.ts           [Purchase DTOs]                           │
│  +-- state/                                                                     │
│  │   +-- purchase.store.ts           [Purchase state]                          │
│  +-- validators/                                                                │
│      +-- purchase.schema.ts          [Purchase validation]                     │
│                                                                                  │
│  BACKEND (18 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- purchase.controller.ts       [Purchase CRUD]                          │
│  │   +-- po.controller.ts             [Purchase Order handlers]                │
│  +-- services/                                                                  │
│  │   +-- purchase.service.ts          [Purchase logic]                         │
│  │   +-- po.service.ts                [PO logic]                               │
│  │   +-- purchase.internal.ts         [Tax calculation]                        │
│  +-- repositories/                                                              │
│  │   +-- purchase.repository.ts       [purchase_invoice access]                │
│  │   +-- po.repository.ts             [purchase_order access]                  │
│  +-- routes/                                                                    │
│      +-- purchase.routes.ts          [Purchase endpoints]                      │
│                                                                                  │
│  API CONTRACT (6 files):                                                        │
│  +-- M07-purchase.contract.yaml      [Purchase/PO/Return APIs]                 │
│  +-- M07-wiring-map.json             [M05, M06, M09, M10, M11]              │
│  +-- event: purchase.invoice.approved [Triggers stock + accounting]            │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- purchase_order                 [PO master]                                 │
│  +-- purchase_invoice               [Purchase bill - CANONICAL]                │
│  +-- purchase_invoice_item          [Line items]                                │
│  +-- purchase_return                [Return/Debit notes]                        │
│                                                                                  │
│  PROVIDES: Purchase invoice, PO, Return data                                   │
│  USES: M05 (Supplier), M06 (Product/Stock), M09 (GST), M10 (Accounting)       │
│  FORBIDDEN: Direct stock update, Direct ledger entry, Customer data             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.8 M08 - SALES & BILLING

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M08: SALES & BILLING                                                            │
│ Purpose: Quotation, Sales Order, Invoice, Return, Receipt, Print/Share          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (28 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- SalesInvoicePage.tsx         [Ultra-fast billing screen]              │
│  │   +-- QuotationPage.tsx            [Price estimate]                         │
│  │   +-- DeliveryChallanPage.tsx      [Dispatch note]                          │
│  │   +-- SalesReturnPage.tsx          [Credit note]                            │
│  │   +-- CustomerReceiptPage.tsx      [Payment receipt]                        │
│  │   +-- InvoicePrintSharePage.tsx    [Print/Export/WhatsApp]                  │
│  +-- services/                                                                  │
│  │   +-- sales.service.ts             [Sales API calls]                        │
│  │   +-- sales.types.ts               [Sales DTOs]                             │
│  +-- state/                                                                     │
│  │   +-- sales.store.ts               [Sales state]                            │
│  │   +-- sales.actions.ts             [Async actions]                          │
│  +-- validators/                                                                │
│      +-- sales.schema.ts              [Invoice validation]                     │
│                                                                                  │
│  BACKEND (24 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- sales.controller.ts          [Sales CRUD]                             │
│  │   +-- quotation.controller.ts      [Quotation handlers]                     │
│  │   +-- return.controller.ts         [Return handlers]                        │
│  +-- services/                                                                  │
│  │   +-- sales.service.ts             [Sales logic - PUBLIC]                   │
│  │   +-- sales.internal.ts            [Invoice numbering, calc]                │
│  │   +-- quotation.service.ts         [Quotation logic]                        │
│  +-- repositories/                                                              │
│  │   +-- sales.repository.ts          [sales_invoice access - INTERNAL]        │
│  │   +-- quotation.repository.ts      [quotation access]                       │
│  +-- routes/                                                                    │
│      +-- sales.routes.ts             [Sales endpoints]                         │
│                                                                                  │
│  API CONTRACT (8 files):                                                        │
│  +-- M08-sales.contract.yaml         [Invoice/Quotation/Return APIs]           │
│  +-- M08-wiring-map.json             [M05, M06, M09, M10, M11, M16, M17]    │
│  +-- events:                                                         │
│  │   +-- sales.invoice.created       [-> M06, M09, M10, M11, M16, M17]       │
│  │   +-- sales.quotation.converted   [-> M08 (self)]                           │
│  +-- print-templates/                                                │
│      +-- thermal-2inch.template.html [Thermal printer]                         │
│      +-- thermal-3inch.template.html [Thermal printer]                         │
│      +-- a4.template.html            [A4 print]                                │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- quotation                      [Price estimates]                           │
│  +-- sales_order                    [Confirmed orders]                          │
│  +-- sales_invoice                  [Sales bill - CANONICAL]                   │
│  +-- sales_invoice_item             [Line items]                                │
│  +-- sales_return                   [Return/Credit notes]                       │
│  +-- delivery_challan               [Dispatch notes]                            │
│                                                                                  │
│  PROVIDES: Sales invoice, Quotation, Return, Receipt data                      │
│  USES: M05 (Customer), M06 (Product/Stock), M09 (GST), M10 (Accounting)       │
│  FORBIDDEN: Direct stock update, Direct ledger entry, Supplier data             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```


## 7.9 M09 - GST & COMPLIANCE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M09: GST & COMPLIANCE                                                           │
│ Purpose: GST Config, Tax Calculation, Returns, E-Invoice, E-Way Bill            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (18 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- GSTConfigPage.tsx           [HSN/SAC master + tax slabs]             │
│  │   +-- GSTCalculationPage.tsx      [Live tax breakup inspector]             │
│  │   +-- GSTReturnsPage.tsx          [GSTR-1, GSTR-3B compiler]               │
│  │   +-- GSTR2BReconciliationPage.tsx [Purchase vs GSTR-2B matching]          │
│  │   +-- EWayEInvoicePage.tsx        [Portal integration]                      │
│  +-- services/                                                                  │
│  │   +-- gst.service.ts              [GST API calls]                          │
│  │   +-- gst.types.ts                [GST DTOs]                              │
│  +-- state/                                                                     │
│  │   +-- gst.store.ts                [GST state]                              │
│  +-- validators/                                                                │
│      +-- gst.schema.ts              [GST validation]                           │
│                                                                                  │
│  BACKEND (16 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- gst.controller.ts           [GST CRUD + calculation]                 │
│  │   +-- einvoice.controller.ts      [E-Invoice handlers]                     │
│  +-- services/                                                                  │
│  │   +-- gst.service.ts              [GST logic - PUBLIC]                     │
│  │   +-- gst.internal.ts            [Tax engine calculations]                │
│  │   +-- einvoice.service.ts         [IRP portal integration]                 │
│  +-- repositories/                                                              │
│  │   +-- gst.repository.ts          [gst_transaction access]                  │
│  +-- routes/                                                                    │
│      +-- gst.routes.ts             [GST endpoints]                             │
│                                                                                  │
│  API CONTRACT (5 files):                                                        │
│  +-- M09-gst.contract.yaml         [GST/Return/E-Invoice APIs]                │
│  +-- M09-wiring-map.json           [M07, M08, M10, M17, M18]                │
│  +-- events:                                                        │
│      +-- gst.einvoice.generated     [-> M08 (status update), Audit]           │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- hsn_master                     [HSN/SAC codes]                             │
│  +-- tax_rate_master                [CGST/SGST/IGST rates]                      │
│  +-- gst_transaction                [GST records - CANONICAL]                  │
│  +-- e_invoice_record               [IRN/QR data]                              │
│  +-- e_way_bill_record              [E-Way Bill data]                          │
│                                                                                  │
│  PROVIDES: GST calculation, Tax rates, Return data, E-Invoice/E-Way Bill       │
│  USES: M04 (Company GSTIN), M07/M08 (Invoice data)                            │
│  FORBIDDEN: Direct invoice creation, Stock modification, Ledger entry           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.10 M10 - ACCOUNTING

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M10: ACCOUNTING                                                                 │
│ Purpose: Ledger, Cash/Bank Book, Journal Voucher, BRS, Final Accounts           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (22 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- CashBankBookPage.tsx        [Daily cash/bank registers]              │
│  │   +-- JournalVoucherPage.tsx      [JV entry for adjustments]               │
│  │   +-- IncomeExpenseVoucherPage.tsx [Direct expense recording]               │
│  │   +-- LedgerViewerPage.tsx        [Universal ledger viewer]                │
│  │   +-- BRSPage.tsx                 [Bank reconciliation]                     │
│  │   +-- FinalAccountsPage.tsx       [P&L, Balance Sheet, TB]                 │
│  +-- services/                                                                  │
│  │   +-- accounting.service.ts       [Accounting API calls]                    │
│  │   +-- accounting.types.ts         [Accounting DTOs]                        │
│  +-- state/                                                                     │
│  │   +-- accounting.store.ts         [Accounting state]                        │
│  +-- validators/                                                                │
│      +-- accounting.schema.ts       [Voucher validation]                       │
│                                                                                  │
│  BACKEND (20 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- ledger.controller.ts        [Ledger CRUD]                            │
│  │   +-- voucher.controller.ts       [Voucher handlers]                        │
│  │   +-- brs.controller.ts           [BRS handlers]                            │
│  +-- services/                                                                  │
│  │   +-- ledger.service.ts           [Ledger logic - PUBLIC]                   │
│  │   +-- voucher.service.ts          [Voucher logic]                           │
│  │   +-- accounting.internal.ts      [Balance calculation]                     │
│  +-- repositories/                                                              │
│  │   +-- ledger.repository.ts        [ledger access - INTERNAL]                │
│  │   +-- voucher.repository.ts       [voucher access]                          │
│  +-- routes/                                                                    │
│      +-- accounting.routes.ts       [Accounting endpoints]                     │
│                                                                                  │
│  API CONTRACT (6 files):                                                        │
│  +-- M10-accounting.contract.yaml   [Ledger/Voucher/BRS APIs]                 │
│  +-- M10-wiring-map.json            [M07, M08, M11, M12, M17]               │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- ledger                         [Ledger entries - CANONICAL]               │
│  +-- voucher                        [JV/Expense vouchers]                       │
│  +-- bank_reconciliation            [BRS records]                               │
│  +-- account_master                 [Chart of accounts]                         │
│                                                                                  │
│  PROVIDES: Ledger entries, Voucher posting, BRS, Final accounts                │
│  USES: M04 (Company), M05 (Party), M07/M08 (Invoice data)                     │
│  FORBIDDEN: Direct stock update, Invoice creation, Payment processing           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.11 M11 - PAYMENT & COMMUNICATION

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M11: PAYMENT & COMMUNICATION                                                    │
│ Purpose: Payment Entry, Receipt, Due Tracking, WhatsApp/SMS/Email               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (16 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- PaymentEntryPage.tsx        [Cash/Bank payment voucher]               │
│  │   +-- ReceiptEntryPage.tsx        [Customer receipt]                        │
│  │   +-- DueTrackerPage.tsx          [Outstanding dashboard]                   │
│  │   +-- CommunicationHubPage.tsx    [WhatsApp/SMS/Email center]               │
│  +-- services/                                                                  │
│  │   +-- payment.service.ts         [Payment API calls]                       │
│  │   +-- payment.types.ts           [Payment DTOs]                            │
│  +-- state/                                                                     │
│  │   +-- payment.store.ts           [Payment state]                           │
│  +-- validators/                                                                │
│      +-- payment.schema.ts         [Payment validation]                        │
│                                                                                  │
│  BACKEND (14 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- payment.controller.ts       [Payment CRUD]                           │
│  │   +-- receipt.controller.ts       [Receipt handlers]                        │
│  +-- services/                                                                  │
│  │   +-- payment.service.ts          [Payment logic - PUBLIC]                  │
│  │   +-- payment.internal.ts        [Due calculation]                          │
│  │   +-- communication.service.ts    [WhatsApp/SMS/Email sender]               │
│  +-- repositories/                                                              │
│  │   +-- payment.repository.ts       [payment_master access]                   │
│  +-- routes/                                                                    │
│      +-- payment.routes.ts         [Payment endpoints]                         │
│                                                                                  │
│  API CONTRACT (5 files):                                                        │
│  +-- M11-payment.contract.yaml     [Payment/Receipt/Due APIs]                 │
│  +-- M11-wiring-map.json           [M05, M07, M08, M10, M16]                │
│  +-- events:                                                        │
│      +-- payment.received           [-> M10, M05, M16, Audit]                 │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- payment_master                 [Payment/Receipt records - CANONICAL]      │
│  +-- due_tracker                    [Outstanding balances]                      │
│  +-- communication_log              [WhatsApp/SMS/Email log]                    │
│                                                                                  │
│  PROVIDES: Payment recording, Due tracking, Communication sending              │
│  USES: M05 (Party), M07/M08 (Invoices), M10 (Ledger), M18 (Gateways)          │
│  FORBIDDEN: Direct ledger entry, Invoice modification, Stock update              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.12 M12 - EMPLOYEE & HR

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M12: EMPLOYEE & HR                                                              │
│ Purpose: Employee Master, Attendance, Leave, Salary, Advance                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (18 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- EmployeeDirectoryPage.tsx   [Employee profiles]                       │
│  │   +-- AttendanceTrackerPage.tsx   [Daily attendance grid]                   │
│  │   +-- LeaveOTManagementPage.tsx   [Leave approval + OT log]                │
│  │   +-- SalaryProcessingPage.tsx     [Monthly payroll compiler]               │
│  │   +-- AdvanceLoanPage.tsx         [Staff advance + recovery]                │
│  +-- services/                                                                  │
│  │   +-- hr.service.ts               [HR API calls]                           │
│  │   +-- hr.types.ts                 [HR DTOs]                                │
│  +-- state/                                                                     │
│  │   +-- hr.store.ts                 [HR state]                               │
│  +-- validators/                                                                │
│      +-- hr.schema.ts               [Employee/Attendance validation]           │
│                                                                                  │
│  BACKEND (16 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- employee.controller.ts      [Employee CRUD]                          │
│  │   +-- attendance.controller.ts    [Attendance handlers]                     │
│  │   +-- salary.controller.ts        [Salary handlers]                         │
│  +-- services/                                                                  │
│  │   +-- employee.service.ts         [Employee logic]                          │
│  │   +-- salary.service.ts           [Salary calculation - PUBLIC]             │
│  │   +-- hr.internal.ts              [Payroll engine]                          │
│  +-- repositories/                                                              │
│  │   +-- employee.repository.ts      [employee_master access]                  │
│  │   +-- attendance.repository.ts    [attendance access]                       │
│  +-- routes/                                                                    │
│      +-- hr.routes.ts               [HR endpoints]                             │
│                                                                                  │
│  API CONTRACT (5 files):                                                        │
│  +-- M12-hr.contract.yaml          [Employee/Attendance/Salary APIs]          │
│  +-- M12-wiring-map.json           [M10, M11, M17]                          │
│  +-- events:                                                        │
│      +-- employee.salary.processed  [-> M10, M11, M16]                      │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- employee_master                [Employee records - CANONICAL]             │
│  +-- attendance_record              [Daily attendance]                          │
│  +-- leave_record                   [Leave applications]                        │
│  +-- salary_record                  [Monthly salary]                            │
│  +-- advance_record                 [Staff advances]                            │
│                                                                                  │
│  PROVIDES: Employee data, Attendance, Salary calculation, Advance tracking     │
│  USES: M04 (Company), M10 (Ledger), M11 (Payment)                             │
│  FORBIDDEN: Direct ledger entry, Direct payment, Invoice data                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.13 M13 - SMART AUTOMATION

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M13: SMART AUTOMATION                                                           │
│ Purpose: Scheduled tasks, Payment reminders, Stock alerts, Compliance alerts    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (12 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- SchedulerPage.tsx           [Automated tasks engine]                  │
│  │   +-- PaymentRemindersPage.tsx    [Reminder configuration]                  │
│  │   +-- StockAlertWorkflowPage.tsx   [Alert rules setup]                      │
│  │   +-- NotificationCenterPage.tsx   [Actionable notification panel]          │
│  +-- services/                                                                  │
│  │   +-- automation.service.ts       [Automation API calls]                    │
│  │   +-- automation.types.ts        [Automation DTOs]                          │
│  +-- state/                                                                     │
│      +-- automation.store.ts        [Automation state]                         │
│                                                                                  │
│  BACKEND (14 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- automation.controller.ts    [Automation CRUD]                         │
│  │   +-- scheduler.controller.ts     [Job scheduling handlers]                 │
│  +-- services/                                                                  │
│  │   +-- automation.service.ts       [Automation logic - PUBLIC]               │
│  │   +-- scheduler.service.ts        [Job runner]                              │
│  │   +-- automation.internal.ts      [Rule engine]                             │
│  +-- repositories/                                                              │
│  │   +-- automation.repository.ts    [automation_rule access]                  │
│  +-- routes/                                                                    │
│      +-- automation.routes.ts       [Automation endpoints]                     │
│                                                                                  │
│  API CONTRACT (4 files):                                                        │
│  +-- M13-automation.contract.yaml   [Scheduler/Alert/Reminder APIs]            │
│  +-- M13-wiring-map.json            [M06, M09, M11, M16]                    │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- automation_rule                [Trigger conditions + actions]             │
│  +-- scheduled_job                  [Job definitions + schedules]              │
│  +-- job_execution_log              [Job run history]                           │
│                                                                                  │
│  PROVIDES: Automation rules, Scheduled jobs, Alert generation                  │
│  USES: M06 (Stock), M09 (GST), M11 (Payment), M16 (Notification)              │
│  FORBIDDEN: Direct financial posting, Direct stock modification                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.14 M14 - IMPORT & EXPORT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M14: IMPORT & EXPORT                                                            │
│ Purpose: Excel/CSV Import, Validation, Export, History Logs                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (10 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- DataImportPage.tsx          [Bulk importer + column mapping]          │
│  │   +-- PreImportInspectorPage.tsx   [Validation scan engine]                 │
│  │   +-- DataExportPage.tsx          [Multi-format exporter]                   │
│  │   +-- ImportHistoryPage.tsx       [Historical logs + error reports]         │
│  +-- services/                                                                  │
│  │   +-- importExport.service.ts     [Import/Export API calls]                │
│  │   +-- importExport.types.ts       [Import/Export DTOs]                    │
│  +-- state/                                                                     │
│      +-- importExport.store.ts      [Import/Export state]                      │
│                                                                                  │
│  BACKEND (10 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- import.controller.ts        [Import handlers]                         │
│  │   +-- export.controller.ts        [Export handlers]                         │
│  +-- services/                                                                  │
│  │   +-- import.service.ts           [Import logic - PUBLIC]                   │
│  │   +-- export.service.ts           [Export logic]                            │
│  +-- repositories/                                                              │
│  │   +-- import.repository.ts        [import_job access]                       │
│  +-- routes/                                                                    │
│      +-- importExport.routes.ts     [Import/Export endpoints]                  │
│                                                                                  │
│  API CONTRACT (4 files):                                                        │
│  +-- M14-import-export.contract.yaml [Import/Export APIs]                     │
│  +-- M14-wiring-map.json            [M05, M06, M07, M08]                    │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- import_job                     [Import job records]                        │
│  +-- export_job                     [Export job records]                        │
│  +-- import_error_log               [Row-by-row error logs]                     │
│                                                                                  │
│  PROVIDES: Bulk import, Export, Validation, Error reporting                    │
│  USES: M05 (Party), M06 (Product), M07/M08 (Transactions)                     │
│  FORBIDDEN: Direct DB insert without validation, Bypassing business rules       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 7.15 M15 - DATA STORAGE & SYNC

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M15: DATA STORAGE & SYNC                                                        │
│ Purpose: Sync Monitor, Backup Engine, Restore, Conflict Resolution              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (10 files):                                                           │
│  +-- pages/                                                                     │
│  │   +-- SyncMonitorPage.tsx         [Real-time sync status dashboard]        │
│  │   +-- BackupEnginePage.tsx        [1-click backup + cloud schedule]        │
│  │   +-- RestoreConflictPage.tsx     [Conflict resolution hub]                 │
│  +-- services/                                                                  │
│  │   +-- sync.service.ts             [Sync API calls]                         │
│  │   +-- sync.types.ts               [Sync DTOs]                             │
│  +-- state/                                                                     │
│      +-- sync.store.ts              [Sync state]                               │
│                                                                                  │
│  BACKEND (12 files):                                                            │
│  +-- controllers/                                                               │
│  │   +-- sync.controller.ts          [Sync CRUD]                              │
│  │   +-- backup.controller.ts        [Backup handlers]                         │
│  +-- services/                                                                  │
│  │   +-- sync.service.ts             [Sync logic - PUBLIC]                     │
│  │   +-- sync.internal.ts           [Queue management]                         │
│  │   +-- backup.service.ts           [Backup engine]                           │
│  +-- repositories/                                                              │
│  │   +-- sync.repository.ts          [sync_queue access]                       │
│  +-- routes/                                                                    │
│      +-- sync.routes.ts             [Sync endpoints]                           │
│                                                                                  │
│  API CONTRACT (4 files):                                                        │
│  +-- M15-sync.contract.yaml         [Sync/Backup/Restore APIs]                │
│  +-- M15-wiring-map.json            [ALL MODULES]                           │
│                                                                                  │
│  DATABASE (Owner):                                                              │
│  +-- sync_queue                     [Pending sync records]                      │
│  +-- backup_record                  [Backup history]                            │
│  +-- conflict_record                [Detected conflicts]                        │
│                                                                                  │
│  PROVIDES: Sync queue, Backup, Restore, Conflict detection                     │
│  USES: ALL MODULES (data layer)                                               │
│  FORBIDDEN: Direct business logic, Financial calculations, Stock valuation      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

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

## 7.20 M20 - INTERNATIONAL TRADE & 8-DIGIT HSN ENGINE

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ M20: INTERNATIONAL TRADE & 8-DIGIT HSN ENGINE                                   │
│ Purpose: International import/export, 8-digit HSN, FX, Customs, trade docs     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ FRONTEND (14 files)                                                             │
│ +-- pages/                                                                      │
│ │   +-- InternationalTradeDashboardPage.tsx                                    │
│ │   +-- ExportShipmentPage.tsx                                                 │
│ │   +-- ImportShipmentPage.tsx                                                 │
│ │   +-- HSNCodeSearchPage.tsx                                                  │
│ │   +-- HSNClassificationPage.tsx                                              │
│ │   +-- ForeignExchangePage.tsx                                                │
│ │   +-- CustomsDutyPage.tsx                                                    │
│ │   +-- TradeDocumentsPage.tsx                                                │
│ │   +-- ExportDocumentPreviewPage.tsx                                         │
│ +-- services/                                                                  │
│ │   +-- internationalTrade.service.ts                                         │
│ │   +-- internationalTrade.types.ts                                           │
│ +-- state/                                                                     │
│ │   +-- internationalTrade.store.ts                                           │
│ +-- validators/                                                                │
│     +-- internationalTrade.schema.ts                                          │
│                                                                                 │
│ BACKEND (16 files)                                                             │
│ +-- controllers/                                                               │
│ │   +-- trade.controller.ts                                                   │
│ │   +-- hsn.controller.ts                                                     │
│ │   +-- customs.controller.ts                                                 │
│ +-- services/                                                                  │
│ │   +-- trade.service.ts                                                      │
│ │   +-- hsn.service.ts                                                        │
│ │   +-- fx.service.ts                                                         │
│ │   +-- customs.service.ts                                                    │
│ │   +-- trade-document.service.ts                                             │
│ │   +-- trade.internal.ts                                                     │
│ +-- repositories/                                                              │
│ │   +-- hsn.repository.ts                                                     │
│ │   +-- trade.repository.ts                                                   │
│ │   +-- fx.repository.ts                                                      │
│ │   +-- customs.repository.ts                                                 │
│ +-- models/                                                                    │
│ │   +-- trade.model.ts                                                        │
│ │   +-- hsn.model.ts                                                          │
│ +-- validators/                                                                │
│ │   +-- trade.schema.ts                                                       │
│ +-- routes/                                                                    │
│ │   +-- trade.routes.ts                                                       │
│ +-- events/                                                                    │
│     +-- trade.events.ts                                                       │
│     +-- trade.handlers.ts                                                     │
│                                                                                 │
│ API CONTRACT (6 files)                                                         │
│ +-- M20-international-trade-hsn.contract.yaml                                 │
│ +-- M20-hsn.contract.yaml                                                     │
│ +-- M20-customs.contract.yaml                                                 │
│ +-- M20-fx.contract.yaml                                                      │
│ +-- M20-document.contract.yaml                                                │
│ +-- M20-wiring-map.json                                                       │
│                                                                                 │
│ DATABASE (OWNER)                                                               │
│ +-- hsn_master                         [8-digit HSN canonical definition]      │
│ +-- trade_job                          [Import/Export transactions]             │
│ +-- fx_rate                            [Foreign-exchange rate snapshots]       │
│ +-- customs_rule                       [Customs duty rules/configuration]       │
│ +-- trade_document                     [Generated BOE/export documents]        │
│                                                                                 │
│ PROVIDES                                                                        │
│ +-- 8-digit HSN classification and validation                                  │
│ +-- International import/export workflow                                       │
│ +-- USD/EUR and other supported FX calculations                               │
│ +-- Customs-duty calculation                                                   │
│ +-- Bill of Entry / export-document generation                                │
│                                                                                 │
│ USES                                                                            │
│ +-- M05 Party                                                                   │
│ +-- M06 Inventory/Product                                                      │
│ +-- M07/M08 Purchase/Sales references                                          │
│ +-- M09 GST & Compliance                                                       │
│ +-- M10 Accounting                                                             │
│ +-- M11 Payment                                                                │
│ +-- M18 External Integration                                                   │
│                                                                                 │
│ FORBIDDEN                                                                       │
│ +-- Duplicate Product Master                                                   │
│ +-- Duplicate Party Master                                                     │
│ +-- Direct writes into other module-owned tables                               │
│ +-- Bypassing GST/security/business validation                                 │
│ +-- Unverified HSN classification                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```


## 7.21 MANDATORY FEATURE-TO-MODULE ALLOCATION

```text
SMART PURCHASE BILL OCR
  Owner: M07 Purchase Management
  Placement:
    frontend/src/modules/m07-purchase/
    backend/src/modules/m07-purchase/
    api-contracts/v1/M07-purchase.contract.yaml
    wiring-maps/module-wiring/M07-wiring-map.json
  Rule: OCR proposes data; validation/approval is mandatory before posting.

AUTO-STOCK ALERT + PURCHASE ORDER
  Owner: M13 Smart Automation + M07 Purchase
  Placement: M13 automation files + M07 purchase-order files.
  Wiring: M06 stock event -> M13 rule engine -> M07 purchase-order draft.
  Rule: automation may prepare; M07 remains owner of purchase orders.

BARCODE / QR TRACKING
  Owner: M06 Inventory Management
  Placement: frontend/backend M06 barcode/QR scan services, controllers,
             validators and pages.
  Rule: Product/Stock Master remains single-source in M06.

GST + HSN SECURITY LOCK
  Owner: M09 GST & Compliance
  HSN reference: M06 Product Master + M20 international 8-digit HSN engine.
  Rule: invalid GST/HSN/tax data BLOCKS invoice/transaction progression.

DUAL BACKUP
  Owner: M15 Data Storage & Sync
  Placement: M15 backup service/controller/page + backup contract/wiring.
  Rule: local + cloud backup status is auditable and recovery-tested.

OFFLINE-FIRST + AUTO SYNC
  Owner: M15 Data Storage & Sync
  Placement: M15 sync queue/service/controller/conflict-resolution files.
  Wiring: M15 -> All Modules through the controlled sync contract.
  Rule: offline writes enter queue; online state triggers controlled sync.

INTERNATIONAL TRADE + 8-DIGIT HSN
  Owner: M20
  Placement: all M20 frontend/backend/API/database/test files in Section 7.20.
  Wiring: M20 -> M05/M06/M07/M08/M09/M10/M11/M18.
  Rule: M20 owns international-trade workflow and hsn_master only.

SECOND-STAGE FEATURES
  Real-Time Collaboration: M15 + M18 controlled collaboration layer.
  Executive BI Dashboard: M17 Reporting.
  Workflow Approval Engine: M13 Automation + module-owned approval contracts.
  Advanced Search: common search foundation + module public search contracts.
  Activation: only after M01-M20 are locked and integration audit passes.
```


---

# 8. DATABASE SCHEMA MAP

## 8.1 Canonical Entity Ownership

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE OWNERSHIP MAP                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  M02 (Core)                                                                     │
│  +-- user_master                    [User accounts]                             │
│  +-- role_master                    [Role definitions]                          │
│  +-- permission_master              [Permission definitions]                    │
│  +-- user_role                      [User-Role mapping]                         │
│                                                                                  │
│  M03 (Device)                                                                   │
│  +-- device_registry                [Registered devices]                        │
│  +-- active_session                 [Session tracking]                          │
│                                                                                  │
│  M04 (Company)                                                                  │
│  +-- company_master                 [Company definition - ROOT ENTITY]         │
│  +-- branch_master                  [Branch/Godown]                             │
│  +-- financial_year                 [FY periods]                                │
│                                                                                  │
│  M05 (Party)                                                                    │
│  +-- party_master                   [Customer/Supplier - CANONICAL]            │
│  +-- party_ledger_view              [Running balance]                           │
│                                                                                  │
│  M06 (Inventory)                                                                │
│  +-- product_master                 [Product definition - CANONICAL]           │
│  +-- category_master                [Category tree]                             │
│  +-- stock_master                   [Stock quantity per branch]                │
│  +-- stock_movement                 [Every stock change - AUDIT TRAIL]         │
│  +-- batch_master                   [Batch tracking]                            │
│  +-- serial_master                  [Serial number tracking]                    │
│                                                                                  │
│  M07 (Purchase)                                                                 │
│  +-- purchase_order                 [PO master]                                 │
│  +-- purchase_invoice               [Purchase bill - CANONICAL]                │
│  +-- purchase_invoice_item          [Line items]                                │
│  +-- purchase_return                [Return/Debit notes]                        │
│                                                                                  │
│  M08 (Sales)                                                                    │
│  +-- quotation                      [Price estimates]                           │
│  +-- sales_order                    [Confirmed orders]                          │
│  +-- sales_invoice                  [Sales bill - CANONICAL]                   │
│  +-- sales_invoice_item             [Line items]                                │
│  +-- sales_return                   [Return/Credit notes]                       │
│  +-- delivery_challan               [Dispatch notes]                            │
│                                                                                  │
│  M09 (GST)                                                                      │
│  +-- hsn_master                     [HSN/SAC codes]                             │
│  +-- tax_rate_master                [CGST/SGST/IGST rates]                      │
│  +-- gst_transaction                [GST records - CANONICAL]                  │
│  +-- e_invoice_record               [IRN/QR data]                              │
│  +-- e_way_bill_record              [E-Way Bill data]                          │
│                                                                                  │
│  M10 (Accounting)                                                               │
│  +-- ledger                         [Ledger entries - CANONICAL]               │
│  +-- voucher                        [JV/Expense vouchers]                       │
│  +-- bank_reconciliation            [BRS records]                               │
│  +-- account_master                 [Chart of accounts]                         │
│                                                                                  │
│  M11 (Payment)                                                                  │
│  +-- payment_master                 [Payment/Receipt - CANONICAL]              │
│  +-- due_tracker                    [Outstanding balances]                      │
│  +-- communication_log              [WhatsApp/SMS/Email log]                    │
│                                                                                  │
│  M12 (HR)                                                                       │
│  +-- employee_master                [Employee records - CANONICAL]             │
│  +-- attendance_record              [Daily attendance]                          │
│  +-- leave_record                   [Leave applications]                        │
│  +-- salary_record                  [Monthly salary]                            │
│  +-- advance_record                 [Staff advances]                            │
│                                                                                  │
│  M13 (Automation)                                                               │
│  +-- automation_rule                [Trigger conditions + actions]             │
│  +-- scheduled_job                  [Job definitions]                           │
│  +-- job_execution_log              [Job run history]                           │
│                                                                                  │
│  M14 (Import/Export)                                                            │
│  +-- import_job                     [Import job records]                        │
│  +-- export_job                     [Export job records]                        │
│  +-- import_error_log               [Row-by-row error logs]                     │
│                                                                                  │
│  M15 (Sync)                                                                     │
│  +-- sync_queue                     [Pending sync records]                      │
│  +-- backup_record                  [Backup history]                            │
│  +-- conflict_record                [Detected conflicts]                        │
│                                                                                  │
│  M16 (Notification)                                                             │
│  +-- notification_master            [Notification records - CANONICAL]         │
│  +-- notification_delivery_log      [Sent/Delivered/Failed log]                │
│                                                                                  │
│  M17 (Reporting)                                                                │
│  +-- report_config                  [Saved configurations]                      │
│  +-- report_template                [Report layouts]                            │
│                                                                                  │
│  M18 (Integration)                                                              │
│  +-- integration_config             [Gateway configurations]                    │
│  +-- api_key_registry               [Generated API keys]                        │
│  +-- webhook_log                    [Webhook delivery log]                      │
│                                                                                  │
│  M19 (Audit/Security)                                                           │
│  +-- audit_log                      [CRUD actions - APPEND ONLY]               │
│  +-- login_history                  [Login attempts]                            │
│  +-- security_event                 [Security alerts]                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 8.2 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIP FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  company_master (M04)                                                           │
│       │                                                                         │
│       +---> branch_master (M04)                                                 │
│       │                                                                         │
│       +---> user_master (M02)                                                   │
│       │       +---> user_role (M02)                                             │
│       │       │       +---> role_master (M02)                                   │
│       │       │               +---> permission_master (M02)                     │
│       │                                                                         │
│       +---> party_master (M05)                                                  │
│       │       +---> purchase_invoice (M07)                                      │
│       │       │       +---> purchase_invoice_item (M07)                         │
│       │       │               +---> product_master (M06)                        │
│       │       │                       +---> category_master (M06)               │
│       │       │                       +---> stock_master (M06)                  │
│       │       │                       +---> batch_master (M06)                  │
│       │       │                       +---> serial_master (M06)                 │
│       │       │                                                                 │
│       │       +---> sales_invoice (M08)                                         │
│       │       │       +---> sales_invoice_item (M08)                            │
│       │       │               +---> product_master (M06)                        │
│       │       │                                                                 │
│       │       +---> payment_master (M11)                                        │
│       │               +---> ledger (M10)                                        │
│       │                                                                         │
│       +---> employee_master (M12)                                               │
│       │       +---> attendance_record (M12)                                     │
│       │       +---> salary_record (M12)                                         │
│       │       +---> advance_record (M12)                                        │
│       │                                                                         │
│       +---> gst_transaction (M09)                                               │
│       │       +---> hsn_master (M09)                                            │
│       │       +---> tax_rate_master (M09)                                       │
│       │                                                                         │
│       +---> ledger (M10)                                                        │
│       │       +---> account_master (M10)                                        │
│       │       +---> voucher (M10)                                               │
│       │                                                                         │
│       +---> audit_log (M19)                                                     │
│               +---> login_history (M19)                                         │
│                                                                                  │
│  [Every table has:]                                                             │
│       +-- company_id (Multi-tenant isolation)                                   │
│       +-- created_at, updated_at (Timestamps)                                   │
│       +-- Soft delete for financial data (status/void)                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 9. SECURITY LAYER MAP

## 9.1 Security Architecture Stack

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LAYER 1: PERIMETER SECURITY                                                     │
│  +-- HTTPS/TLS (All API calls encrypted)                                        │
│  +-- Rate Limiter (Brute-force protection)                                      │
│  +-- CORS Policy (Cross-origin control)                                         │
│                                                                                  │
│  LAYER 2: AUTHENTICATION                                                         │
│  +-- JWT RS256 (Stateless tokens)                                               │
│  +-- Access Token (Short-lived: 15 min)                                         │
│  +-- Refresh Token (Long-lived: 7 days)                                         │
│  +-- OTP Verification (New device/High-risk action)                             │
│                                                                                  │
│  LAYER 3: AUTHORIZATION                                                          │
│  +-- RBAC (Role-Based Access Control)                                           │
│  +-- Permission Matrix (Role x Module x Action)                                 │
│  +-- Company Context (Multi-tenant isolation)                                   │
│  +-- Branch Context (Branch-level restriction)                                  │
│                                                                                  │
│  LAYER 4: DATA PROTECTION                                                        │
│  +-- Password Hashing (bcrypt, cost=12)                                         │
│  +-- PII Encryption (AES-256-GCM at rest)                                       │
│  +-- Bank Detail Masking (Last 4 digits only)                                   │
│  +-- Document Signed URLs (Time-limited access)                                 │
│  +-- Local Cache Encryption (Mobile device security)                            │
│                                                                                  │
│  LAYER 5: AUDIT & MONITORING                                                     │
│  +-- Audit Log (Append-only, tamper-resistant)                                  │
│  +-- Login History (IP, Device fingerprint)                                     │
│  +-- Security Events (Failed attempts, anomalies)                               │
│  +-- Request Tracing (Correlation ID across all layers)                         │
│                                                                                  │
│  LAYER 6: FRONTEND SECURITY (UX Only)                                            │
│  +-- Permission-Based UI (Hide/Disable unauthorized actions)                    │
│  +-- Sensitive Data Masking (PAN, Bank, Password)                               │
│  +-- Session Timeout Warning (Auto-logout + Draft save)                         │
│  +-- No Sensitive Data in Logs (Console sanitization)                           │
│  +-- Screenshot Block (Payment/OTP screens on Android)                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 9.2 Authorization Check Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  AUTHORIZATION DECISION FLOW                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  User Request                                                                    │
│       │                                                                         │
│       +---> auth-middleware.ts                                                  │
│       │       +---> Verify JWT signature                                        │
│       │       +---> Check token expiry                                          │
│       │       +---> Extract: user_id, role_id                                   │
│       │                                                                         │
│       +---> tenant-middleware.ts                                                │
│       │       +---> Extract: X-Company-Id header                                │
│       │       +---> Verify user belongs to company                              │
│       │       +---> Extract: X-Branch-Id header                                 │
│       │       +---> Verify branch access                                        │
│       │                                                                         │
│       +---> permission-check.ts                                                 │
│       │       +---> Query: role_master + permission_master                      │
│       │       +---> Check: role.permissions[module][resource][action]           │
│       │       +---> IF permission == FALSE -> 403 Forbidden                     │
│       │       +---> IF permission == TRUE -> Continue                           │
│       │                                                                         │
│       +---> access-control.ts                                                   │
│       │       +---> Check: Company + Branch + Resource + Action                 │
│       │       +---> IF mismatch -> 403 Forbidden                                │
│       │       +---> IF match -> ALLOW = TRUE                                    │
│       │                                                                         │
│       +---> Controller/Service executes                                         │
│       │                                                                         │
│       +---> audit-logger.ts                                                     │
│               +---> Record: user, action, resource, result, timestamp           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 10. CROSS-MODULE INTEGRATION FLOWS

## 10.1 Sales Invoice Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FLOW: SALES INVOICE CREATION (End-to-End)                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  STEP 1: USER ACTION                                                             │
│  +-- User clicks "Create Invoice" on SalesInvoicePage.tsx (M08 Frontend)       │
│                                                                                  │
│  STEP 2: FRONTEND VALIDATION                                                     │
│  +-- sales.schema.ts (Zod) validates input                                      │
│  +-- api-client.ts sends POST /api/v1/sales/invoice                             │
│                                                                                  │
│  STEP 3: BACKEND ENTRY                                                           │
│  +-- auth-middleware -> Verify JWT                                              │
│  +-- tenant-middleware -> Set company/branch context                            │
│  +-- validation-middleware -> Validate payload                                  │
│  +-- sales.controller.ts -> createInvoiceHandler()                              │
│                                                                                  │
│  STEP 4: BUSINESS LOGIC                                                          │
│  +-- sales.service.ts -> createInvoice()                                        │
│  +-- Calls: stock.service.ts (M06) -> checkAvailability()                       │
│  +-- Calls: party.service.ts (M05) -> checkCreditLimit()                        │
│  +-- Calls: gst.service.ts (M09) -> calculateTax()                              │
│  +-- Calls: central-transaction-engine -> validateTransaction()                  │
│                                                                                  │
│  STEP 5: DATABASE WRITE                                                          │
│  +-- sales.repository.ts -> tx.sales_invoice.create()                           │
│  +-- sales.repository.ts -> tx.sales_invoice_item.createMany()                  │
│  +-- Returns: Invoice Record                                                    │
│                                                                                  │
│  STEP 6: EVENT PUBLISHING (Async)                                                │
│  +-- event-bus.ts -> publish("sales.invoice.created", payload)                  │
│                                                                                  │
│  STEP 7: EVENT CONSUMERS (Parallel)                                              │
│  +-- M06 (Inventory): stock.handlers.ts -> deductStock()                        │
│  +-- M09 (GST): gst.handlers.ts -> recordOutputTax()                            │
│  +-- M10 (Accounting): ledger.handlers.ts -> createEntries()                    │
│  +-- M11 (Payment): due.handlers.ts -> createDue()                              │
│  +-- M16 (Notification): notification.handlers.ts -> sendInvoiceNotification()  │
│  +-- M17 (Reporting): report.handlers.ts -> updateSalesReport()                 │
│  +-- M19 (Audit): audit-logger.ts -> logAction()                                │
│                                                                                  │
│  STEP 8: RESPONSE                                                                │
│  +-- Returns: { success: true, data: invoice, meta: {request_id, timestamp} }   │
│  +-- Frontend: Toast success + State update + Redirect                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 10.2 Purchase Invoice Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FLOW: PURCHASE INVOICE CREATION (End-to-End)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  STEP 1: USER ACTION                                                             │
│  +-- User enters supplier bill on PurchaseEntryPage.tsx (M07 Frontend)         │
│                                                                                  │
│  STEP 2: FRONTEND -> BACKEND                                                     │
│  +-- purchase.service.ts -> createPurchaseInvoice()                             │
│  +-- POST /api/v1/purchase/invoice                                              │
│                                                                                  │
│  STEP 3: BACKEND LOGIC                                                           │
│  +-- purchase.service.ts -> validate + calculate                                │
│  +-- Calls: stock.service.ts (M06) -> addStock()                                │
│  +-- Calls: gst.service.ts (M09) -> calculateInputTax()                         │
│  +-- Calls: central-transaction-engine -> validateTransaction()                  │
│                                                                                  │
│  STEP 4: DATABASE                                                                │
│  +-- purchase_invoice + purchase_invoice_item (M07)                             │
│                                                                                  │
│  STEP 5: EVENTS                                                                  │
│  +-- publish("purchase.invoice.approved")                                       │
│  +-- M06: Stock increase                                                        │
│  +-- M09: Input GST credit                                                      │
│  +-- M10: Purchase ledger entry                                                 │
│  +-- M11: Supplier payable created                                              │
│  +-- M16: Notification to admin                                                 │
│  +-- M19: Audit log                                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 10.3 Payment Allocation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FLOW: CUSTOMER PAYMENT RECEIPT (End-to-End)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  STEP 1: USER ACTION                                                             │
│  +-- User records payment on CustomerReceiptPage.tsx (M08 -> M11 Frontend)     │
│                                                                                  │
│  STEP 2: BACKEND LOGIC                                                           │
│  +-- payment.service.ts (M11) -> createReceipt()                                │
│  +-- Calls: ledger.service.ts (M10) -> createPaymentEntry()                     │
│  +-- Calls: party.service.ts (M05) -> updateOutstanding()                       │
│  +-- Calls: invoice.service.ts (M08) -> updatePaymentStatus()                   │
│                                                                                  │
│  STEP 3: EVENTS                                                                  │
│  +-- publish("payment.received")                                                │
│  +-- M10: Ledger updated                                                        │
│  +-- M05: Outstanding recalculated                                              │
│  +-- M08: Invoice status -> "paid/partial"                                      │
│  +-- M16: Receipt notification to customer                                      │
│  +-- M19: Audit log                                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 10.4 Salary Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FLOW: EMPLOYEE SALARY PROCESSING (End-to-End)                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  STEP 1: TRIGGER                                                                 │
│  +-- Scheduler (M13) -> "Monthly salary job" runs                               │
│  +-- OR User triggers from SalaryProcessingPage.tsx (M12 Frontend)              │
│                                                                                  │
│  STEP 2: CALCULATION                                                             │
│  +-- salary.service.ts (M12) -> calculateSalary()                               │
│  +-- Input: attendance_record + advance_record                                  │
│  +-- Output: salary_record with deductions                                       │
│                                                                                  │
│  STEP 3: ACCOUNTING                                                              │
│  +-- Calls: ledger.service.ts (M10) -> createSalaryExpense()                    │
│  +-- Calls: payment.service.ts (M11) -> processSalaryPayment()                  │
│                                                                                  │
│  STEP 4: EVENTS                                                                  │
│  +-- publish("employee.salary.processed")                                       │
│  +-- M10: Salary expense ledger entry                                           │
│  +-- M11: Salary payment record                                                 │
│  +-- M16: Payslip notification to employee                                      │
│  +-- M17: Payroll report update                                                 │
│  +-- M19: Audit log                                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 11. OFFLINE/SYNC ARCHITECTURE MAP

## 11.1 Offline-First Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OFFLINE-FIRST ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  DEVICE (Mobile/Tablet/Desktop)                                                  │
│       │                                                                         │
│       +---> Local SQLite/IndexedDB                                              │
│       │       +---> Cached product list (recent 1000)                           │
│       │       +---> Cached party list (recent 500)                              │
│       │       +---> Offline transactions (pending sync)                         │
│       │       +---> Encrypted (AES-256-GCM)                                   │
│       │                                                                         │
│       +---> Sync Queue (Local)                                                  │
│       │       +---> Entry: {entity, operation, payload, status: pending}       │
│       │       +---> FIFO ordering (per-entity)                                  │
│       │       +---> Retry count + last error                                    │
│       │                                                                         │
│       +---> Offline Banner (UI)                                                 │
│       │       +---> "Working Offline" indicator                                 │
│       │       +---> Pending count display                                       │
│       │       +---> Last synced time                                            │
│       │                                                                         │
│       +---> Optimistic UI                                                       │
│               +---> Show success immediately                                    │
│               +---> Queue for background sync                                   │
│                                                                                  │
│  NETWORK AVAILABLE                                                               │
│       │                                                                         │
│       +---> Sync Engine (Background)                                            │
│       │       +---> Read sync_queue (FIFO)                                      │
│       │       +---> Send to server with idempotency key                         │
│       │       +---> Server validates (same rules as online)                     │
│       │       +---> Server responds: success / conflict / error                 │
│       │                                                                         │
│       +---> Conflict Resolution                                                  │
│       │       +---> Financial data: NEVER last-write-wins                       │
│       │       +---> Same record conflict: Admin notification + manual review    │
│       │       +---> Stock conflict: Addition (not overwrite)                    │
│       │       +---> Non-critical: Simple merge / last-write-wins                │
│       │                                                                         │
│       +---> Data Consistency                                                     │
│               +---> Server = Source of Truth                                    │
│               +---> Checksum verification post-sync                               │
│               +---> Local cache updates from server                               │
│               +---> No orphan records (all pending tracked)                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 11.2 Sync Queue Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SYNC QUEUE ENTRY                                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  {                                                                              │
│    "id": "uuid",                    [Unique ID]                                 │
│    "device_id": "device-001",       [Source device]                             │
│    "entity_type": "sales_invoice",  [Target entity]                             │
│    "entity_id": "inv-123",          [Local entity ID]                           │
│    "operation": "create",           [create/update/delete]                      │
│    "payload": { ... },              [Full record data]                          │
│    "status": "pending",             [pending/syncing/synced/failed/conflict]   │
│    "created_at": "2026-08-21T18:30:00Z",                                        │
│    "attempt_count": 0,              [Retry counter]                             │
│    "last_error": null,              [Error message]                             │
│    "idempotency_key": "key-123"     [Prevent duplicate]                         │
│  }                                                                              │
│                                                                                  │
│  PRIORITY RULES:                                                                │
│  +-- Critical financial: HIGH priority (sync first)                             │
│  +-- UI preferences: LOW priority (sync last)                                   │
│  +-- Exponential backoff on failure                                             │
│  +-- Max retries: 5, then admin notification                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 12. TESTING & PRODUCTION MAP

## 12.1 Testing Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TESTING LAYERS (Bottom to Top)                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LAYER 1: UNIT TESTS                                                             │
│  +-- GST calculation function                                                   │
│  +-- Discount calculation                                                       │
│  +-- Rounding logic                                                             │
│  +-- Date formatting                                                            │
│  +-- File count: ~50 tests                                                      │
│                                                                                  │
│  LAYER 2: MODULE TESTS                                                           │
│  +-- Product creation validation                                                │
│  +-- Customer credit limit check                                                │
│  +-- Invoice total calculation                                                  │
│  +-- File count: ~40 tests                                                      │
│                                                                                  │
│  LAYER 3: INTEGRATION TESTS                                                      │
│  +-- Sales Invoice -> Stock deduction -> Ledger update                          │
│  +-- Purchase Invoice -> Stock increase -> GST input                            │
│  +-- Payment -> Ledger -> Outstanding update                                    │
│  +-- File count: ~30 tests                                                      │
│                                                                                  │
│  LAYER 4: TRANSACTION TESTS                                                      │
│  +-- Failure rollback (no partial data)                                         │
│  +-- Concurrent transaction handling                                            │
│  +-- File count: ~15 tests                                                      │
│                                                                                  │
│  LAYER 5: SECURITY TESTS                                                         │
│  +-- Frontend permission bypass (API direct call)                               │
│  +-- Cross-company data access attempt                                          │
│  +-- SQL injection attempt                                                      │
│  +-- Brute-force login attempt                                                  │
│  +-- File count: ~12 tests                                                      │
│                                                                                  │
│  LAYER 6: OFFLINE/SYNC TESTS                                                     │
│  +-- Two-device conflicting stock update                                        │
│  +-- Sync queue FIFO ordering                                                   │
│  +-- Conflict resolution accuracy                                               │
│  +-- File count: ~10 tests                                                      │
│                                                                                  │
│  LAYER 7: DEVICE TESTS                                                           │
│  +-- Mobile barcode scan -> billing flow                                        │
│  +-- Desktop bulk import flow                                                   │
│  +-- Tablet split-view functionality                                            │
│  +-- File count: ~8 tests                                                       │
│                                                                                  │
│  LAYER 8: PERFORMANCE TESTS                                                      │
│  +-- 10,000 products search response time                                       │
│  +-- Concurrent billing sessions (N users)                                      │
│  +-- Mobile cold-start time                                                     │
│  +-- File count: ~6 tests                                                       │
│                                                                                  │
│  LAYER 9: PRODUCTION TESTS                                                       │
│  +-- Production config verification                                             │
│  +-- Environment variables check                                                │
│  +-- Monitoring alert verification                                              │
│  +-- File count: ~5 tests                                                       │
│                                                                                  │
│  TOTAL TEST FILES: 156                                                          │
│  TOTAL TEST CASES: ~400+                                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 12.2 Production Readiness Checklist

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PRODUCTION READINESS CHECKLIST (Per Module)                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [ ] Feature Created + Implemented (code complete)                              │
│  [ ] Database Connected (schema canonical, migrations applied)                  │
│  [ ] Integrated with all dependent modules                                       │
│  [ ] Central Transaction Engine verified (financial/stock impact)               │
│  [ ] API Contract standard compliant                                             │
│  [ ] Security verified (Permission, Session, Data Protection)                   │
│  [ ] Offline/Sync tested (conflict resolution verified)                         │
│  [ ] Automation rules deterministic + auditable                                 │
│  [ ] UI/UX consistent across all target devices                                  │
│  [ ] Unit + Module + Integration + Transaction + Security tests PASS            │
│  [ ] Audit logging working on all critical actions                               │
│  [ ] Backup/Restore tested for this feature's data                               │
│  [ ] Documentation (blueprint sections) updated                                  │
│  [ ] Rollback plan ready                                                         │
│                                                                                  │
│  STATUS:                                                                         │
│  +-- ALL checked = PRODUCTION_READY                                              │
│  +-- ANY missing = BLOCKED                                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---


## 12.4 FOUR-PART IMPLEMENTATION & FILE-PLACEMENT BLUEPRINT

The implementation is divided into four non-overlapping groups. Every module
must be internally complete; only public contracts and controlled wiring cross
group boundaries.

### PART 1 — M01-M05
```text
M01 Foundation
M02 Core Architecture
M03 Device & Platform
M04 Company Management
M05 Party Management

COMPLETE PACKAGE PER MODULE:
Frontend + Backend + API + Database + Tests + Repository Map +
Dependency Map + Wiring Map + Test Map.

Only 1-2 controlled public integration/wiring artifacts may cross the group
boundary. No unfinished internal implementation may be hidden behind wiring.
```

### PART 2 — M06-M10
```text
M06 Inventory
M07 Purchase
M08 Sales & Billing
M09 GST & Compliance
M10 Accounting

SPECIAL OWNERSHIP:
M06 = Product/Category/Stock/Batch/Serial + Barcode/QR
M07 = Purchase + Purchase-Bill OCR
M08 = Sales/Billing
M09 = GST/Tax security lock
M10 = Accounting/Ledger

No module may directly call another module's repository/private file.
```

### PART 3 — M11-M15
```text
M11 Payment & Communication
M12 Employee & HR
M13 Smart Automation
M14 Generic Data Import/Export
M15 Data Storage & Sync

SPECIAL OWNERSHIP:
M13 = automation/triggers/drafts, not business-master ownership.
M14 = generic bulk import/export.
M15 = offline queue, sync, conflict resolution, backup and restore.
```

### PART 4 — M16-M20
```text
M16 Notification Engine
M17 Reporting
M18 External Integration
M19 Production & Monitoring
M20 International Trade & 8-Digit HSN

SPECIAL OWNERSHIP:
M17 = Executive BI/reporting.
M18 = external connector plumbing.
M19 = production/security monitoring and audit consumption.
M20 = international trade + hsn_master + FX + customs + trade documents.
```

### GROUP-TO-GROUP WIRING MAP
```text
PART 1 (M01-M05)
   │
   │ public contracts + controlled wiring only
   ▼
PART 2 (M06-M10)
   │
   │ public contracts + controlled wiring only
   ▼
PART 3 (M11-M15)
   │
   │ public contracts + controlled wiring only
   ▼
PART 4 (M16-M20)

CORE FLOWS
M05 -> M06 -> M07/M08 -> M09 -> M10 -> M11
M06 -> M13 -> M07
M15 -> ALL MODULES (offline/sync contract only)
M18 -> external systems
M20 -> M05/M06/M07/M08/M09/M10/M11/M18
M19 <- audit/security/health events from all modules
```

### FILE-PLACEMENT MASTER RULE
```text
1. Every file has exactly one owning module.
2. Frontend: frontend/src/modules/<module>/...
3. Backend: backend/src/modules/<module>/...
4. Shared technical files: common/shared foundation only.
5. API contracts: api-contracts/v1/.
6. Module wiring maps: wiring-maps/module-wiring/.
7. Cross-module flows: wiring-maps/cross-module-flows/.
8. Event registry: wiring-maps/event-registry/.
9. Database schema/migrations: controlled database paths.
10. Tests: module test directories + master test registry.
11. Public service/API/event interfaces are the only legal cross-module calls.
12. Private/internal/repository files are never called by another module.
13. A module is COMPLETE only when all of its own files are complete and tested.
14. Integration files connect completed modules; they do not replace missing files.
```


# 13. DEVELOPMENT ROADMAP & LOCK ORDER

## 13.1 Build Phase Order

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT PHASES (Fixed Order)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PHASE 1: FOUNDATION (Weeks 1-4)                                                │
│  +-- M01: App shell, Error handling, Health checks                              │
│  +-- M02: Auth, User, Role, Permission (JWT + RBAC)                            │
│  +-- M03: Device registration, Session management                              │
│  +-- M04: Company, Branch, Financial Year                                       │
│  +-- LOCK: M01, M02, M03, M04                                                   │
│                                                                                  │
│  PHASE 2: BUSINESS BASE (Weeks 5-8)                                             │
│  +-- M05: Party (Customer/Supplier) master                                      │
│  +-- M06: Product, Category, Stock, Batch, Serial                               │
│  +-- LOCK: M05, M06                                                             │
│                                                                                  │
│  PHASE 3: TRANSACTION MODULES (Weeks 9-14)                                      │
│  +-- M07: Purchase Order, Purchase Invoice, GRN, Return                         │
│  +-- M08: Quotation, Sales Order, Invoice, Return, Receipt                      │
│  +-- M09: GST Config, Tax Calculation, Returns, E-Invoice                       │
│  +-- LOCK: M07, M08, M09                                                        │
│                                                                                  │
│  PHASE 4: FINANCE & COMPLIANCE (Weeks 15-18)                                    │
│  +-- M10: Ledger, Voucher, Cash/Bank Book, BRS, Final Accounts                  │
│  +-- M11: Payment, Receipt, Due Tracking, Communication                          │
│  +-- LOCK: M10, M11                                                             │
│                                                                                  │
│  PHASE 5: HR & OPERATIONS (Weeks 19-20)                                         │
│  +-- M12: Employee, Attendance, Leave, Salary, Advance                          │
│  +-- LOCK: M12                                                                  │
│                                                                                  │
│  PHASE 6: INTELLIGENCE & AUTOMATION (Weeks 21-22)                               │
│  +-- M13: Scheduler, Alerts, Reminders, Notification Center                     │
│  +-- LOCK: M13                                                                  │
│                                                                                  │
│  PHASE 7: ADVANCED FEATURES (Weeks 23-26)                                       │
│  +-- M14: Import/Export engine                                                  │
│  +-- M15: Offline sync, Backup, Restore, Conflict resolution                    │
│  +-- M16: Notification engine (WhatsApp/SMS/Email)                              │
│  +-- M17: Reporting (Sales/Purchase/Inventory/GST/Accounting/HR)                │
│  +-- LOCK: M14, M15, M16, M17                                                   │
│                                                                                  │
│  PHASE 8: INTEGRATION (Weeks 27-28)                                             │
│  +-- M18: External APIs (GSTN, WhatsApp, SMS, Payment gateways)                 │
│  +-- LOCK: M18                                                                  │
│                                                                                  │
│  PHASE 9: PRODUCTION (Weeks 29-30)                                              │
│  +-- M19: Activity logs, Login history, Permission tracker, Health monitoring   │
│  +-- LOCK: M19                                                                  │
│                                                                                  │
│  PHASE 10: INTERNATIONAL TRADE (Weeks 31-33)                                    │
│  +-- M20: Import/Export, 8-digit HSN, FX, Customs Duty, BOE, Trade Documents   │
│  +-- LOCK: M20                                                                  │
│                                                                                  │
│  PHASE 11: MASTER INTEGRATION AUDIT (Weeks 34-35)                               │
│  +-- End-to-End testing of all business flows                                    │
│  +-- Four-part wiring verification                                               │
│  +-- M01-M20 contract verification                                               │
│  +-- Security and performance audit                                              │
│  +-- Offline/sync + dual-backup recovery test                                    │
│  +-- OCR + Barcode/QR + GST/HSN-lock test                                       │
│  +-- International-trade test                                                    │
│  +-- Production readiness verification                                           │
│  +-- FINAL LOCK: GNT SYSTEM READY                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 13.2 Module Lock Criteria

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  MODULE LOCK PACKAGE (Required for each module)                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. MODULE CONTRACT              [Public interface definition]                    │
│  2. REPOSITORY MAP               [All files + locations]                          │
│  3. FILE REGISTRY                [File ID, Owner, Dependencies, Status]          │
│  4. DATABASE MAP                 [Tables owned + relations]                       │
│  5. DATABASE REGISTRY            [Migration + status]                             │
│  6. DEPENDENCY MAP               [What module uses + provides]                    │
│  7. WIRING MAP                   [Connections to other modules]                   │
│  8. WIRING REGISTRY              [Connection ID, Interface, Test Status]        │
│  9. API CONTRACT                 [Endpoints, Request/Response schemas]           │
│  10. INTEGRATION CONTRACT        [External/internal integrations]                 │
│  11. SECURITY CONTRACT           [Auth, Permission, Data protection]             │
│  12. TEST REPORT                 [All test layers PASS]                           │
│  13. CHANGE LOG                  [All changes during development]                 │
│  14. VERSION                     [Semantic version]                               │
│  15. LOCK STATUS                 [LOCKED + Date + Approved By]                   │
│                                                                                  │
│  WITHOUT ALL 15 ITEMS = MODULE NOT LOCKED                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 14. FINAL ARCHITECTURE PRINCIPLE

## 14.0 SECOND-STAGE FEATURES — ACTIVATION AFTER CORE LOCK

```text
1. REAL-TIME COLLABORATION
   Controlled through M15 sync + M18 integration contracts.

2. EXECUTIVE BI DASHBOARD
   Owned by M17 Reporting; reads approved public reporting interfaces only.

3. WORKFLOW APPROVAL ENGINE
   Owned by M13 Automation; approval rules are invoked by the owning module.
   High-value bills/orders cannot bypass owner/manager approval.

4. ADVANCED SEARCH
   Common search foundation + module public search interfaces.
   Target: sub-second indexed search under defined production-load conditions.

ACTIVATION GATE:
M01-M20 LOCKED + FOUR PARTS VERIFIED + MASTER INTEGRATION AUDIT PASSED.
```

## 14.1 The GNT Architecture Pyramid

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                           GNT SYSTEM READY                                     │
│                    (M01-M20 ALL LOCKED + INTEGRATED)                          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    MASTER RULES                                                              │
│         │                                                                    │
│    CONTROLLED MODULES                                                        │
│         │                                                                    │
│    SINGLE OWNERSHIP                                                          │
│         │                                                                    │
│    SINGLE SOURCE OF TRUTH                                                    │
│         │                                                                    │
│    CONTROLLED DATABASE                                                       │
│         │                                                                    │
│    CONTROLLED DEPENDENCIES                                                   │
│         │                                                                    │
│    CONTROLLED WIRING                                                         │
│         │                                                                    │
│    PUBLIC CONTRACTS                                                          │
│         │                                                                    │
│    SECURITY                                                                  │
│         │                                                                    │
│    TESTING                                                                   │
│         │                                                                    │
│    REGISTRY                                                                  │
│         │                                                                    │
│    LOCK                                                                      │
│         │                                                                    │
│    INTEGRATED SYSTEM                                                         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    BUILD ONCE                                                                │
│    REGISTER ONCE                                                             │
│    OWN ONCE                                                                  │
│    CONNECT THROUGH CONTRACT                                                  │
│    REUSE EVERYWHERE                                                          │
│    TEST EVERYTHING                                                           │
│    LOCK AFTER VERIFICATION                                                   │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    READ MASTER -> READ MODULE -> SCAN EXISTING -> DO NOT GUESS               │
│    DO NOT DUPLICATE -> RESPECT OWNERSHIP -> RESPECT DATABASE                   │
│    RESPECT CONTRACTS -> RESPECT SECURITY -> DOCUMENT WIRING                    │
│    TEST -> AUDIT -> UPDATE REGISTRY -> REPORT CHANGES                          │
│    LOCK ONLY WHEN VERIFIED                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 14.2 Final Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    GNT ADVANCED SOFTWARE BLUEPRINT                               │
│                         FINAL STATISTICS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TOTAL FILES: 914                                                               │
│  ├── Blueprint Documents: 43                                                    │
│  ├── Frontend Files: 312                                                        │
│  ├── Backend Files: 285                                                         │
│  ├── API/Wiring Files: 76                                                       │
│  ├── Database Files: 42                                                         │
│  └── Test Files: 156                                                            │
│                                                                                  │
│  MODULES: 19 (M01-M20)                                                          │
│  SCREENS: 78 (Frontend)                                                         │
│  DATABASE TABLES: 42 (Canonical)                                                │
│  API ENDPOINTS: 200+                                                            │
│  EVENTS: 15+ (Async)                                                            │
│  EXTERNAL INTEGRATIONS: 6 (GSTN, WhatsApp, SMS, Payment, E-Invoice, E-Way)     │
│                                                                                  │
│  SECURITY LAYERS: 6                                                             │
│  TEST LAYERS: 9                                                                 │
│  DEVELOPMENT PHASES: 11                                                         │
│                                                                                  │
│  ARCHITECTURE: Modular Monolith (Single Codebase, Controlled Boundaries)       │
│  FRONTEND: React 18 + TypeScript + Zustand + Tailwind CSS                      │
│  BACKEND: Node.js + Express + TypeScript + Prisma ORM                          │
│  DATABASE: PostgreSQL 15+ (ACID, Multi-tenant)                                 │
│  AUTH: JWT RS256 + RBAC + OTP                                                  │
│  API: REST (OpenAPI 3.0) + Event-Driven (Redis Pub/Sub)                        │
│  OFFLINE: SQLite + Sync Queue + Conflict Resolution                            │
│                                                                                  │
│  GROUP: मा आदिशक्ति                                                            │
│  BRAND: RAKSHA                                                                  │
│  PLATFORM: GARUDA NEXTECH (GNT)                                               │
│  VERSION: 1.0.0                                                                 │
│  STATUS: PERMANENT ARCHITECTURE CONTRACT                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

**Document ID:** GNT-ADV-SOFT-BLUEPRINT-001
**Version:** 2.0.0
**Status:** ADVANCED MASTER ARCHITECTURE CONTRACT
**Authority:** GNT MASTER BLUEPRINT Rules 1-93
**Applies To:** M01 - M20 (All Modules)
**Total Pages:** 14 Sections | 914 Files Mapped | Complete Call Chain Documented
**Next Step:** Module-Specific Implementation (Phase 1 -> Phase 10)

---

> "तुम केवल अपना दिया हुआ Module नहीं बना रहे हो।
> तुम GARUDA NEXTECH नाम के एक बड़े interconnected Business Operating System का हिस्सा बना रहे हो।"

**BUILD ONCE. REGISTER ONCE. OWN ONCE. CONNECT THROUGH CONTRACT. REUSE EVERYWHERE. TEST EVERYTHING. LOCK AFTER VERIFICATION.**

---
