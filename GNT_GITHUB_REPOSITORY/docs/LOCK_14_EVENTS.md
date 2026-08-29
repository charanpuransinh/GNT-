# LOCK_14 — Event Bus Lock

## Status: ✅ LOCKED

- Redis-based pub/sub + list queue
- Import queue: `m14:import:queue`
- Export queue: `m14:export:queue`
- Topics: import.job.created/completed/failed, export.job.created/completed/failed
- Supports both publish/subscribe and blocking pop patterns
- Signed off: Session 9