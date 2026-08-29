# GNT — CLASS A/B/C/D WIRING & MAPPING MAP
Version: 2.0 | Mapping Layer: L2 TEAM

## CLASS A — M01–M05

CLASS A
│
├→ M01 Foundation
├→ M02 Core Architecture
├→ M03 Device & Platform
├→ M04 Company Management
└→ M05 Party Management
     │
     └──────── PUBLIC CONTRACT ───────→ CLASS B

### A CORE ROAD
M01 → M02 → M03 → M04 → M05
M04 → M05
M02 → authentication/authorization boundary for dependent modules
M05 → M06 (public contract only)

### A RUNTIME ROAD
Class A Page
→ frontend service
→ common api-client
→ route
→ middleware
→ controller
→ public service
→ owner repository
→ database
→ event/audit
→ response

---

## CLASS B — M06–M10

CLASS B
│
├→ M06 Inventory
├→ M07 Purchase
├→ M08 Sales & Billing
├→ M09 GST & Compliance
└→ M10 Accounting
     │
     └──────── PUBLIC CONTRACT ───────→ CLASS C

### B CORE ROAD
M05 → M06
M06 → M07
M06 → M08
M07 → M09
M08 → M09
M07 → M10
M08 → M10
M09 → controlled tax/compliance result
M10 → ledger/accounting result
M06 → M13 (stock event/contract)
M06 must not be directly modified outside the transaction engine.
M07 must not directly write stock/ledger outside approved transaction boundaries.
M08 must not directly write stock/ledger.
M09 must not create invoices, modify stock, or post ledger entries.
M10 must not create invoices, modify stock, or process payments directly.

### B MAIN BUSINESS ROAD
Party
→ Inventory
→ Purchase / Sales
→ GST
→ Accounting
→ Payment

---

## CLASS C — M11–M15

CLASS C
│
├→ M11 Payment & Communication
├→ M12 Employee & HR
├→ M13 Smart Automation
├→ M14 Generic Data Import/Export
└→ M15 Data Storage & Sync
     │
     └──────── PUBLIC CONTRACT ───────→ CLASS D

### C CORE ROAD
M10 → M11
M05–M09 → M13 read/contract inputs
M06 → M13 stock-low event
M13 → M07 purchase-order draft
M14 → generic bulk import/export contracts
M15 → ALL MODULES through offline/sync contract only

### C SPECIAL OWNERSHIP
M13 = automation/triggers/drafts, not business-master ownership.
M15 = offline queue + sync + conflict resolution + backup/restore.

---

## CLASS D — M16–M20

CLASS D
│
├→ M16 Notification Engine
├→ M17 Reporting
├→ M18 External Integration
├→ M19 Production & Monitoring
└→ M20 International Trade & 8-Digit HSN

### D CORE ROAD
M16 ← registered notification producers
M17 ← approved reporting contracts from M06–M12
M18 → external systems
M19 ← audit/security/health events from all modules
M20 ↔ approved modules + M18

### D SPECIAL OWNERSHIP
M17 = Executive BI/reporting.
M18 = external connector plumbing.
M19 = production/security monitoring and audit consumption.
M20 = international trade + HSN + FX + customs + trade documents.

## CLASS-TO-CLASS ROAD

A → B → C → D

Only registered PUBLIC SERVICE / PUBLIC API / EVENT crosses the boundary.

## ERROR RETURN ROAD

Failure
→ current Function
→ File
→ Module
→ Class
→ Cross-Class Contract
→ Caller
→ Root Cause

Never jump directly to a private repository or another module's database.
