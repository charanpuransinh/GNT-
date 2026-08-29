# LOCK 01: SCHEMA LOCK
Module: M11 Payment | Team: C | Status: LOCKED
Date: 2026-08-22

## Locked Decisions
- 10 core tables: PaymentMethod, PaymentTransaction, PaymentSchedule, Invoice, InvoiceLineItem, Refund, BankAccount, Reconciliation, ReconciliationItem, LedgerEntry
- Decimal(19,4) for ALL monetary fields
- Tenant isolation: composite index (tenantId, status) on every table
- Audit fields: createdAt/updatedAt/createdBy/updatedBy mandatory on every table
- JSONB flexibility: configJson, metadata, payload fields for extensibility
- Soft delete: NO - hard delete with status states (CANCELLED, WRITTEN_OFF)

## Cross-Module Rules
- M11 NEVER queries M06 Customer table directly
- M11 NEVER queries M10 Ledger/ChartOfAccounts directly
- M11 publishes events; consumers react via PUBLIC API
