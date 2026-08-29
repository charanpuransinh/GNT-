# LOCK 12: SECURITY LOCK

## Rules
- JWT verification via authMiddleware on ALL routes
- RBAC: x-user-role header checked for admin ops (approve refund)
- Tenant isolation: Complete separation, zero cross-tenant leakage
- Input: Zod validation on ALL inputs
- SQL Injection: Prisma ORM prevents injection
- XSS: Helmet + React escapes by default
- Decimal: String transport to avoid JS float precision issues
