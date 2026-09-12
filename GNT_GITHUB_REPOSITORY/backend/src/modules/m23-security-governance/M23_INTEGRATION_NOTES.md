# M23 — Security, Governance & Data Protection — wiring status

Updated 2026-09-12. This replaces the original blueprint's integration notes
(uppercase `M23/` source, uploaded as `GNT_M23_to_M34_FINAL_COMPLETE.zip`),
now that its 5 verification items have been checked against the real repo.

## Verified against real repo (not guessed)
1. **M01 user shape**: `req.user = { id, companyId?, branchId? }` (`auth-middleware.ts`).
2. **M02 permission format**: `"M<code>:<action>"` (e.g. `"M08:view"`), via `permissionService.hasPermission()`.
3. **Shared EventBus**: `backend/src/common/events/event-bus.ts`, singleton `eventBus`. Five new catalog entries added to `event-catalog.ts` (`GNT_EVENTS.SECURITY_*`).
4. **M19 audit table**: reused as-is (`AuditLog`, `SecurityEvent` Prisma models) — no parallel audit table created.
5. **Scope source**: no department/team master data exists in the real repo. Only `branchId` (`user_master.branch_id`) is real. `departmentId`/`teamId` are always left unresolved by `RealScopeProvider` — documented limitation, not a guess.

## What's wired (adapters/)
- `real-request-context.adapter.ts` — builds `TrustedRequestSource` from a real Express `req`.
- `real-event-publisher.ts` — `EventPublisher` over the real `eventBus`.
- `real-audit-store.ts` — `SecurityAuditStore` over M19's `AuditLog` (via M19's public `AuditRepository`).
- `real-cross-tenant-store.ts` — `CrossTenantAttemptStore` over M19's `SecurityEvent` (eventType `CROSS_TENANT_ATTEMPT`).
- `real-policy-repository.ts` / `real-retention-policy-repository.ts` — over two genuinely new tables (`security_policy`, `data_retention_policy`; migration `020_M23_security_policy_retention.sql`), since nothing in M01-M22 already owns tenant security-policy or retention-policy config.

## Not done yet / explicitly out of scope for this pass
- No Express middleware wrapper for `TenantIsolationGuard`/`AuthorizationService` — M23 exposes no HTTP routes; it's a library other modules call into (same pattern as M11's data-sense calling M10 directly). No route registration needed in `module-registry.ts`.
- `DataRetentionService.executeForTenant()` still requires each owning module to call `registerExecutor()` for its entity types — none are registered by this pass; M23 must never write another module's tables directly.
- Owner declares this module LOCKED/CERTIFIED, not the agent doing the wiring — see test results in the module's `tests/` for current pass/fail status.
