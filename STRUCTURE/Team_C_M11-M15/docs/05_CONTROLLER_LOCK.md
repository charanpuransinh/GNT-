# LOCK 05: CONTROLLER LOCK
HTTP Layer | One controller per entity

## Rules
- try/catch + next(err) on every handler
- Extract tenantId, userId from authMiddleware req object
- Use successResponse/createdResponse helpers (standardized format)
- No business logic - delegate to services
- Pagination: buildPaginationMeta() mandatory for list endpoints
