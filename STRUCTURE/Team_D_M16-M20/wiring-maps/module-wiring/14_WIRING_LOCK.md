# LOCK 14: WIRING LOCK

## M11 Public API Surface
| Consumer | API/Event | Purpose |
|----------|-----------|---------|
| M06 | invoice.sent event | Customer notification |
| M06 | invoice.payment_received event | Customer portal update |
| M10 | ledger entries on payment.completed | Accounting journal |
| M10 | ledger entries on refund.completed | Reversal journal |
| M12 | payroll.generated event -> M11 | Auto-disburse salary |
| M13 | payment.created event | Automation rules |
| M13 | refund.requested event | Approval workflow |
| M13 | reconciliation.created event | Scheduled reconciliation |
| M14 | Import/Export pipe for M11 data | Data migration |
| M15 | All M11 state change events | External sync |

## No Direct Access
- M11 does NOT read M06.customer table
- M11 does NOT read M10.chart_of_accounts table
- M11 does NOT read M12.employee table
- All cross-module via PUBLIC API or Event Bus
