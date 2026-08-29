# LOCK 08: EVENTS LOCK
Event Bus: In-memory async (production: Redis/RabbitMQ)

## Published Events (M11 -> Others)
- payment.created -> M13 Rules engine, M15 Sync
- payment.completed -> M10 Journal entries, M13 Automation, M15 Sync
- payment.failed -> M13 Alert rules, M15 Sync
- invoice.created -> M13 Workflow, M15 Sync, M06 Notification
- invoice.sent -> M06 Email service, M15 Sync
- invoice.payment_received -> M06 Customer portal update
- refund.requested -> M13 Approval workflow, M15 Sync
- refund.completed -> M10 Reversal entries, M15 Sync
- bank_account.created -> M15 Sync
- reconciliation.created -> M13 Scheduled job, M15 Sync

## Consumed Events (Others -> M11)
- payroll.generated (M12) -> auto-disburse payment
- stock.low (M07/M08) -> M13 rule -> auto-reorder payment
- customer.created (M06) -> update payer info
