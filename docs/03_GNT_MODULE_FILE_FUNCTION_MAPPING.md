# GNT — MODULE → FILE → FUNCTION → DEPENDENCY MASTER MAP
Version: 2.0 | Mapping Layer: L3 MODULE / FILE

## UNIVERSAL FILE RECORD

Every registered implementation file is traced using:

File Path
→ Owner Module
→ Purpose
→ Calls
→ Called By
→ Input
→ Output
→ Dependencies
→ Error Path
→ Tests

Where the source blueprint gives a declared file count but does not name every file, the unnamed remainder is explicitly marked:
DESIGN-EXPANSION / NEEDS APPROVAL
It is not silently invented.

## UNIVERSAL MODULE INTERNAL ROAD

frontend/src/modules/MXX/
→ pages/
→ components/
→ services/
→ state/
→ validators/
→ routes/
→ index.ts

backend/src/modules/MXX/
→ controllers/
→ services/
→ repositories/
→ models/
→ validators/
→ routes/
→ events/
→ types/
→ tests/
→ index.ts

## MASTER FUNCTION ROAD

Page
→ Validator
→ Frontend Service
→ api-client
→ Route
→ Middleware
→ Controller
→ PUBLIC Service
→ Repository
→ Database
→ Event
→ Handler
→ Audit
→ Response
→ Store
→ UI

---

# CLASS A

## M01 — FOUNDATION
Owner: A
Purpose: system foundation/shared base.
Primary dependency role: base layer.
Call rule: M01 is foundational; business modules do not bypass its approved public foundation interfaces.
File-level mapping: use the registered M01 manifest; unnamed files = DESIGN-EXPANSION.
Error root targets: startup/config/health/shared foundation.
Tests: unit + module + integration + security as registered.

## M02 — CORE ARCHITECTURE
Owner: A
Purpose: authentication, authorization, core architecture.
Call road:
Login/UI → API → auth middleware/service → session/permission boundary.
Called by: dependent modules through public security/context contracts.
Forbidden: business/financial logic inside the core security boundary.
Tests: auth, permission, session, security, integration.

## M03 — DEVICE & PLATFORM
Owner: A
Purpose: device/session/platform handling.
Call road:
Device UI → device service → platform/session contract → persistence → response.
Called by: application shell/security/device-aware flows.
Error targets: device registration, session state, platform capability.
Tests: device + session + platform.

## M04 — COMPANY MANAGEMENT
Owner: A
Known UI surface:
CompanyProfilePage
BranchManagementPage
FinancialYearPage
RolePermissionPage
UserManagementPage
ThemeSettingsPage

Provides:
Company context, FY settings, invoice number prefixes.

Uses:
M02 Core authentication/security.
Accounting balance through approved contract.

Database ownership shown in module preview:
company_master
branch_master
financial_year

Forbidden:
Product data, transaction data, direct invoice creation.

Main road:
Company UI → company service → public company contract → owner repository → DB → response.

## M05 — PARTY MANAGEMENT
Owner: A
Known UI surface:
PartyListPage
PartyEntryDrawer
PartyDetailHubPage

Provides:
Party data, outstanding, credit limit, aging.

Uses:
M02 Core; M10 accounting balance through controlled contract.

Main road:
Party UI → party service → public party contract → repository → party DB/view → response.

Cross-class:
M05 → M06 through public contract.

---

# CLASS B

## M06 — INVENTORY
Owner: B
Known UI:
ItemListPage
ItemEntryDrawer
CategoryUnitPage
StockTransferPage
StockAdjustmentPage
LowStockAlertPage

Provides:
Product data, stock check, stock update via Transaction Engine.

Uses:
M04 company/branch context.

Database:
product_master
category_master
stock_master
stock_movement
batch_master
serial_master

Forbidden:
Direct stock edit without Transaction Engine; invoice/payment/ledger entries.

Main roads:
M04 → M06 context
M06 → M07/M08 stock contract
M06 → M13 stock-low event

## M07 — PURCHASE
Owner: B
Known UI:
PurchaseEntryPage
PurchaseOrderPage
PurchaseReturnPage
SupplierPaymentPage
PurchaseHistoryPage

Uses:
M05 Party, M06 Inventory, M09 GST, M10 Accounting, M11 Payment.

Owns:
Purchase order / purchase invoice data.

Special:
Purchase Bill OCR is owned by M07; OCR proposes data and approval/validation is mandatory.

Forbidden:
Direct stock or ledger writes outside Transaction Engine.

Main road:
M05 → M07
M06 → M07
M07 → M09 / M10 / M11 through public contracts.

## M08 — SALES & BILLING
Owner: B
Known UI:
SalesInvoicePage
QuotationPage
DeliveryChallanPage
SalesReturnPage
CustomerReceiptPage
InvoicePrintSharePage

Uses:
M05 Customer
M06 Product/Stock
M09 GST
M10 Accounting

Owns:
quotation
sales_order
sales_invoice
sales_invoice_item
sales_return
delivery_challan

Forbidden:
Direct stock update; direct ledger entry; supplier data.

Main road:
M05 → M08
M06 → M08
M08 → M09 → M10
M08 → M11 for payment/communication through approved contract.

## M09 — GST & COMPLIANCE
Owner: B
Known UI:
GSTConfigPage
GSTCalculationPage
GSTReturnsPage
GSTR2BReconciliationPage
EWayEInvoicePage

Uses:
M04 GSTIN context
M07/M08 invoice data

Owns:
hsn_master
tax_rate_master
gst_transaction
e_invoice_record
e_way_bill_record

Forbidden:
Direct invoice creation, stock modification, ledger entry.

Main road:
Invoice contract → GST calculation → compliance record → response.

## M10 — ACCOUNTING
Owner: B
Known UI:
CashBankBookPage
JournalVoucherPage
IncomeExpenseVoucherPage
LedgerViewerPage
BRSPage
FinalAccountsPage

Uses:
M04 Company
M05 Party
M07/M08 invoice data

Owns:
ledger
voucher
bank_reconciliation
account_master

Forbidden:
Direct stock update, invoice creation, payment processing.

Main road:
Approved transaction → accounting service → ledger/repository → DB → accounting result.

---

# CLASS C

## M11 — PAYMENT & COMMUNICATION
Owner: C
Known UI:
PaymentEntryPage
ReceiptEntryPage
DueTrackerPage
CommunicationHubPage

Uses:
M05 Party
M10 Accounting

Owns:
payment_record

Main road:
Payment/receipt UI → service → accounting/party public contract → payment persistence → communication contract.

## M12 — EMPLOYEE & HR
Owner: C
Purpose:
Employee master, attendance, leave, salary, advance.

Uses:
M02 Core authentication; M10 accounting salary posting.

Owns:
employee_master

Forbidden:
Direct ledger posting outside Transaction Engine.

Main road:
HR UI → HR service → employee repository → DB → approved accounting contract.

## M13 — SMART AUTOMATION
Owner: C
Known UI:
SchedulerPage
PaymentRemindersPage
StockAlertWorkflowPage
NotificationCenterPage

Provides:
Scheduled jobs, reminders, alert workflows, workflow approval engine.

Uses:
M05–M09 read/contract inputs.

Ownership rule:
Automation does not become business-master owner.

Main road:
Event/Trigger → Rule Engine → Approval/Validation → Draft/Action Contract → owner module.

Special:
M06 stock-low → M13 rule → M07 purchase-order draft.

Forbidden:
Infinite loops, duplicate notifications, external action without approval.

## M14 — GENERIC DATA IMPORT/EXPORT
Owner: C
Purpose:
Generic bulk import/export.

Main road:
Import file → validation → mapping → owner-module public contract → result/error report.
Export:
Owner public data contract → transformation → export file.

## M15 — DATA STORAGE & SYNC
Owner: C
Purpose:
Offline queue, sync, conflict resolution, backup/restore.

Main road:
Local change → offline queue → sync engine → conflict resolver → owner public contract → acknowledgement.
Backup:
data snapshot → backup → verification → restore path.

Cross-module:
M15 → ALL modules through sync contract only.

---

# CLASS D

## M16 — NOTIFICATION ENGINE
Owner: D
Purpose:
In-app, WhatsApp, SMS, Email notification + delivery tracking.

Public:
Notification sending and delivery tracking.

Uses:
M05 party contact; M18 external gateways.

Forbidden:
Direct business logic; financial data inside notifications.

Main road:
Producer → M16 public notification service → channel routing → M18 gateway where required → delivery log → event/result.

## M17 — REPORTING
Owner: D
Purpose:
Sales, Purchase, Inventory, GST, Accounting, HR reports and Executive BI.

Known UI:
SalesReportsPage
PurchaseReportsPage
InventoryReportsPage
GSTReportsPage
AccountingReportsPage
HRReportsPage

Public:
Report generation, aggregation, PDF/Excel export.

Uses:
M06–M12 through approved contracts.

Forbidden:
Direct DB write, data modification, transaction creation.

Main road:
Report request → report service → public data contracts → aggregation → generator → output.

## M18 — EXTERNAL INTEGRATION
Owner: D
Purpose:
WhatsApp/SMS gateways, payment gateways, GSTN, webhook monitoring and external connectors.

Main road:
Internal public contract → connector → external system → response/webhook → validation → internal event/result.

Forbidden:
External systems calling private module repositories.

## M19 — PRODUCTION & MONITORING
Owner: D
Purpose:
Production/security monitoring and audit consumption.

Main road:
Health/security/audit event → collector → monitoring rule → alert/report → M16 notification or M17 reporting through public contracts.

M19 receives audit/security/health events from all modules.

## M20 — INTERNATIONAL TRADE & 8-DIGIT HSN
Owner: D
Purpose:
International trade, HSN, FX, customs and trade documents.

Main road:
Trade document → HSN/validation → FX/customs rules → approved business-module contract → M18 external integration where needed → result.

Uses/serves:
M05/M06/M07/M08/M09/M10/M11/M18 through public contracts.

---

# ERROR TRACE MASTER

## Layer 1
GNT → Class

## Layer 2
Class → Module → File

## Layer 3
File → Function → Dependency → Root Cause

### Example path
M08 SalesInvoicePage
→ sales service
→ API route
→ controller
→ M08 public service
→ M06 stock public contract
→ stock repository
→ DB

If failure:
DB
↑
Repository
↑
Public Service
↑
Controller
↑
API
↑
Frontend Service
↑
SalesInvoicePage

The first failing contract/function is the diagnostic boundary; do not blame downstream files without evidence.

# FILE-LEVEL STATUS RULE

Every explicit source-named file gets:
REGISTERED → PURPOSE → CALLS → CALLED BY → INPUT → OUTPUT → DEPENDENCIES → ERROR PATH → TESTS.

Every declared-but-unnamed file count gets:
DESIGN-EXPANSION / NEEDS APPROVAL.

No silent file invention.
