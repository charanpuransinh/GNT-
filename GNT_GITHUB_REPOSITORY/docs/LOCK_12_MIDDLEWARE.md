# LOCK_12 — Middleware Lock

## Status: ✅ LOCKED

- authMiddleware: reads x-user-id + x-user-roles (TEMP MOCK)
- tenantMiddleware: reads x-tenant-id (TEMP MOCK)
- TODO: Replace with real JWT validation in Session 13
- Applied to all M14 routes
- Signed off: Session 9