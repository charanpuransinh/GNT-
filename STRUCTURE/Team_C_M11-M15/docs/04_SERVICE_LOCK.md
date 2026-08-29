# LOCK 04: SERVICE LOCK
Business Logic Layer | Cross-Module via EventBus ONLY

## Rules
- Services contain ALL business logic
- Cross-module calls: EventBus.publish() or PUBLIC API (no direct DB)
- Controllers -> Services -> Repositories (strict hierarchy)
- Zod validation BEFORE service entry
- Error throwing: ApiError objects with code + message

## Services
1. PaymentService - create, process, fail, cancel, dashboard
2. InvoiceService - create, send, cancel, update, dashboard
3. RefundService - request, approve (admin), reject, complete
4. BankAccountService - CRUD + transaction validation
5. ReconciliationService - create, upload, auto-match, resolve
6. PaymentMethodService - CRUD + config validation
