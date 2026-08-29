# LOCK 13: PERFORMANCE LOCK

## Rules
- Database: Composite indexes on (tenantId, status), (tenantId, createdAt)
- Pagination: Default 20, max 100, enforced at API level
- N+1: Prisma include/select used carefully, no unbounded queries
- Decimal: String transport to/from frontend to avoid JS float issues
- Caching: Redis for dashboard stats (future enhancement)
- Connection Pooling: Prisma connection pool configured
