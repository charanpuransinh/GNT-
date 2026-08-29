# LOCK_13 — Processor Lock

## Status: ✅ LOCKED

- ImportProcessor: parse → validate → update job → publish completion
- ExportProcessor: fetch module data (PUBLIC API) → format → upload → update job
- Both use Redis BRPOP for queue consumption
- Error handling: job marked FAILED + event published
- Signed off: Session 9