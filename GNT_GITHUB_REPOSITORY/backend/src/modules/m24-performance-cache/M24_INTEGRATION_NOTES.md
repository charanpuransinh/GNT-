# M24 — Performance, Cache & Database Optimization — wiring status

Updated 2026-09-12.

## Verified against real repo
- **Correction (2026-09-12, same day):** an earlier pass of this file said "no redis/ioredis/bullmq dependency exists" — that only checked `backend/package.json`. They ARE real dependencies at the repo-root `package.json` and resolvable from `backend/src`. Re-checked actual usage: `ioredis` has exactly one call site (`m01-foundation/repositories/app.repository.ts`'s `checkCacheConnection()`, a health-check ping only — no cache read/write client), and `bullmq` has exactly one call site (`m15-sync/events/sync.events.ts`, the legacy Redis-queue event bus project memory already flags as pending conversion to the in-process eventBus). Conclusion unchanged (no active Redis cache backend exists), reasoning corrected.
- Project memory: owner decision 2026-09-06 — cross-module transport is in-process only, "NO Redis/BullMQ (single-server scale)".
- Real migration process: raw SQL files in `database/migrations/NNN_*.sql`, applied manually via `psql` (no Prisma Migrate).

## What's wired (adapters/)
- `real-cache-client.ts` — `ProcessLocalCacheClient`, the REAL cache implementation given there is no active Redis cache client anywhere in this repo (not a placeholder). Documented limitation: per-process only, not shared across horizontally-scaled instances — revisit if/when the owner decides to scale beyond one server, or wants `checkCacheConnection()`'s optional Redis promoted into an actual cache backend.
- `real-schema-adapter.ts` — `IndexManager`'s `SchemaAdapter`, backed by real read-only Postgres introspection (`pg_indexes`). `proposeIndex()` never issues DDL — it returns a suggested migration filename for a human to write, matching this repo's actual manual-migration process.

## Not touched
`monitoring/performance-monitor.service.ts`, `monitoring/cache-metrics.service.ts`, `database/query-optimizer.ts` are pure in-memory analytics with no external dependency — wired as-is, no adapter needed.
