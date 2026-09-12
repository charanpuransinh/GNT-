/**
 * M23 — Security, Governance & Data Protection
 * index.ts — Public M23 exports.
 *
 * PROVIDE (per blueprint): Authorization API, scope API, tenant guard,
 * privacy API, security events.
 *
 * Calling Rule (Section 19): other modules must only import from this file,
 * never from files inside access/, tenant/, privacy/, audit/ directly.
 *
 * FORBIDDEN (per blueprint): password storage, token generation, financial
 * posting, direct payroll changes, direct invoice posting — none of the
 * files in this module perform any of these.
 */

// --- Access control ---
export {
  AuthorizationService,
  authorizationService,
  AuthorizationDeniedError,
  type AuthContext,
  type BusinessScope,
  type AuthorizationRequest,
  type AuthorizationResult,
} from './access/authorization.service';

export {
  ScopeResolverService,
  scopeResolverService,
  ScopeResolutionError,
  type ScopeProvider,
} from './access/scope-resolver.service';

export {
  PolicyEngineService,
  policyEngineService,
  type SecurityPolicy,
  type PolicyRepository,
  type PolicyEvaluationContext,
  type PolicyEvaluationResult,
  type PolicyEffect,
} from './access/policy-engine.service';

// --- Tenant isolation ---
export {
  TenantContextService,
  tenantContextService,
  TenantContextError,
  type TrustedRequestSource,
} from './tenant/tenant-context.service';

export {
  TenantIsolationGuard,
  tenantIsolationGuard,
  TenantIsolationViolationError,
  type TenantIsolationCheckInput,
} from './tenant/tenant-isolation.guard';

export {
  CrossTenantDetectorService,
  crossTenantDetectorService,
  type CrossTenantAttempt,
  type CrossTenantAttemptStore,
} from './tenant/cross-tenant-detector.service';

// --- Privacy / data protection ---
export {
  SensitiveDataGuard,
  sensitiveDataGuard,
  type SensitiveFieldDefinition,
} from './privacy/sensitive-data.guard';

export {
  DataMaskingService,
  dataMaskingService,
  type MaskingRule,
  type MaskStrategy,
} from './privacy/data-masking.service';

export {
  DataRetentionService,
  dataRetentionService,
  type DataRetentionPolicy,
  type RetentionExecutor,
  type RetentionPolicyRepository,
} from './privacy/data-retention.service';

// --- Audit / security events ---
export * from './audit';

// --- Request-context adapter (build a trusted AuthContext from a real Express req) ---
export { buildTrustedRequestSource } from './adapters/real-request-context.adapter';

// --- HTTP API (2026-09-12 wiring pass) ---
export { SecurityController, securityController, SecurityPermissionDeniedError, type SecurityAuthContext } from './controllers/security.controller';
export { securityRoutes } from './routes/security.routes';
