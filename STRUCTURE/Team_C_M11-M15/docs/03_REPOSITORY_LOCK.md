# LOCK 03: REPOSITORY LOCK
Pattern: Repository per entity | Transaction Safety: REQUIRED

## Rules
- Every query MUST include tenantId filter
- Multi-table operations MUST use prisma.$transaction
- Decimal inputs MUST pass through toDecimal() helper
- No business logic in repositories - pure data access only
- Return types: Entity | Entity[] | { data, total } for paginated

## Repositories
1. PaymentRepository - PaymentTransaction CRUD + aggregations
2. InvoiceRepository - Invoice + LineItems + auto-number generation
3. RefundRepository - Refund lifecycle (request -> approve -> complete)
4. BankAccountRepository - Account CRUD + balance updates
5. ReconciliationRepository - Recon + items + auto-match
6. LedgerRepository - M10 integration entries (read-only from M11)
7. PaymentMethodRepository - Method configuration
