# LOCK 02: API CONTRACT LOCK
Base Path: /api/v1/payments | Version: 2.0.0

## Endpoints Locked
| Method | Path | Auth | Validation |
|--------|------|------|------------|
| GET | /transactions | Yes | - |
| POST | /transactions | Yes | createPaymentSchema |
| GET | /transactions/:id | Yes | - |
| PATCH | /transactions/:id | Yes | updatePaymentSchema |
| DELETE | /transactions/:id | Yes | - |
| POST | /transactions/:id/process | Yes | processPaymentSchema |
| POST | /transactions/:id/fail | Yes | - |
| POST | /transactions/:id/cancel | Yes | - |
| GET | /invoices | Yes | - |
| POST | /invoices | Yes | createInvoiceSchema |
| GET | /invoices/:id | Yes | - |
| PATCH | /invoices/:id | Yes | updateInvoiceSchema |
| DELETE | /invoices/:id | Yes | - |
| POST | /invoices/:id/send | Yes | - |
| POST | /invoices/:id/cancel | Yes | - |
| GET | /refunds | Yes | - |
| POST | /refunds | Yes | createRefundSchema |
| POST | /refunds/:id/approve | Yes | ADMIN only |
| POST | /refunds/:id/reject | Yes | ADMIN only |
| GET | /bank-accounts | Yes | - |
| POST | /bank-accounts | Yes | createBankAccountSchema |
| GET | /reconciliations | Yes | - |
| POST | /reconciliations | Yes | createReconciliationSchema |
| GET | /methods | Yes | - |
| POST | /methods | Yes | createPaymentMethodSchema |

## Response Format
```json
{ "success": true, "data": {}, "meta": { "page", "limit", "total", "totalPages" } }
```
