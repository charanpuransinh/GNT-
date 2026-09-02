# GNT Enterprise ERP — M20 & M21 Master Update Specification

> **STATUS:** MASTER UPDATE / DEVELOPER IMPLEMENTATION CONTRACT
>
> **IMPORTANT ARCHITECTURE CORRECTION:** Payment/Bank Statement automation does **NOT** belong to M21. Payment remains inside the existing **Accounting / Accounts Department module** (the existing accounting/payment owner). M21 is only the **Data Sense / Client Data Intake & Migration** module.

---

# 1. FINAL MODULE OWNERSHIP

This update locks the following architecture:

| Module | Final Responsibility |
|---|---|
| **M20** | Export & International Trade Master Hub |
| **M21** | Client Data Sense / Universal Data Intake & Migration |
| **Existing Accounts / Accounting Module** | Payment, Bank Statement, Receipt, Settlement & Party-wise Auto Posting |

### Mandatory rule

**M21 must NOT contain the payment engine.**

Do not move payment functionality into M21.

Do not create a second payment system inside M21.

Do not create duplicate bank/payment tables in M21.

The existing Accounts/Accounting module remains the owner of financial transactions.

If the existing Accounts module needs one or more new files/services for bank-statement automation, add/update those files **inside the existing Accounts/Accounting structure**.

---

# 2. M20 — EXPORT & INTERNATIONAL TRADE MASTER HUB

## 2.1 Objective

M20 must contain the complete operational export/international-trade data lifecycle.

M20 is not only an export quotation calculator.

It is the master hub for:

```text
Overseas Buyer
→ Export Product
→ HSN / Tariff
→ Export Quotation
→ Proforma Invoice
→ Export Order
→ Commercial Invoice
→ Packing
→ Shipping
→ Customs
→ Freight / Insurance / CHA
→ Shipment
→ Export Payment/Realisation Reference
→ Export Closure
```

## 2.2 Export Data

M20 must support the required export data, subject to the existing GNT architecture:

- Exporter/company
- Overseas buyer
- Buyer country
- Buyer address
- Buyer contact details
- Currency
- FX rate
- Incoterms
- Payment terms
- Port of loading
- Port of discharge
- Final destination
- Product/SKU
- Product description
- HSN / tariff classification
- Quantity
- Unit of measure
- Unit price
- Base/FOB value
- Freight
- Marine insurance
- Inland freight
- Packing charges
- CHA charges
- Port charges
- Customs charges
- Applicable country taxes/VAT
- Other export expenses
- Final quotation value
- Final invoice value

---

# 3. M20 — EXPORT QUOTATION & SHIPPING CALCULATION

The quotation engine must support:

```text
Base Product Price
+ Local Inland Freight
+ Packing Charges
+ Port Charges
+ CHA Charges
+ Ocean/Air Freight
+ Marine Insurance
+ Other Export Charges
+ Applicable Country Charges
= Export Quotation / Commercial Value
```

Support:

- Target country
- Currency
- FX rate
- Incoterms
- Payment terms
- LUT / zero-rated export rules as applicable
- Country-wise pricing
- Quote revisions
- Proforma Invoice
- Audit trail

### No hard-coding

Do not hard-code one country, currency, shipping mode, tariff, or tax rate.

Country-specific rules must remain configurable/versioned.

---

# 4. M20 — EXPORT MASTER DATA

M20 should maintain the export-specific master/transaction data required for:

### Buyer

- Overseas buyer
- Country
- Address
- Contact
- Tax/VAT identifier where applicable
- Buyer code/reference

### Product

- Product/SKU
- Description
- Unit
- HSN/tariff classification
- Export price

### Trade Terms

- Currency
- FX rate
- Incoterms
- Payment terms
- Shipping mode
- Ports

### Costing

- Product/base price
- Inland freight
- Packing
- CHA
- Port
- Ocean/Air freight
- Insurance
- Other charges
- Country taxes
- Final export value

---

# 5. M20 — EXPORT DOCUMENT BUNDLE

M20 must support document linkage for:

- Export Quotation
- Proforma Invoice
- Commercial Invoice
- Packing List
- Shipping Bill
- Bill of Lading
- Air Waybill
- Certificate of Origin
- LUT
- Insurance documents
- Customs documents
- Transport documents
- Export payment/realisation references
- e-BRC related references where applicable

Documents must be associated with their export transaction.

---

# 6. M20 — EXPORT WORKFLOW

```text
BUYER
  ↓
EXPORT QUOTATION
  ↓
PROFORMA INVOICE
  ↓
EXPORT ORDER
  ↓
STOCK / PRODUCTION
  ↓
PACKING
  ↓
CHA / PORT
  ↓
CUSTOMS / SHIPPING BILL
  ↓
SHIPMENT
  ↓
BL / AWB
  ↓
COMMERCIAL INVOICE
  ↓
PAYMENT / REALISATION REFERENCE
  ↓
EXPORT CLOSURE
```

---

# 7. M20 — HSN / CUSTOMS / TARIFF OWNERSHIP

**M20 is the Single Source of Truth for Export HSN / Tariff / Customs classification data.**

M20 may maintain:

- HSN/tariff code
- Product classification
- Customs duty
- BCD
- Social Welfare Surcharge
- Applicable customs/international taxes
- Country-specific tariff references
- Effective dates
- Source/reference metadata
- Version/history

### M09 rule

M09 must not create a second independent HSN master.

M09 may consume M20's HSN/tariff data for GST/tax reporting.

---

# 8. M20 — LANDED COST

Where applicable:

```text
Product Cost
+ Freight
+ Insurance
+ Customs Duty
+ Port / CHA
+ Documentation
+ Other Applicable Costs
= Total Landed Cost
```

Then:

```text
Total Landed Cost ÷ Quantity
= Per Unit Landed Cost
```

Historical calculations must remain auditable.

---

# 9. M20 — STRUCTURED INVOICE EXPORT

Where required, support structured invoice export such as:

- UBL
- Peppol-compatible structures
- XML invoice formats
- Country-specific digital invoice profiles

Do not assume one XML profile works for every country.

---

# 10. M20 — REPOSITORY RULE

First inspect the existing repository.

Expected logical location:

```text
backend/src/modules/m20-international-trade/
```

Possible components:

```text
controllers/
  m20-export-quotation.controller.ts

services/
  m20-export-quotation.service.ts
  m20-shipping-calculator.service.ts
  m20-customs-tariff.service.ts
  m20-landed-cost.service.ts

database/schema/
  M20_Customs_Trade.prisma
```

### Critical

If equivalent files already exist:

**UPDATE THEM.**

Do not blindly create duplicate files.

---

# 11. M21 — CLIENT DATA SENSE / UNIVERSAL DATA INTAKE

## 11.1 Core Purpose

M21 has **one primary job**:

> When a new business/client comes to GNT, take the client's existing data file, sense the structure and business data, map it to the GNT architecture, validate it, and prepare/update the appropriate GNT records.

M21 is therefore a:

**CLIENT DATA SENSE + MIGRATION HUB**

It is **not** an accounting/payment module.

---

# 12. M21 — CLIENT SCENARIO

Example:

A new व्यापारी/client joins GNT.

He may have data from:

- Tally
- Vyapar
- Marg
- Excel
- CSV
- Old ERP
- Other business software

The client gives GNT a data file.

For example:

```text
Client_Data.xlsx
```

The user uploads it into M21.

M21 must:

```text
UPLOAD
  ↓
SENSE
  ↓
IDENTIFY DATA
  ↓
MAP TO GNT
  ↓
NORMALIZE
  ↓
VALIDATE
  ↓
DUPLICATE CHECK
  ↓
PREVIEW
  ↓
USER APPROVAL
  ↓
UPDATE / CREATE GNT RECORDS
```

---

# 13. M21 — WHAT "DATA SENSE" MEANS

Data Sense means detecting what the uploaded file contains.

For example:

```text
Party Name
GSTIN
Address
Mobile
Opening Balance
Item Name
Item Code
HSN
Quantity
Sales
Purchase
Date
Invoice Number
Amount
```

M21 identifies these fields and maps them to the correct GNT fields.

Example:

```text
"Party Name"
"Customer Name"
"Ledger Name"
"Account Name"
        ↓
GNT canonical field
party_name
```

Similarly:

```text
GST No
GSTIN
GST Number
        ↓
gstin
```

---

# 14. M21 — NO-HEAVY-AI RULE

M21 should use deterministic Data Sense.

Do not require a heavy external AI API.

Use:

- Header dictionaries
- Alias tables
- Column patterns
- Data type detection
- Format detection
- GSTIN pattern validation
- PAN pattern validation
- Date detection
- Amount detection
- Existing GNT field definitions
- Controlled matching rules

If the system cannot safely identify something:

```text
NEEDS REVIEW
```

Do not guess.

---

# 15. M21 — FULL CLIENT DATA SENSE

M21 should be able to identify multiple data groups from the client's source file(s), including where present:

### Party Data

- Customer
- Supplier
- Party code
- GSTIN
- PAN
- Address
- State
- Pincode
- Mobile
- Email
- Credit information

### Item Data

- Item code
- Item name
- Description
- Unit
- HSN
- Opening stock
- Rate

### Sales Data

- Invoice number
- Date
- Customer
- Item
- Quantity
- Rate
- Tax
- Total

### Purchase Data

- Purchase invoice
- Date
- Supplier
- Item
- Quantity
- Rate
- Tax
- Total

### Accounting Data

- Ledger
- Opening balance
- Debit
- Credit
- Closing balance
- Financial year

### Export Data

Where supplied by the client:

- Overseas buyer
- Country
- Export invoice
- HSN
- Currency
- Export value
- Freight
- Shipping details
- Export documents/references

Export-related data must ultimately be routed to **M20**, not permanently stored as an M21 master.

---

# 16. M21 — DATA ROUTING

M21 is the intake layer.

After approval, data goes to the actual owning module:

| Data sensed from client | Final owner |
|---|---|
| Party | M05 |
| Inventory / Item / Stock | M06 |
| Purchase | M07 |
| Sales | M08 |
| GST reporting data | M09 |
| Accounting / Opening Ledger | Existing Accounting / M10 |
| Payment / Bank data | Existing Accounts / Payment module |
| Export data | M20 |

### Mandatory rule

M21 must not become the permanent owner of these masters.

It only:

**SENSE → MAP → VALIDATE → TRANSFER**

---

# 17. M21 — CLIENT DATA UPDATE

The phrase "GNT में अपडेट हो जाए" means:

After successful validation and approval, M21 must safely update/create the corresponding records in the actual GNT modules.

Example:

```text
Client Excel
   ↓
M21 Data Sense
   ↓
Party detected
   ↓
M05 Party Master
```

Another:

```text
Client Excel
   ↓
M21 Data Sense
   ↓
Opening Ledger detected
   ↓
Existing Accounting / M10
```

Another:

```text
Client Excel
   ↓
M21 Data Sense
   ↓
Export history detected
   ↓
M20 Export
```

---

# 18. M21 — DUPLICATE CHECK

Before updating GNT:

Check existing records using appropriate identifiers:

- GSTIN
- PAN
- Existing party code
- Bank account
- UPI VPA
- Item code
- Invoice number
- External system ID
- Normalized name

Do not automatically merge uncertain records.

---

# 19. M21 — IMPORT PREVIEW

Before final update, show:

```text
Source File
Detected Data Type
Detected Headers
Mapped GNT Fields
Total Records
Valid Records
Duplicate Records
Invalid Records
Unmapped Fields
Needs Review
Target Module
```

The user must approve before final posting/update.

---

# 20. M21 — RESULT STATUS

Use the GNT audit convention:

### GREEN

Safe and ready.

### ORANGE

Needs user review.

### RED

Rejected / invalid / unsafe.

No ambiguous record should silently enter the wrong module.

---

# 21. M21 — PAYMENT EXCLUSION

This section is mandatory.

### DO NOT IMPLEMENT INSIDE M21:

- Bank payment engine
- Receipt engine
- Payment settlement engine
- Party-wise payment posting
- Bank reconciliation engine
- Sales receipt engine
- Purchase payment engine
- Advance settlement engine

These remain in the **existing Accounts / Accounting / Payment module**.

M21 may only **sense/import payment-related historical data as source data** when a client migration requires it, and then transfer that data to the existing payment/accounting owner.

---

# 22. EXISTING ACCOUNTS MODULE — BANK STATEMENT AUTO-POSTING UPDATE

The bank statement automation described for GNT belongs here.

Do not create M21 payment files.

Instead, inspect the existing Accounts/Accounting module and add/update the required files there.

The target workflow is:

```text
BANK STATEMENT
      ↓
EXISTING ACCOUNTS / PAYMENT IMPORT
      ↓
TRANSACTION SENSE
      ↓
CREDIT / DEBIT
      ↓
PARTY IDENTIFICATION
      ↓
SALES RECEIPT / PURCHASE PAYMENT
      ↓
INVOICE MATCH
      ↓
ADVANCE / UNALLOCATED
      ↓
PARTY LEDGER
      ↓
BANK RECONCILIATION
```

---

# 23. MONTHLY BANK STATEMENT

The accountant should be able to upload an entire bank statement for a period.

Example:

```text
01-09-2026 → 30-09-2026
```

One file may contain the whole month.

The system processes all transactions in one batch.

The accountant should not need to manually create every payment/receipt entry.

---

# 24. MONEY RECEIVED — SALES PARTY

Example:

```text
SAI LAXMI TRADERS
Bank Credit: ₹5,000
```

If SAI LAXMI TRADERS is a Sales/Customer party:

```text
Bank +₹5,000
       ↓
Receipt
       ↓
Sales Party Ledger
```

If invoice = ₹4,400:

```text
Invoice              ₹4,400
Receipt              ₹5,000
----------------------------
Invoice allocated    ₹4,400
Advance              ₹  600
```

The full bank amount must be accounted for.

---

# 25. MONEY PAID — PURCHASE PARTY

Example:

```text
ABC SUPPLIERS
Bank Debit: ₹25,000
```

If ABC SUPPLIERS is a Purchase/Supplier party:

```text
Bank -₹25,000
       ↓
Payment
       ↓
Purchase Party Ledger
```

If an exact invoice is unavailable, the amount must be handled through the existing accounting/payment rules as an advance/unallocated supplier payment rather than being lost or blocked.

---

# 26. PARTY IDENTIFICATION

Use deterministic identifiers where available:

1. Party code
2. Bank account
3. UPI VPA
4. UTR
5. Transaction reference
6. GSTIN
7. Normalized party name
8. Bank narration
9. Previously confirmed mapping

Do not rely only on exact narration.

---

# 27. UNKNOWN BANK TRANSACTION

If a party cannot be safely identified:

```text
UNMATCHED / NEEDS REVIEW
```

Example:

```text
Amount: ₹18,750
Narration: XYZ ENTERPRISE

Suggested Party: XYZ Enterprises

[CONFIRM]
[CHANGE PARTY]
[KEEP UNMATCHED]
```

Do not silently post an ambiguous transaction to a wrong party.

---

# 28. BANK DUPLICATE PROTECTION

When a statement is uploaded again, prevent duplicate financial posting using available identifiers such as:

- Bank account
- Statement period
- Date
- Amount
- UTR
- Transaction reference
- Bank transaction ID
- Debit/Credit type

If duplicate status is uncertain:

```text
NEEDS REVIEW
```

---

# 29. ACCOUNTS RECONCILIATION DASHBOARD

The existing Accounts/Payment module should provide:

```text
Total Transactions
Total Credits
Total Debits

Sales Party Receipts
Purchase Party Payments

Matched
Unmatched
Advance Receipts
Advance Payments
Duplicates
Needs Review

Posted
Pending Approval
```

---

# 30. INSTANT SETTLEMENT RESULT

After an authorized posting:

```text
Party Name
Transaction Amount
Transaction Type
Invoice Allocated
Advance Balance
Updated Outstanding
```

Example:

```text
SAI LAXMI TRADERS

Receipt: ₹5,000
Invoice Allocated: ₹4,400
Advance: ₹600

Updated Outstanding: ₹XX,XXX
```

---

# 31. AUDIT TRAIL

Both M21 data migration and Accounts payment posting must maintain audit information.

## M21

Record:

- Source file
- Source row
- Import batch ID
- Detected headers
- Field mapping
- Original value
- Normalized value
- Validation result
- Target module
- Posting/update result
- User
- Timestamp
- Approval status

## Accounts / Payment

Record:

- Bank statement/file
- Source row
- Transaction reference
- Party selected
- Matching method/reason
- Invoice allocation
- Advance amount
- Posting result
- User/system actor
- Timestamp
- Approval status

---

# 32. API OWNERSHIP

## M21

Logical API area:

```text
/api/v1/data-sense/
```

Possible endpoints:

```text
POST /api/v1/data-sense/upload
POST /api/v1/data-sense/header-sense
POST /api/v1/data-sense/map
POST /api/v1/data-sense/validate
POST /api/v1/data-sense/preview
POST /api/v1/data-sense/import
GET  /api/v1/data-sense/import/{id}
```

## M20

Logical API area:

```text
/api/v1/international/
```

## Existing Accounts / Payment

Use the existing Accounts/Payment API namespace.

If no suitable endpoint exists, add it **inside the existing Accounts/Payment module**.

Do not put bank-payment APIs under M21.

---

# 33. DATABASE OWNERSHIP

### M20

Owns export/international-trade tables.

### M21

Owns only data-sense/import/migration process metadata, mappings, batches, validation results, and related temporary/staging information.

### Accounts / Accounting

Owns:

- Bank transactions
- Receipts
- Payments
- Settlement
- Payment allocation
- Advance balances
- Bank reconciliation
- Financial posting

M21 must not create permanent duplicate accounting tables.

---

# 34. REPOSITORY INSPECTION RULE

Before implementation:

1. Inspect existing M20.
2. Inspect existing M21.
3. Locate the existing Accounts/Accounting module.
4. Locate current payment files.
5. Locate current bank import/reconciliation files.
6. Inspect M05/M06/M07/M08/M09/M10 contracts.
7. Identify existing database schemas.
8. Identify duplicate/obsolete files.
9. Update existing files wherever possible.
10. Add only genuinely missing files.

### Do not assume paths.

The repository's actual current structure is authoritative.

---

# 35. IMPLEMENTATION RULE — NO DUPLICATE SYSTEMS

The coder must NOT create:

```text
M21 Payment Engine
M21 Bank Reconciliation
M21 Receipt Engine
M21 Purchase Payment Engine
```

Instead:

```text
M21
= DATA SENSE / MIGRATION ONLY

Existing Accounts
= PAYMENT / BANK / SETTLEMENT
```

---

# 36. COMPLETE DATA-SENSE EXAMPLE

A client gives GNT:

```text
CLIENT_EXPORT.xlsx
```

The file contains:

```text
Party Name
GSTIN
Address
Opening Balance
Item Name
HSN
Sales Invoice
Purchase Invoice
Amount
Date
```

M21 performs:

```text
CLIENT FILE
   ↓
FILE DETECTION
   ↓
HEADER SENSE
   ↓
DATA GROUP DETECTION
   ↓
FIELD MAPPING
   ↓
NORMALIZATION
   ↓
DUPLICATE CHECK
   ↓
VALIDATION
   ↓
PREVIEW
   ↓
USER APPROVAL
   ↓
┌────────┬────────┬────────┬────────┐
M05      M06      M07      M08
Party    Stock    Purchase Sales
   │
   ├── M09 GST data
   ├── Existing Accounts/M10 accounting data
   └── M20 export data if present
```

M21's job ends after controlled transfer/update.

---

# 37. FINAL ARCHITECTURE

```text
                         CLIENT
                           │
                           ↓
                    ┌───────────────┐
                    │      M21      │
                    │  DATA SENSE   │
                    │   & MIGRATION │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
        M05/M06          M07/M08           M20
        Masters         Operations        EXPORT
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ↓
                    EXISTING ACCOUNTS
                         / M10
                            │
                            ↓
                    PAYMENT / BANK
                      / SETTLEMENT
```

---

# 38. FINAL OWNERSHIP RULE — LOCKED

> **M20 = पूरा Export & International Trade Data Hub.**

> **M21 = केवल Client Data Sense, Mapping, Validation और Migration/Update Hub.**

> **Payment/Bank Statement/Receipt/Settlement = Existing Accounts/Accounting module.**

> **M21 payment system नहीं बनाएगा।**

> **अगर Accounts module में बैंक statement auto-posting के लिए नई files/services चाहिए, तो वे उसी existing Accounts/Accounting module में add/update होंगी।**

---

# 39. PRODUCTION ACCEPTANCE

## M20

- [ ] Complete export data
- [ ] Buyer/country
- [ ] Product/HSN
- [ ] Currency/FX
- [ ] Incoterms
- [ ] Export quotation
- [ ] PI
- [ ] Commercial invoice linkage
- [ ] Shipping
- [ ] Customs
- [ ] Freight/insurance/CHA/port
- [ ] Landed cost
- [ ] Export documents
- [ ] Payment/realisation reference
- [ ] HSN single ownership
- [ ] Audit trail

## M21

- [ ] Client file upload
- [ ] Tally/Excel/CSV intake
- [ ] Header sensing
- [ ] Field mapping
- [ ] Data grouping
- [ ] Normalization
- [ ] Duplicate detection
- [ ] Validation
- [ ] Preview
- [ ] Green/Orange/Red
- [ ] Approval
- [ ] Correct-module routing
- [ ] Client data update/migration
- [ ] Audit trail
- [ ] NO payment engine
- [ ] NO bank reconciliation engine
- [ ] NO duplicate accounting database

## Existing Accounts / Accounting

- [ ] Full-month bank statement upload
- [ ] Excel/CSV bank statement processing
- [ ] Credit/debit classification
- [ ] Party identification
- [ ] Sales receipt auto-posting
- [ ] Purchase payment auto-posting
- [ ] Invoice matching
- [ ] Advance handling
- [ ] Unmatched review
- [ ] Duplicate protection
- [ ] Bank reconciliation
- [ ] Settlement result
- [ ] Financial audit trail

---

# 40. FINAL STATUS

```text
M20
→ UPDATE TO COMPLETE EXPORT MASTER HUB

M21
→ UPDATE TO CLIENT DATA SENSE & MIGRATION ONLY

EXISTING ACCOUNTS / ACCOUNTING
→ UPDATE BANK STATEMENT + PARTY-WISE PAYMENT/RECEIPT AUTO-POSTING
```

### Golden Rule

**M21 data को पहचानकर सही जगह पहुँचाएगा।**

**M20 export का पूरा data संभालेगा।**

**Accounts/Accounting payment का पूरा system संभालेगा।**

**एक ही काम के लिए दो modules में दूसरा system नहीं बनाया जाएगा।**

---

## Developer instruction

Implement this specification against the **existing repository**, not against assumptions.

First inspect. Then merge/update. Then validate.

Final report must include:

```text
Changed Files
New Files
Deleted Files (if any)
Database Changes
API Changes
Dependencies
Tests/Validation
Remaining Issues
Production Status
```

No guessing. No duplicate ownership. No duplicate files where an existing equivalent can be updated.
