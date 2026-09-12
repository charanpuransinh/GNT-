# M24 — Performance, Cache & Database Optimization — wiring status

Updated 2026-09-12.

## Verified against real repo
- `backend/package.json` has no `redis`/`ioredis`/`bullmq` dependency.
- Project memory: owner decision 2026-09-06 — cross-module transport is in-process only, "NO Redis/BullMQ (single-server scale)".
- Real migration process: raw SQL files in `database/migrations/NNN_*.sql`, applied manually via `psql` (no Prisma Migrate).

## What's wired (adapters/)
- `real-cache-client.ts` — `ProcessLocalCacheClient`, the REAL cache implementation given there is no Redis in this repo (not a placeholder). Documented limitation: per-process only, not shared across horizontally-scaled instances — revisit if/when the owner decides to scale beyond one server.
- `real-schema-adapter.ts` — `IndexManager`'s `SchemaAdapter`, backed by real read-only Postgres introspection (`pg_indexes`). `proposeIndex()` never issues DDL — it returns a suggested migration filename for a human to write, matching this repo's actual manual-migration process.

## Not touched
`monitoring/performance-monitor.service.ts`, `monitoring/cache-metrics.service.ts`, `database/query-optimizer.ts` are pure in-memory analytics with no external dependency — wired as-is, no adapter needed.
