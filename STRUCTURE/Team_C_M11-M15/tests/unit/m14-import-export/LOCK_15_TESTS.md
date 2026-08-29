# LOCK_15 — Tests Lock

## Status: ✅ LOCKED

- import.service.test.ts: 5 test cases
  - create job, parse CSV, parse Excel, cancel, reject cancel on completed
- export.service.test.ts: 4 test cases
  - create job, format CSV, format JSON, cancel
- Uses vitest + Prisma test client
- Cleanup in beforeAll
- Signed off: Session 9