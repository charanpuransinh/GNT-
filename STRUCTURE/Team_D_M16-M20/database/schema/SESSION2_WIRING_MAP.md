# ============================================================
# GNT MASTER BLUEPRINT V2 — SESSION 2 WIRING MAP
# Module Owner: TEAM C (M11-M15) | Session 2: Database + API Contracts
# Lock Artifact: TEAM_C_SESSION2_WIRING_MAP_v2.0.0
# ============================================================

## 1. MODULE BOUNDARIES & ENFORCEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TEAM C MODULE BOUNDARIES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  M11 PAYMENT  │  M12 HR       │  M13 AUTOMATION │  M14 IMPORT/EXPORT │ M15 SYNC │
├───────────────┼───────────────┼─────────────────┼────────────────────┼──────────┤
│  Owns:        │  Owns:        │  Owns:          │  Owns:             │  Owns:   │
│  - txn        │  - employee   │  - workflow     │  - import jobs     │  - sync  │
│  - methods    │  - dept       │  - rules        │  - export jobs     │    config│
│  - schedules  │  - attendance │  - scheduled    │  - mappings        │  - jobs  │
│  - bank accts │  - leaves     │    jobs         │  - file uploads    │  - state │
│  - refunds    │  - payroll    │  - webhooks     │  - transforms      │  - ext   │
│  - reconcile  │  - shifts     │  - executions   │                    │    integ │
│               │  - holidays   │                 │                    │          │
└───────────────┴───────────────┴─────────────────┴────────────────────┴──────────┘
```

**GOLDEN RULE:** No module reads/writes another module's DB tables directly.
All cross-module communication happens via `PUBLIC API` layer only.

---

## 2. CROSS-MODULE CALL MATRIX

### M11 PAYMENT — Public APIs Consumed By Others

| Consumer Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **M07 Sales** | `POST /public/m11/record-payment` | Record customer receipt against invoice |
| **M08 Purchase** | `POST /public/m11/record-payment` | Record vendor payment against bill |
| **M12 HR** | `POST /public/m11/record-payment` | Process payroll payments to employees |
| **M10 Finance** | `GET /public/m11/party-balance` | Ledger reconciliation, balance confirmation |
| **M06 Party** | `GET /public/m11/party-balance` | Show party outstanding on profile |
| **M13 Automation** | `POST /public/m11/record-payment` | Auto-pay recurring invoices via scheduled job |
| **M15 Sync** | `GET /public/m11/transaction-by-reference` | Sync payment status with external ERP |

### M11 PAYMENT — APIs It Consumes From Others

| Provider Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **M10 Finance** | `GET /public/m10/account-by-code` | Get GL account for ledger entry |
| **M10 Finance** | `POST /public/m10/journal-entry` | Post double-entry for each transaction |
| **M06 Party** | `GET /public/m06/party/{id}` | Validate party exists, get contact info |
| **M14 Import** | `POST /public/m14/upload` | Upload bank statement for reconciliation |

---

### M12 HR — Public APIs Consumed By Others

| Consumer Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **M11 Payment** | `GET /public/m12/employee-basic/{id}` | Get bank details for payroll payment |
| **M11 Payment** | `GET /public/m12/attendance-summary` | Calculate payable days |
| **M13 Automation** | `GET /public/m12/leave-balance` | Workflow validation before leave approval |
| **M10 Finance** | `GET /public/m12/payroll-summary` | Post payroll journal entries |
| **M13 Automation** | `GET /public/m12/employee-basic/{id}` | Approval routing (reporting manager) |
| **M15 Sync** | `GET /public/m12/employee-basic/{id}` | Sync employee master to external HRMS |

### M12 HR — APIs It Consumes From Others

| Provider Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **M11 Payment** | `POST /public/m11/record-payment` | Execute payroll payments after approval |
| **M11 Payment** | `GET /public/m11/bank-accounts` | Validate bank account for salary disbursement |
| **M13 Automation** | `POST /public/m13/trigger-workflow` | Trigger leave approval workflow |
| **M13 Automation** | `POST /public/m13/publish-event` | Publish "payroll generated" event |
| **M04 Auth** | `GET /public/m04/users/{id}` | Get user details for approval hierarchy |
| **M10 Finance** | `GET /public/m10/cost-center/{code}` | Validate department cost center |

---

### M13 AUTOMATION — Public APIs Consumed By Others

| Consumer Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **ALL MODULES** | `POST /public/m13/publish-event` | Publish business events to trigger rules |
| **ALL MODULES** | `POST /public/m13/trigger-workflow` | Start approval/workflows programmatically |
| **M07 Sales** | `GET /public/m13/pending-approvals` | Dashboard: pending invoice approvals |
| **M12 HR** | `GET /public/m13/pending-approvals` | Dashboard: pending leave approvals |
| **M15 Sync** | `POST /public/m13/register-webhook` | Register external system webhooks |
| **M11 Payment** | `POST /public/m13/publish-event` | Payment status change → auto-reconcile |

### M13 AUTOMATION — APIs It Consumes From Others

| Provider Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **M11 Payment** | `POST /public/m11/record-payment` | Action: Auto-pay approved invoices |
| **M12 HR** | `GET /public/m12/employee-basic/{id}` | Action: Send notification to employee |
| **M07 Sales** | `GET /public/m07/invoice/{id}` | Condition: Check invoice overdue status |
| **M08 Purchase** | `GET /public/m08/po/{id}` | Condition: Check PO approval limit |
| **M14 Export** | `POST /public/m14/export` | Action: Auto-generate daily reports |
| **M15 Sync** | `POST /public/m15/sync-entity` | Action: Push approved data to external system |
| **M09 Inventory** | `GET /public/m09/stock/{itemId}` | Condition: Check low stock trigger |
| **M10 Finance** | `GET /public/m10/account-balance` | Condition: Check budget threshold |

---

### M14 IMPORT/EXPORT — Public APIs Consumed By Others

| Consumer Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **M05 Item** | `POST /public/m14/import` | Bulk import items from Excel |
| **M06 Party** | `POST /public/m14/import` | Bulk import customers/suppliers |
| **M07 Sales** | `POST /public/m14/import` | Bulk import sales orders |
| **M12 HR** | `POST /public/m14/import` | Bulk import employee attendance |
| **ALL MODULES** | `POST /public/m14/export` | Export module data to CSV/Excel/PDF |
| **ALL MODULES** | `POST /public/m14/upload` | Upload supporting documents |
| **M11 Payment** | `POST /public/m14/import` | Import bank statement for reconciliation |
| **M15 Sync** | `POST /public/m14/export` | Export data for external system sync |

### M14 IMPORT/EXPORT — APIs It Consumes From Others

| Provider Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **M05 Item** | `POST /public/m05/items/bulk` | Write imported items (via public API) |
| **M06 Party** | `POST /public/m06/parties/bulk` | Write imported parties |
| **M07 Sales** | `POST /public/m07/invoices/bulk` | Write imported invoices |
| **M12 HR** | `POST /public/m12/attendance/bulk` | Write imported attendance |
| **M13 Automation** | `POST /public/m13/publish-event` | Notify import completion |
| **M04 Auth** | `GET /public/m04/permissions` | Validate user has import permission |

---

### M15 SYNC — Public APIs Consumed By Others

| Consumer Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **M10 Finance** | `POST /public/m15/sync-entity` | Sync journal entries to Tally/Zoho |
| **M07 Sales** | `POST /public/m15/sync-entity` | Sync invoices to external CRM |
| **M11 Payment** | `GET /public/m15/integration-health` | Check payment gateway health |
| **M12 HR** | `POST /public/m15/sync-entity` | Sync employees to external HRMS |
| **M13 Automation** | `POST /public/m15/sync-entity` | Scheduled sync via automation rules |
| **ALL MODULES** | `GET /public/m15/sync-states` | Check last sync timestamp |

### M15 SYNC — APIs It Consumes From Others

| Provider Module | API Endpoint | Purpose |
|-----------------|-------------|---------|
| **M05 Item** | `GET /public/m05/items` | Read items for sync to external |
| **M06 Party** | `GET /public/m06/parties` | Read parties for sync |
| **M07 Sales** | `GET /public/m07/invoices` | Read invoices for sync |
| **M10 Finance** | `GET /public/m10/journals` | Read journals for sync |
| **M11 Payment** | `GET /public/m11/transactions` | Read payments for sync |
| **M12 HR** | `GET /public/m12/employees` | Read employees for sync |
| **M14 Export** | `POST /public/m14/export` | Export data in external format |
| **M13 Automation** | `POST /public/m13/publish-event` | Publish sync success/failure events |

---

## 3. EVENT-DRIVEN ARCHITECTURE (Async)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EVENT BUS (Redis/RabbitMQ)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  M07 Sales ──► invoice.created ───────────────────────────────► M13 Rules   │
│                              └────────────────────────────────► M15 Sync    │
│                                                                             │
│  M08 Purchase ──► po.approved ────────────────────────────────► M13 Workflow│
│                              └────────────────────────────────► M15 Sync    │
│                                                                             │
│  M11 Payment ──► payment.completed ───────────────────────────► M13 Rules   │
│                              └────────────────────────────────► M10 Journal │
│                              └────────────────────────────────► M15 Sync    │
│                                                                             │
│  M12 HR ──► leave.applied ────────────────────────────────────► M13 Workflow│
│         ──► payroll.generated ────────────────────────────────► M11 Payment │
│         ──► payroll.paid ─────────────────────────────────────► M13 Rules   │
│                                                                             │
│  M09 Inventory ──► stock.low ─────────────────────────────────► M13 Rules   │
│                                                                             │
│  M13 Automation ──► workflow.step.completed ──────────────────► M13 Webhook │
│                                                                             │
│  M15 Sync ──► sync.conflict.detected ─────────────────────────► M13 Rules   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Event Payload Contracts

```typescript
// invoice.created (Published by M07, Consumed by M13, M15)
interface InvoiceCreatedEvent {
  eventType: "INVOICE.CREATED";
  sourceModule: "M07";
  payload: {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    amount: string;
    dueDate: string;
    tenantId: string;
  };
  timestamp: string;
}

// payment.completed (Published by M11, Consumed by M07, M10, M13)
interface PaymentCompletedEvent {
  eventType: "PAYMENT.COMPLETED";
  sourceModule: "M11";
  payload: {
    transactionId: string;
    transactionNumber: string;
    referenceType: string;
    referenceId: string;
    amount: string;
    partyId: string;
    partyName: string;
    tenantId: string;
  };
  timestamp: string;
}

// leave.applied (Published by M12, Consumed by M13)
interface LeaveAppliedEvent {
  eventType: "LEAVE.APPLIED";
  sourceModule: "M12";
  payload: {
    leaveId: string;
    leaveNumber: string;
    employeeId: string;
    employeeName: string;
    leaveType: string;
    days: number;
    startDate: string;
    endDate: string;
    tenantId: string;
  };
  timestamp: string;
}

// payroll.generated (Published by M12, Consumed by M11)
interface PayrollGeneratedEvent {
  eventType: "PAYROLL.GENERATED";
  sourceModule: "M12";
  payload: {
    payrollId: string;
    payrollNumber: string;
    employeeId: string;
    employeeName: string;
    netPay: string;
    month: number;
    year: number;
    tenantId: string;
  };
  timestamp: string;
}
```

---

## 4. DATA FLOW DIAGRAMS

### Flow 1: Invoice → Payment → Journal (M07 → M11 → M10)

```
M07 Sales Module                          M11 Payment Module                    M10 Finance Module
─────────────────────────────────────────────────────────────────────────────────────────────────────
     │                                           │                                       │
     │  1. Create Invoice                        │                                       │
     │──────────────────────────────────────────>│                                       │
     │                                           │                                       │
     │  2. Publish: invoice.created              │                                       │
     │──────────────────────┐                    │                                       │
     │                      │                    │                                       │
     │                      ▼                    │                                       │
     │               [Event Bus]                 │                                       │
     │                      │                    │                                       │
     │                      │                    │  3. M13 Rule: "If invoice > 1L,      │
     │                      │                    │     require approval"                │
     │                      │                    │                                       │
     │                      │                    │  4. User approves via M13 Workflow    │
     │                      │                    │                                       │
     │                      │                    │  5. Record Payment (Customer pays)    │
     │                      │                    │     POST /public/m11/record-payment   │
     │                      │                    │<──────────────────────────────────────│
     │                      │                    │                                       │
     │                      │                    │  6. Payment Transaction Created       │
     │                      │                    │     Status: COMPLETED                 │
     │                      │                    │                                       │
     │                      │                    │  7. Publish: payment.completed        │
     │                      │                    │──────────────────────┐                │
     │                      │                    │                      │                │
     │                      │                    │                      ▼                │
     │                      │                    │               [Event Bus]               │
     │                      │                    │                      │                │
     │                      │                    │                      │                │
     │                      │                    │                      │  8. Consume event│
     │                      │                    │                      │────────────────>│
     │                      │                    │                      │                │
     │                      │                    │                      │  9. POST /public│
     │                      │                    │                      │     /m10/journal│
     │                      │                    │                      │     -entry      │
     │                      │                    │                      │<───────────────│
     │                      │                    │                      │                │
     │                      │                    │                      │ 10. GL Updated  │
     │                      │                    │                      │                │
     ▼                      ▼                    ▼                      ▼                ▼
```

### Flow 2: Leave Apply → Workflow → Approval → Attendance Update (M12 → M13)

```
M12 HR Module                             M13 Automation Module
─────────────────────────────────────────────────────────────────────────────
     │                                           │
     │  1. Apply Leave                           │
     │  POST /m12/leaves/apply                   │
     │──────────────────────────────────────────>│
     │                                           │
     │  2. Publish: leave.applied                │
     │──────────────────────┐                    │
     │                      │                    │
     │                      ▼                    │
     │               [Event Bus]                 │
     │                      │                    │
     │                      │                    │
     │                      │  3. Consume event  │
     │                      │───────────────────>│
     │                      │                    │
     │                      │  4. Trigger Workflow│
     │                      │    "LEAVE_APPROVAL" │
     │                      │                    │
     │                      │  5. Route to Manager│
     │                      │    for Approval     │
     │                      │                    │
     │                      │  6. Manager APPROVES│
     │                      │    via UI           │
     │                      │                    │
     │                      │  7. Act on Step     │
     │                      │    POST /public/    │
     │                      │    m13/.../act      │
     │                      │                    │
     │                      │  8. Publish:        │
     │                      │    leave.approved   │
     │                      │───────────────────>│
     │                      │                    │
     │  9. Consume: leave.approved               │
     │<─────────────────────│                    │
     │                                           │
     │ 10. Update leave status = APPROVED        │
     │     Update attendance for leave days      │
     │                                           │
     ▼                                           ▼
```

### Flow 3: Payroll Generate → Payment → Sync (M12 → M11 → M15)

```
M12 HR Module         M11 Payment Module         M13 Automation        M15 Sync Module
─────────────────────────────────────────────────────────────────────────────────────────
     │                       │                           │                       │
     │ 1. Generate Payroll   │                           │                       │
     │    (month-end cron)   │                           │                       │
     │──────────────────────>│                           │                       │
     │                       │                           │                       │
     │ 2. Publish:           │                           │                       │
     │    payroll.generated  │                           │                       │
     │───────────────────────┼──────────────────────────>│                       │
     │                       │                           │                       │
     │                       │ 3. M13 Rule: "Auto-pay    │                       │
     │                       │    payroll on 1st"        │                       │
     │                       │                           │                       │
     │                       │ 4. POST /public/m11/      │                       │
     │                       │    record-payment         │                       │
     │                       │    (batch payment)        │                       │
     │                       │<──────────────────────────│                       │
     │                       │                           │                       │
     │                       │ 5. Payments processed     │                       │
     │                       │    Status: COMPLETED      │                       │
     │                       │                           │                       │
     │                       │ 6. Publish: payroll.paid  │                       │
     │                       │───────────────────────────┼──────────────────────>│
     │                       │                           │                       │
     │                       │                           │                       │ 7. Sync
     │                       │                           │                       │    to Tally
     │                       │                           │                       │
     ▼                       ▼                           ▼                       ▼
```

---

## 5. DATABASE TABLE COUNT SUMMARY

| Module | Tables | Key Tables |
|--------|--------|-----------|
| **M11 Payment** | 8 | payment_methods, payment_transactions, payment_allocations, payment_schedules, payment_installments, refunds, bank_accounts, payment_reconciliations |
| **M12 HR** | 10 | employees, departments, designations, shifts, attendance, leave_types, leaves, holidays, payrolls, payroll_templates |
| **M13 Automation** | 8 | workflows, workflow_steps, workflow_executions, workflow_step_logs, scheduled_jobs, automation_rules, automation_logs, webhook_endpoints, webhook_deliveries |
| **M14 Import/Export** | 6 | import_jobs, import_mappings, import_error_logs, export_jobs, export_templates, data_transforms, file_uploads |
| **M15 Sync** | 7 | sync_configs, sync_entity_configs, sync_jobs, sync_entity_logs, sync_conflicts, external_integrations, sync_states |
| **TOTAL** | **39** | |

---

## 6. LOCK ARTIFACTS CHECKLIST (Session 2)

| # | Lock Artifact | File | Status |
|---|---------------|------|--------|
| 1 | M11_DB_SCHEMA_v2.0.0 | `prisma/M11_Payment.prisma` | ✅ |
| 2 | M12_DB_SCHEMA_v2.0.0 | `prisma/M12_HR.prisma` | ✅ |
| 3 | M13_DB_SCHEMA_v2.0.0 | `prisma/M13_Automation.prisma` | ✅ |
| 4 | M14_DB_SCHEMA_v2.0.0 | `prisma/M14_ImportExport.prisma` | ✅ |
| 5 | M15_DB_SCHEMA_v2.0.0 | `prisma/M15_Sync.prisma` | ✅ |
| 6 | M11-M15_API_CONTRACTS_v2.0.0 | `contracts/api-contracts.ts` | ✅ |
| 7 | M11-M15_ZOD_SCHEMAS_v2.0.0 | `validation/zod-schemas.ts` | ✅ |
| 8 | TEAM_C_SESSION2_WIRING_MAP_v2.0.0 | `SESSION2_WIRING_MAP.md` | ✅ |

---

## 7. NEXT SESSIONS PREVIEW

| Session | Focus | Modules | Deliverables |
|---------|-------|---------|-------------|
| **Session 3** | M11 Backend | Payment | Controllers, Services, Repositories, Routes |
| **Session 4** | M11 Frontend | Payment | React Components, Zustand Store, Forms |
| **Session 5** | M12 Backend | HR | Controllers, Services, Repositories, Routes |
| **Session 6** | M12 Frontend | HR | React Components, Zustand Store, Forms |
| **Session 7** | M13 Backend | Automation | Workflow engine, Rule engine, Scheduler |
| **Session 8** | M13 Frontend | Automation | Workflow builder UI, Rule configurator |
| **Session 9** | M14 Backend | Import/Export | CSV/XLSX parsers, bulk processors |
| **Session 10** | M14 Frontend | Import/Export | Upload UI, mapping designer, progress |
| **Session 11** | M15 Backend | Sync | Sync engine, conflict resolver, connectors |
| **Session 12** | M15 Frontend | Sync | Sync config UI, conflict resolution panel |
| **Session 13** | Tests + Wiring | M11-M15 | Unit tests, integration tests, wiring maps |
| **Session 14** | Lock + ZIP | M11-M15 | Final packages, lock artifacts, ZIP export |
