# GNT M17 — REPORTING MODULE
## Complete Build Manifest | Version 2.0 | Owner: D4-DELTA

---

## 📊 BUILD STATISTICS

| Layer | Files | Status |
|-------|-------|--------|
| Frontend | 14 | ✅ Complete |
| Backend | 12 | ✅ Complete |
| API Contracts | 2 | ✅ Complete |
| Tests | 8 | ✅ Complete |
| Database | 2 | ✅ Complete |
| **TOTAL** | **38** | **✅ READY** |

---

## 📁 FILE REGISTRY

### Frontend (14 files)
```
frontend/src/modules/m17-reporting/
├── pages/
│   ├── SalesReportsPage.tsx            [Sales register + margin analysis]
│   ├── PurchaseReportsPage.tsx         [Purchase register + PO status]
│   ├── InventoryReportsPage.tsx        [Stock summary + valuation]
│   ├── GSTReportsPage.tsx              [Tax liability + HSN summary]
│   ├── AccountingReportsPage.tsx       [Daybook + cashflow + aging]
│   └── HRReportsPage.tsx               [Attendance + salary register]
├── components/
│   ├── ReportFilterPanel.tsx           [Date range + filters]
│   └── ReportExportButton.tsx          [PDF/Excel export trigger]
├── services/
│   ├── report.service.ts               [Report API calls]
│   └── report.types.ts                 [Report DTOs]
├── state/
│   └── report.store.ts                 [Zustand report state]
├── validators/
│   └── report.schema.ts                [Zod validation schemas]
├── routes/
│   └── report.routes.ts                [Route definitions]
└── index.ts                            [Public exports]
```

### Backend (12 files)
```
backend/src/modules/m17-reporting/
├── controllers/
│   └── report.controller.ts            [Report CRUD handlers]
├── services/
│   ├── report.service.ts               [PUBLIC — Report business logic]
│   ├── report.internal.ts              [Query builder engine]
│   └── report.generator.ts             [PDF/Excel generation engine]
├── repositories/
│   └── report.repository.ts            [report_config + report_template OWNER]
├── models/
│   └── report.model.ts                 [Prisma extensions]
├── validators/
│   └── report.schema.ts                [Input validation Zod]
├── routes/
│   └── report.routes.ts                [Report endpoints]
├── events/
│   ├── report.events.ts                [Event definitions]
│   └── report.handlers.ts              [Event consumers]
├── types/
│   └── report.types.ts                 [DTOs & interfaces]
└── index.ts                            [Public exports]
```

### API Contracts (2 files)
```
api-contracts/v1/
├── M17-reporting.contract.yaml         [OpenAPI 3.0 spec]
└── M17-wiring-map.json                 [M06, M07, M08, M09, M10, M12 connections]
```

### Database (2 files)
```
database/
├── report_config.sql                   [Report configurations table]
└── report_template.sql                 [Report layouts/templates table]
```

### Tests (8 files)
```
tests/
├── module/m17-reporting.unit.test.ts
├── module/m17-reporting.integration.test.ts
├── module/m17-reporting.api.test.ts
├── security/m17-reporting.security.test.ts
├── integration/m17-cross-module-read.test.ts
├── performance/m17-report-generation-load.test.ts
├── integration/m17-pdf-export.test.ts
└── integration/m17-excel-export.test.ts
```

---

## 🔌 KEY ENDPOINTS

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/v1/reports/generate | Generate report |
| GET | /api/v1/reports/sales | Sales report data |
| GET | /api/v1/reports/purchase | Purchase report data |
| GET | /api/v1/reports/inventory | Inventory report data |
| GET | /api/v1/reports/gst | GST report data |
| GET | /api/v1/reports/accounting | Accounting report data |
| GET | /api/v1/reports/hr | HR report data |
| POST | /api/v1/reports/export | Export PDF/Excel |
| GET | /api/v1/reports/executive | Executive BI dashboard |

---

## 🏗️ ARCHITECTURE COMPLIANCE

### ✅ LEGAL Cross-Module Access (READ ONLY)
- M17 → M06 `inventory.service.getStockSummary()`
- M17 → M07 `purchase.service.getPurchaseRegister()`
- M17 → M08 `sales.service.getSalesRegister()`
- M17 → M09 `gst.service.getGSTTransactions()`
- M17 → M10 `accounting.service.getLedgerEntries()`
- M17 → M12 `hr.service.getAttendanceReport()` / `getSalaryRegister()`

### ❌ ILLEGAL Access Prevented
- No direct repository access to other modules
- No direct table access (sales_invoice, purchase_order, etc.)
- No transactional data modifications
- No creation of invoices, payments, stock entries

---

## 🎨 DESIGN TOKENS APPLIED
- Primary: #2563EB | Success: #16A34A | Warning: #F59E0B | Error: #DC2626
- BG: #F8FAFC | Surface: #FFFFFF | Text: #0F172A | Muted: #64748B
- Font: Inter | Radius: 8px / 12px | Spacing: 4px base

---

## 📡 EVENT SUBSCRIPTIONS
- `sales.invoice.created` → Update sales report cache
- `purchase.invoice.approved` → Update purchase report cache
- `stock.updated` → Update inventory report cache
- `payment.received` → Update outstanding report
- `employee.salary.processed` → Update HR report cache

---

*Built according to GNT Advanced Software Blueprint V2 M01-M20*
*Document ID: GNT-M17-SESSION-BOARD | Authority: D4-DELTA*
