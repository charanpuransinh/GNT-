# GNT GitHub Repository — Directory Structure

This file is the construction map for the initial GitHub scaffold. It follows the supplied GNT wiring/module maps and blueprint.

## 1. Class and module ownership

| Class | Modules |
|---|---|
| A | M01 Foundation, M02 Core Architecture, M03 Device & Platform, M04 Company Management, M05 Party Management |
| B | M06 Inventory, M07 Purchase, M08 Sales & Billing, M09 GST & Compliance, M10 Accounting |
| C | M11 Payment & Communication, M12 Employee & HR, M13 Smart Automation, M14 Generic Data Import/Export, M15 Data Storage & Sync |
| D | M16 Notification Engine, M17 Reporting, M18 External Integration, M19 Production & Monitoring, M20 International Trade & HSN |

## 2. Module internal tree

Each frontend module:
```text
frontend/src/modules/MXX-module-name/
├── pages/
├── components/
├── services/
├── state/
├── validators/
├── routes/
└── index.ts
```

Each backend module:
```text
backend/src/modules/MXX-module-name/
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

## 3. Full module roots

```text
frontend/src/modules/
├── M01-foundation/
├── M02-core-architecture/
├── M03-device-platform/
├── M04-company-management/
├── M05-party-management/
├── M06-inventory-management/
├── M07-purchase-management/
├── M08-sales-billing/
├── M09-gst-compliance/
├── M10-accounting/
├── M11-payment-communication/
├── M12-employee-hr/
├── M13-smart-automation/
├── M14-import-export/
├── M15-data-storage-sync/
├── M16-notification-engine/
├── M17-reporting/
├── M18-external-integration/
├── M19-production-monitoring/
└── M20-international-trade-hsn/

backend/src/modules/
├── M01-foundation/
├── M02-core-architecture/
├── M03-device-platform/
├── M04-company-management/
├── M05-party-management/
├── M06-inventory-management/
├── M07-purchase-management/
├── M08-sales-billing/
├── M09-gst-compliance/
├── M10-accounting/
├── M11-payment-communication/
├── M12-employee-hr/
├── M13-smart-automation/
├── M14-import-export/
├── M15-data-storage-sync/
├── M16-notification-engine/
├── M17-reporting/
├── M18-external-integration/
├── M19-production-monitoring/
└── M20-international-trade-hsn/
```

## 4. Shared top-level tree

```text
GNT/
├── README.md
├── docs/
│   ├── STRUCTURE.md
│   ├── roadmap/
│   │   ├── 01_GNT_MASTER_WIRING_MAP.md
│   │   ├── 02_GNT_ABCD_TEAM_WIRING_MAP.md
│   │   ├── 03_GNT_MODULE_FILE_FUNCTION_MAPPING.md
│   │   └── GNT_PROGRESS_TRACKER.html
│   ├── architecture/
│   ├── testing/
│   └── operations/
├── frontend/
│   └── src/
│       ├── app/
│       ├── core/
│       ├── components/
│       │   ├── ui/
│       │   ├── layout/
│       │   └── feedback/
│       ├── state/
│       ├── hooks/
│       ├── utils/
│       ├── styles/
│       └── modules/
├── backend/
│   └── src/
│       ├── common/
│       │   ├── security/
│       │   ├── logging/
│       │   ├── middleware/
│       │   ├── errors/
│       │   ├── events/
│       │   └── validation/
│       ├── app/
│       └── modules/
├── api-contracts/
│   ├── v1/
│   └── common/
├── wiring-maps/
│   ├── module-wiring/
│   ├── cross-module-flows/
│   └── event-registry/
├── integration-registry/
│   ├── external/
│   └── internal/
├── database/
│   ├── schema/
│   ├── migrations/
│   ├── seeders/
│   └── views/
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

## 5. Critical boundary

Legal:
`Module A → PUBLIC Service / PUBLIC API / EVENT → Module B`

Forbidden:
`Module A → Module B private service`
`Module A → Module B internal file`
`Module A → Module B repository`
`Module A → Module B database table directly`

## 6. Important source discrepancy

The supplied Advanced Software Blueprint reports a grand total of **914 files**, not 1500+. The 914 figure is the architecture's declared file inventory and should be treated as the source-of-truth for this scaffold unless an approved newer manifest supersedes it.

Also, the current uploaded set contains the three requested wiring/map files plus two additional blueprint/roadmap Markdown files; it does **not** contain the requested `GNT_PROGRESS_TRACKER.html`. A placeholder is included only to reserve the requested GitHub path. Do not treat that placeholder as the real tracker.

## 7. No silent file invention

The source explicitly requires unnamed remainder files to be marked `DESIGN-EXPANSION / NEEDS APPROVAL`. This scaffold therefore creates directories and `.gitkeep` files, but does not fabricate implementation files that were not supplied/named.
