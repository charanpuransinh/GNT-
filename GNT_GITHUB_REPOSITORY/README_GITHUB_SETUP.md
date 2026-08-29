# GNT M01–M20 — GitHub Setup

## Repository root
This folder is the canonical repository root.

## Main areas
- `backend/` — server/application code
- `frontend/` — web UI
- `database/` — database/migrations/schema where supplied
- `docs/` — project documentation where supplied
- `tests/` — test assets where supplied
- `source-archives/` — source ZIP traceability
- `INTERNAL_REPAIR_LEDGER.md` — repair history
- `FULL_PROJECT_INTEGRATION_MAP.md` — M01–M20 integration map

## Before first push
1. Review `.env.example`.
2. Never commit `.env` or credentials.
3. Run local install/build/tests.
4. Fix any environment-specific errors.
5. Commit and push to the intended GitHub repository.

## Important
This package is prepared for repository testing. Live production credentials, PostgreSQL,
Redis, payment providers, notification providers, and external APIs must be configured
in the target environment before production deployment.
