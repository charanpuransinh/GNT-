# GNT Enterprise ERP — Dynamic Trade Scheme & WhatsApp Ordering
# MASTER README UPDATE / CODER AI IMPLEMENTATION CONTRACT

> **STATUS:** APPROVED ARCHITECTURE UPDATE
>
> **Decision:** Do NOT create M22 for this feature.
>
> Integrate the feature into the existing **M08 Sales** and **M16 Notification/WhatsApp** modules.
>
> **M21 remains Data Sense / Client Data Migration only.**
>
> **Existing Accounts/Accounting remains the owner of Payment / Bank / Settlement.**

---

# 1. FINAL MODULE PLACEMENT

| Feature | Owner Module | Supporting Module |
|---|---|---|
| Trade Scheme Master | **M08 Sales** | — |
| Volume Rate Override | **M08 Sales** | — |
| Free Item Slab | **M08 Sales** | — |
| Tiered Invoice Discount | **M08 Sales** | — |
| Scheme Application to Sales Order | **M08 Sales** | — |
| Scheme Application to Invoice | **M08 Sales** | — |
| WhatsApp Campaign | **M16 Notification** | M08 Scheme data |
| Professional Scheme Message | **M16** | M08 |
| Secure 1-Click Order Link | **M16** | M08 |
| Buyer Online Order | **M08 Sales** | M16 link |
| Scheme/Rate Validation on Incoming Order | **M08 Sales** | — |
| Old Client Scheme/Rate Data Migration | **M21 Data Sense** | M08 |
| Payment | **Existing Accounts/Accounting** | — |

### HARD RULE

**No M22 is required.**

Do not create a new module merely for this feature.

---

# 2. M08 — DYNAMIC TRADE SCHEME & SALES PRICING ENGINE

## 2.1 Objective

M08 must support configurable trade schemes without requiring an operator to manually change product rates on every order.

The system must automatically determine the applicable scheme based on configured rules.

Supported scheme families:

1. Volume-Based Rate Override
2. Slab-Based Free Items
3. Tiered Value Discount

The architecture must remain extensible for future scheme types.

---

# 3. M08 — VOLUME-BASED RATE OVERRIDE

Example:

```text
Standard Rate = ₹100/unit

Quantity 1–499
→ ₹100/unit

Quantity 500+
→ ₹80/unit
```

The scheme engine should automatically calculate the eligible rate.

### Required behavior

```text
Buyer
 ↓
Product
 ↓
Quantity
 ↓
Active Scheme Check
 ↓
Volume Slab Match
 ↓
Applicable Rate
 ↓
Sales Order
```

The operator should not have to manually overwrite the rate.

---

# 4. M08 — SLAB-BASED FREE ITEMS

Example:

```text
Buy 100 → Get 5 Free

Buy 200 → Get 12 Free
```

The engine must calculate:

```text
Purchased Quantity
+
Free Quantity
=
Total Fulfilment Quantity
```

The system must clearly distinguish:

- Charged quantity
- Free quantity
- Total quantity

Free quantity must not silently become a normal charged quantity.

---

# 5. M08 — TIERED VALUE DISCOUNT

Example:

```text
Invoice Value >= ₹50,000
→ 2% Discount

Invoice Value >= ₹1,00,000
→ 5% Discount

Invoice Value >= ₹2,00,000
→ 8% Discount
```

The system must select the applicable tier according to configured rules.

Rules must be configurable.

Do not hard-code these example values.

---

# 6. M08 — SCHEME MASTER

The Trade Scheme master should support, as appropriate to the existing database architecture:

```text
Scheme ID
Scheme Name
Scheme Type
Status
Start Date
End Date
Applicable Parties / Party Groups
Applicable Products / Product Groups
Minimum Quantity
Maximum Quantity
Rate Override
Free Quantity
Discount %
Minimum Invoice Value
Maximum Invoice Value
Priority
Stacking Rule
Approval Status
Created By
Updated By
Version
```

Use the existing GNT entity/database conventions.

Do not blindly create duplicate Party/Product masters.

---

# 7. M08 — SCHEME ELIGIBILITY

A scheme may be restricted by:

- Customer/Party
- Customer Group
- Product
- Product Group
- Quantity
- Invoice value
- Date validity
- Branch
- Company
- Sales channel
- Other existing GNT dimensions

The actual supported dimensions must follow the existing M08 architecture.

---

# 8. M08 — SCHEME PRIORITY & CONFLICT

If multiple schemes are active, the system must not randomly apply one.

Use explicit configurable:

- Priority
- Eligibility
- Stacking rules

Possible outcomes:

```text
ONE BEST SCHEME
OR
ALLOWED STACK
OR
NEEDS REVIEW
```

Do not silently combine incompatible discounts.

---

# 9. M08 — SALES ORDER INTEGRATION

When a Sales Order is created:

```text
Customer
+
Product
+
Quantity
+
Date
        ↓
Scheme Engine
        ↓
Eligible Scheme
        ↓
Calculated Rate / Free Qty / Discount
        ↓
Sales Order
```

The order should store the scheme reference/version used for calculation.

This is important because a future change to the scheme must not silently rewrite historical orders.

---

# 10. M08 — INVOICE INTEGRATION

When an invoice is generated from an eligible Sales Order:

- Preserve the applicable scheme
- Revalidate according to existing business rules
- Apply calculated pricing
- Apply free-item quantity where applicable
- Apply eligible discount
- Store scheme reference/version

Historical invoices must remain auditable.

---

# 11. M08 — SERVER-SIDE VALIDATION

This is mandatory.

Never trust the rate supplied by:

- Browser
- Mobile application
- WhatsApp link
- URL parameter
- External client

When an order reaches GNT:

```text
Incoming Order
      ↓
M08 Server
      ↓
Identify Party
      ↓
Identify Product
      ↓
Read Current Scheme
      ↓
Check Date
      ↓
Check Quantity
      ↓
Calculate Correct Rate
      ↓
Create Pending Order
```

The client cannot manipulate the URL to obtain an unauthorized price.

---

# 12. M16 — PROFESSIONAL WHATSAPP SCHEME CAMPAIGN

M16 owns the communication/broadcast layer.

M16 must support a professional scheme campaign based on an M08 Trade Scheme.

Example:

```text
M08
Create Scheme
      ↓
M16
Create Campaign
      ↓
Generate Professional Message
      ↓
Target Customer/Party Group
      ↓
WhatsApp Broadcast
```

---

# 13. M16 — CAMPAIGN MESSAGE

The message generator should support:

- Company branding
- Scheme name
- Product
- Offer details
- Validity
- Quantity/slab
- Customer-specific information where allowed
- Secure order link
- Contact information
- Appropriate disclaimer/terms

Do not hard-code one message format.

Use configurable templates.

---

# 14. M16 — TARGETED PARTY GROUPS

Campaign targeting may use existing GNT party/group capabilities.

Examples:

```text
All Retailers
All Distributors
Ahmedabad Dealers
Product-X Buyers
Inactive Customers
Specific Customer Group
```

Use existing Party data from M05.

M16 must not create a duplicate Party Master.

---

# 15. M16 → M08 ORDER LINK

The campaign may contain a secure order link.

Conceptually:

```text
WhatsApp
   ↓
Secure Order Link
   ↓
GNT Order Page
   ↓
Party Identification
   ↓
Scheme Identification
   ↓
Product / Quantity
   ↓
M08 Scheme Recalculation
   ↓
Pending Order
```

The link must not expose trusted pricing as an editable client-side value.

---

# 16. BUYER SELF-ORDERING

Buyer clicks the campaign link.

The buyer should be able to:

- See eligible product/scheme
- Select quantity
- See applicable offer
- Submit order

The order must initially enter:

```text
M08 → PENDING ORDERS
```

It should not bypass existing Sales approval/business rules.

---

# 17. ORDER SECURITY

Order links must use secure identifiers/tokens.

Do not expose:

- Internal database IDs unnecessarily
- Authentication secrets
- API keys
- Private party data
- Editable trusted rates

Validate:

- Token validity
- Expiry
- Party eligibility
- Scheme status
- Product eligibility
- Quantity limits
- Campaign status

---

# 18. M08 — PENDING ORDER FLOW

Final flow:

```text
M16 Campaign
      ↓
Buyer clicks link
      ↓
M08 Order Page
      ↓
Buyer selects quantity
      ↓
M08 server-side Scheme Engine
      ↓
Rate / Free Item / Discount calculated
      ↓
Pending Order created
      ↓
Existing Sales approval workflow
      ↓
Sales Order / Invoice
```

---

# 19. M21 — LIMITED SUPPORT ONLY

M21 is still:

# UNIVERSAL CLIENT DATA SENSE & MIGRATION HUB

M21 must NOT become a Trade Scheme engine.

M21 may only be used when a new client brings old data containing:

- Old rate lists
- Customer-specific rates
- Trade schemes
- Volume slabs
- Free-item schemes
- Discount tables

M21 can:

```text
Sense
→ Map
→ Normalize
→ Validate
→ Preview
→ Approve
→ Transfer
```

Then the approved scheme/rate data goes to:

```text
M08 Trade Scheme / Sales Pricing
```

M21's job ends after the controlled transfer.

---

# 20. M21 — EXAMPLE

Client provides:

```text
OLD_TRADE_SCHEME.xlsx
```

with:

```text
Customer
Product
Min Qty
Rate
Free Qty
Discount
Start Date
End Date
```

M21 detects:

```text
Customer → Party
Product → Item
Min Qty → Scheme Minimum Quantity
Rate → Rate Override
Free Qty → Free Quantity
Discount → Discount %
```

Then:

```text
M21
Data Sense
   ↓
Validation
   ↓
Preview
   ↓
Approval
   ↓
M08 Trade Scheme Master
```

M21 does not calculate live sales prices.

M08 does.

---

# 21. PAYMENT ARCHITECTURE — UNCHANGED

This feature must NOT move Payment into M21.

Payment remains in the existing Accounts/Accounting module.

The architecture remains:

```text
M21
Data Sense / Migration
        ↓
Existing Accounts
Payment / Bank / Settlement
```

The previously approved bank-statement automation also remains in the existing Accounts/Accounting module.

---

# 22. DATABASE OWNERSHIP

### M08 owns:

- Trade Scheme
- Scheme Rules
- Scheme Slabs
- Scheme Versions
- Scheme Applicability
- Sales Order scheme reference
- Invoice scheme reference

### M16 owns:

- Campaign
- Campaign Template
- Broadcast
- Campaign Recipient/targeting metadata
- Secure Order Link metadata where appropriate

### M21 owns:

- Import Batch
- Source File metadata
- Data Sense result
- Mapping
- Validation
- Migration status
- Import errors/warnings

### Accounts owns:

- Bank transactions
- Payments
- Receipts
- Settlements
- Reconciliation

Do not duplicate these masters.

---

# 23. API OWNERSHIP

First inspect existing API routes.

Logical additions may be:

### M08

```text
POST /api/v1/sales/schemes
GET  /api/v1/sales/schemes
PUT  /api/v1/sales/schemes/{id}
POST /api/v1/sales/schemes/{id}/activate
POST /api/v1/sales/schemes/calculate
POST /api/v1/sales/orders
POST /api/v1/sales/orders/public
```

### M16

```text
POST /api/v1/notifications/whatsapp/campaigns
POST /api/v1/notifications/whatsapp/campaigns/{id}/broadcast
POST /api/v1/notifications/whatsapp/order-links
```

### M21

No scheme/payment APIs.

M21 retains only its Data Sense/Migration APIs.

**Do not blindly create these routes if equivalent existing routes already exist. Merge with the current contract.**

---

# 24. EXPECTED LOGICAL FILE AREAS

Inspect the current repository first.

Possible M08 additions:

```text
m08-sales/
  services/
    trade-scheme.service.ts
    scheme-calculator.service.ts
    scheme-eligibility.service.ts
  controllers/
    trade-scheme.controller.ts
```

Possible M16 additions:

```text
m16-notification/
  services/
    whatsapp-campaign.service.ts
    whatsapp-order-link.service.ts
    scheme-message-template.service.ts
  controllers/
    whatsapp-campaign.controller.ts
```

Possible M21 integration:

```text
m21-data-sense/
  services/
    trade-scheme-import-mapper.service.ts
```

Only create these if equivalent functionality does not already exist.

---

# 25. EVENT FLOW

Expected logical events:

```text
SCHEME_CREATED
SCHEME_ACTIVATED
SCHEME_UPDATED
SCHEME_EXPIRED

CAMPAIGN_CREATED
CAMPAIGN_BROADCAST_REQUESTED
CAMPAIGN_BROADCASTED

ORDER_LINK_CREATED
SELF_ORDER_RECEIVED
SCHEME_RECALCULATED
PENDING_ORDER_CREATED

SCHEME_IMPORT_STARTED
SCHEME_IMPORT_VALIDATED
SCHEME_IMPORT_APPROVED
SCHEME_IMPORT_POSTED
```

Follow existing GNT event naming conventions.

Do not create duplicate event buses.

---

# 26. PERMISSIONS

Use existing GNT RBAC.

At minimum distinguish:

### M08

- Create scheme
- Edit scheme
- Activate/deactivate scheme
- Approve scheme
- View scheme
- Apply scheme
- Override scheme where permitted

### M16

- Create campaign
- Select recipients
- Broadcast
- View campaign status

### M21

- Import
- Map
- Validate
- Approve migration

No parallel authentication/permission system.

---

# 27. AUDIT REQUIREMENTS

For every scheme calculation and material transaction, retain sufficient information to determine:

- Which scheme was used
- Scheme version
- Party
- Product
- Quantity
- Original rate
- Applied rate
- Free quantity
- Discount
- Timestamp
- Source order/campaign
- User/system actor

Campaign records should retain:

- Campaign
- Template
- Target group
- Broadcast status
- Order-link reference
- Timestamp

---

# 28. TEST CASES

## Volume Rate

```text
Standard = ₹100
Quantity = 499
Expected = ₹100

Quantity = 500
Expected = ₹80
```

## Free Item

```text
Buy 100
Expected Free = 5
```

## Value Discount

```text
Invoice = ₹49,999
Expected = No 2% tier

Invoice = ₹50,000
Expected = 2% tier
```

## Expired Scheme

```text
Scheme expired
→ Must not apply
```

## Ineligible Party

```text
Party not eligible
→ Must not apply
```

## Manipulated Order Rate

```text
Client sends unauthorized rate
→ Server recalculates
→ Unauthorized rate rejected
```

## WhatsApp Self Order

```text
Campaign Link
→ Buyer
→ M08
→ Scheme recalculation
→ Pending Order
```

## M21 Scheme Import

```text
Old Excel
→ M21 Sense
→ Map
→ Validate
→ Approve
→ M08 Scheme Master
```

## Payment Boundary

```text
Bank Statement
→ Existing Accounts
NOT M21
```

---

# 29. PRODUCTION ACCEPTANCE CHECKLIST

## M08

- [ ] Trade Scheme Master
- [ ] Volume Rate Override
- [ ] Free Item Slabs
- [ ] Tiered Value Discount
- [ ] Scheme Eligibility
- [ ] Scheme Priority
- [ ] Stacking Rules
- [ ] Scheme Versioning
- [ ] Sales Order integration
- [ ] Invoice integration
- [ ] Server-side recalculation
- [ ] Audit trail

## M16

- [ ] Professional scheme templates
- [ ] Branding support
- [ ] Targeted party groups
- [ ] WhatsApp broadcast
- [ ] Secure order links
- [ ] Campaign tracking
- [ ] M08 integration

## M21

- [ ] Client Data Sense
- [ ] Old scheme/rate data detection
- [ ] Mapping to M08
- [ ] Validation
- [ ] Preview
- [ ] Approval
- [ ] Migration audit
- [ ] NO payment engine
- [ ] NO bank reconciliation

## Existing Accounts

- [ ] Payment remains here
- [ ] Bank statement remains here
- [ ] Receipt remains here
- [ ] Settlement remains here
- [ ] Party-wise payment posting remains here

---

# 30. FINAL ARCHITECTURE — LOCKED

```text
                    ┌─────────────────────┐
                    │        M21          │
                    │ CLIENT DATA SENSE   │
                    │     & MIGRATION     │
                    └──────────┬──────────┘
                               │
                    Old Scheme/Rate Data
                               │
                               ↓
                    ┌─────────────────────┐
                    │        M08          │
                    │ SALES + TRADE       │
                    │ SCHEME ENGINE       │
                    └──────────┬──────────┘
                               │
                       Scheme / Order
                               │
                               ↓
                    ┌─────────────────────┐
                    │        M16          │
                    │ WHATSAPP CAMPAIGN   │
                    │ & ORDER LINK        │
                    └──────────┬──────────┘
                               │
                          Buyer Order
                               │
                               ↓
                         M08 Pending Order


Existing Accounts / Accounting
        │
        ├── Bank Statement
        ├── Receipt
        ├── Payment
        ├── Settlement
        └── Reconciliation
```

---

# 31. GOLDEN RULES

> **RULE 1 — No M22.**

> **RULE 2 — Trade Scheme belongs to M08.**

> **RULE 3 — WhatsApp Campaign belongs to M16.**

> **RULE 4 — Buyer Self-Ordering lands in M08 Pending Orders.**

> **RULE 5 — M08 must recalculate and validate scheme pricing server-side.**

> **RULE 6 — M21 only senses/imports/migrates old client data.**

> **RULE 7 — M21 may migrate old scheme/rate data into M08, but does not own live scheme calculation.**

> **RULE 8 — Payment/Bank/Settlement remains in the existing Accounts/Accounting module.**

> **RULE 9 — Do not duplicate existing modules, databases, authentication, party masters, item masters, payment engines, or event buses.**

> **RULE 10 — Inspect the existing repository first, then update existing files wherever possible.**

> **RULE 11 — No guessing. Ambiguous data must go to review.**

> **RULE 12 — Every financial/scheme calculation must remain auditable.**

---

# 32. CODER AI EXECUTION PLAN

### Step 1

Inspect the existing repository and identify:

```text
M08
M16
M21
Existing Accounts/Accounting
M05 Party
M06 Inventory
M07 Purchase
M10 Accounting/Ledger
```

### Step 2

Identify existing scheme, pricing, notification, WhatsApp, order, Data Sense and accounting files.

### Step 3

Do not create M22.

### Step 4

Update M08 with Trade Scheme Engine.

### Step 5

Update M16 with WhatsApp Campaign + Secure Order Link.

### Step 6

Keep M21 strictly Data Sense/Migration.

### Step 7

If old client scheme/rate data is detected by M21, transfer approved data into M08.

### Step 8

Keep Bank Statement / Payment / Receipt / Settlement inside the existing Accounts/Accounting module.

### Step 9

Add only missing files/services inside their existing owning modules.

### Step 10

Run complete validation and report:

```text
Changed Files
New Files
Deleted Files
Database Changes
API Changes
Event Changes
Permission Changes
Tests
Remaining Problems
Production Status
```

---

# 33. FINAL IMPLEMENTATION STATUS

```text
M08
→ DYNAMIC TRADE SCHEME & SALES PRICING
→ IMPLEMENT / UPDATE

M16
→ WHATSAPP CAMPAIGN + SECURE SELF-ORDER LINK
→ IMPLEMENT / UPDATE

M21
→ CLIENT DATA SENSE & MIGRATION ONLY
→ KEEP PAYMENT OUT

EXISTING ACCOUNTS
→ PAYMENT + BANK STATEMENT + RECEIPT + SETTLEMENT
→ KEEP AND UPDATE HERE IF REQUIRED

M22
→ NOT CREATED
```

## FINAL DECISION

**This feature is integrated into M08 + M16.**

**M21 remains only the Client Data Sense/Migration gateway.**

**Payment remains exactly where the existing Accounts/Accounting architecture owns it.**

**Do not disturb working modules unnecessarily. Update existing files first; create new files only where genuinely required.**
