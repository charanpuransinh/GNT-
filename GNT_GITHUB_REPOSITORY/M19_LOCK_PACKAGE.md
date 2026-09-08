# M19 — PRODUCTION MONITORING — LOCK PACKAGE

## Module Info
- **Module ID:** M19
- **Name:** Production Monitoring (audit trail, security anomaly detection, health checks)
- **Mount:** `/api/v1/monitoring`
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 19/19 M19 tests on live PostgreSQL (`TEST_DB=1`); typecheck clean; biome lint clean (22 files).

## P0 fixed at certification
**Stray `new PrismaClient()`** in `routes/security.routes.ts` — opened its own connection pool.
Replaced with the shared `@/common/config/prisma` singleton (same class as the M06/M08/M15 P0s).

## Database Ownership
`AuditLog`, `LoginHistory`, `SecurityEvent`, `SystemHealth` — M19 OWNER.
Migration: `006_M19_audit_log_append_only.sql`.

## Public Surface (`/api/v1/monitoring`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/audit/logs` | audit trail (tenant-scoped; refuses without a company id) |
| GET | `/audit/login-history` | per-user login history |
| GET | `/audit/permission-changes` | permission-change trail |
| GET | `/security/events` | security events (filterable) |
| POST | `/security/anomaly-check` | run the anomaly rules against an input |
| POST | `/security/events/:eventId/resolve` | mark an event resolved |
| GET | `/health/system` `/health/database` `/health/services` | health checks |

## Audit trail — tamper-evident
- `AuditRepository.getAuditLogs` **throws** if `companyId` is undefined (no accidental cross-tenant read)
- `AuditRepository.deleteAuditLog()` / `updateAuditLog()` → `throw ILLEGAL_OPERATION` (append-only in code)
- Migration `006` additionally `REVOKE UPDATE, DELETE ON audit_log FROM <app_user>` at the DB level
  (run at deploy time — SELECT + INSERT only)

## Anomaly detection (`services/security.internal.ts`) — 5 real rules
| Rule | Trigger | Severity |
|------|---------|----------|
| Brute force | ≥ 5 failed logins for a user in 30 min | high |
| Suspicious IP | ≥ 20 security events from one IP in 60 min | critical |
| Permission change | any `permission.changed` event | medium |
| Integration failure | any `integration.webhook.failed` event | medium |
| After-hours access | successful login 22:00–06:00 | low |
Each creates a real `security_event` row (tenant-scoped) — not a stub.

## Events
- Subscribes: audit/security-relevant events from the shared bus (`registerAutomationEventHandlers`-style
  central subscription) → writes audit + runs anomaly rules
- Publishes: `monitoring.*` alerts consumed by ops dashboards

## Security
- All audit/security/health queries tenant-scoped (`companyId`); missing company id ⇒ error, not empty
- Shared `@/common/config/prisma` singleton (P0 fixed)
- Repos take `PrismaClient` by DI
- No cross-module writes; read-only observation of other modules' events

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/security.routes.ts` + `security.types.ts`)
- [x] Repository Map (`audit.repository.ts`, `security.repository.ts`)
- [x] File Registry (controllers ×3, services ×4, events ×2, repos ×2, model, validators, types)
- [x] Database Map (`AuditLog`, `LoginHistory`, `SecurityEvent`, `SystemHealth`)
- [x] Database Registry (migration `006`; canonical `prisma/schema.prisma`)
- [x] Dependency Map (subscribes to M01–M18 events; M01/M02 auth)
- [x] Wiring Map (`wiring-maps/module-wiring/m19/`)
- [x] Wiring Registry
- [x] API Contract (endpoint table above)
- [x] Integration Contract (event-subscription contract; anomaly-check input contract)
- [x] Security Contract — tenant-scoped, append-only audit (code + DB REVOKE), DI prisma
- [x] Test Report — 19/19 live-DB: audit e2e, audit repo (append-only enforcement), security internal (all 5 rules), security repo, health service, event→audit wiring
- [x] Change Log — 2026-09-08: prisma-singleton P0 fixed; cert pass
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF**

## Known scope boundaries (not defects)
- Migration `006` (DB-level append-only REVOKE) must be run against the production DB user at deploy time.
- Health checks report process/DB/service reachability; deep APM (traces, metrics histograms) is out of scope.
- Anomaly thresholds (5 / 30 min, 20 / 60 min, …) are sensible defaults; make them config-driven if the
  owner wants per-tenant tuning later.
