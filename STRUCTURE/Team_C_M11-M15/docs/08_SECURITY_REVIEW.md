authentication:
  - All REST endpoints (except webhooks) require M02 JWT validation
  - Webhook endpoints use HMAC-SHA256 signature verification
  - Webhook URLs include cryptographically random tokens

authorization:
  - RBAC: automation:read, automation:write, automation:execute, automation:admin
  - Workflow visibility scoped to tenantId (M01 TenantContext)
  - Execution data access restricted to workflow owners + admins

data_protection:
  - Trigger configs encrypted at rest (AES-256-GCM)
  - Webhook payloads logged but sensitive fields masked
  - Execution context purged after 90 days (GDPR compliance)

injection_prevention:
  - All dynamic expressions in workflow steps sandboxed (vm2/isolated-vm)
  - No eval() or Function() constructors
  - SQL actions parameterized via Prisma only
  - API call actions validate URLs against allowlist

rate_limiting:
  - Webhook endpoints: 100 req/min per workflow
  - Manual execution: 10 req/min per user
  - Scheduled jobs: max 1/sec per tenant
