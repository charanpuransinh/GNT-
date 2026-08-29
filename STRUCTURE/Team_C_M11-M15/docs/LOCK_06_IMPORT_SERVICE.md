# LOCK_06 — Import Service Lock

## Status: ✅ LOCKED

- createImportJob: persists job + publishes event
- validateImport: parses + validates against mapping
- get/list/cancel/retry operations
- Status machine: PENDING→PROCESSING→COMPLETED/FAILED
- Signed off: Session 9