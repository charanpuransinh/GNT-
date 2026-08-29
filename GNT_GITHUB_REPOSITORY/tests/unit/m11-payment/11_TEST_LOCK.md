# LOCK 11: TEST LOCK
Coverage Target: Repository + Service + Controller + Route

## Test Strategy
- Unit: Mock PrismaClient for repository tests
- Unit: Mock EventBus for service isolation tests
- Integration: Supertest for route E2E tests
- E2E: Full flow tests (create invoice -> send -> pay -> reconcile)

## Test Files
- payment.service.test.ts
- invoice.service.test.ts
- payment.routes.test.ts
- reconciliation.service.test.ts
