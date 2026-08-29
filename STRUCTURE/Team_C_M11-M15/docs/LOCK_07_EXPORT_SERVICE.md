# LOCK_07 — Export Service Lock

## Status: ✅ LOCKED

- createExportJob: persists job + publishes event
- get/list/cancel/download operations
- Download returns buffer + mime type + filename
- Status machine: PENDING→PROCESSING→COMPLETED/FAILED
- Signed off: Session 9