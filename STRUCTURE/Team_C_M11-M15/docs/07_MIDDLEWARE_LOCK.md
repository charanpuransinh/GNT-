# LOCK 07: MIDDLEWARE LOCK
Stack Order: helmet -> cors -> morgan -> express.json -> tenant -> auth -> validate

## Middleware
1. helmet - security headers
2. cors - cross-origin
3. morgan - request logging
4. express.json - body parsing
5. tenantMiddleware - x-tenant-id validation
6. authMiddleware - JWT extraction (tenantId, userId, userRole)
7. validateMiddleware - Zod schema validation
8. errorMiddleware - centralized error handling (last)
