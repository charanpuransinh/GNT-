// ============================================================================
// M23 — Security, Governance & Data Protection — real DB + real EventBus wiring
//
// Verifies every adapter added during wiring against real infrastructure:
//   - AuthorizationService against real permission format ("M<code>:<action>")
//   - TenantIsolationGuard / CrossTenantDetectorService against M19's real
//     SecurityEvent table (no new table)
//   - SecurityAuditService against M19's real AuditLog table (no new table)
//   - SecurityEventService against the real shared eventBus
//   - PolicyEngineService / DataRetentionService against the two genuinely
//     new tables added in migration 020 (security_policy, data_retention_policy)
//   - ScopeResolverService against real user_master.branch_id
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/common/config/prisma';
import { eventBus } from '@/common/events/event-bus';
import { GNT_EVENTS } from '@/common/events/event-catalog';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import { TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';

import { authorizationService } from '../access/authorization.service';
import { tenantContextService } from '../tenant/tenant-context.service';
import { tenantIsolationGuard, TenantIsolationViolationError } from '../tenant/tenant-isolation.guard';
import { crossTenantDetectorService } from '../tenant/cross-tenant-detector.service';
import { securityAuditService } from '../audit/security-audit.service';
import { securityEventService } from '../audit/security-event.service';
import { policyEngineService } from '../access/policy-engine.service';
import { dataRetentionService } from '../privacy/data-retention.service';
import { scopeResolverService } from '../access/scope-resolver.service';
import { buildTrustedRequestSource } from '../adapters/real-request-context.adapter';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-0000000000f1';
const BRANCH_USER_ID = randomUUID();
const BRANCH_ID = randomUUID();

describe.runIf(process.env.TEST_DB === '1')('M23 — Security & Governance (real DB + real EventBus)', () => {
  beforeAll(async () => {
    await prisma.user_master.upsert({
      where: { id: BRANCH_USER_ID },
      update: { branch_id: BRANCH_ID },
      create: {
        id: BRANCH_USER_ID, company_id: TEST_COMPANY_ID, branch_id: BRANCH_ID,
        name: 'Branch User', email: `branch-${BRANCH_USER_ID}@test.com`,
        username: `branch-${BRANCH_USER_ID}`, password_hash: 'x',
      },
    });
    await prisma.securityPolicy.deleteMany({ where: { companyId: TEST_COMPANY_ID } });
    await prisma.dataRetentionPolicy.deleteMany({ where: { companyId: TEST_COMPANY_ID } });
    await prisma.auditLog.deleteMany({ where: { companyId: TEST_COMPANY_ID, module: 'M23' } });
    await prisma.securityEvent.deleteMany({ where: { companyId: TEST_COMPANY_ID, eventType: 'CROSS_TENANT_ATTEMPT' } });
  });

  afterAll(async () => {
    await prisma.securityPolicy.deleteMany({ where: { companyId: TEST_COMPANY_ID } });
    await prisma.dataRetentionPolicy.deleteMany({ where: { companyId: TEST_COMPANY_ID } });
    await prisma.auditLog.deleteMany({ where: { companyId: TEST_COMPANY_ID, module: 'M23' } });
    await prisma.securityEvent.deleteMany({ where: { companyId: TEST_COMPANY_ID, eventType: 'CROSS_TENANT_ATTEMPT' } });
    await prisma.user_master.deleteMany({ where: { id: BRANCH_USER_ID } });
  });

  describe('AuthorizationService — real permission format', () => {
    it('allows when the real "M<code>:<action>" permission is present (Owner has ALL_PERMISSIONS)', async () => {
      const permissions = Array.from(await permissionService.getUserPermissions(TEST_USER_ID));
      expect(permissions).toContain('M08:view');

      const result = authorizationService.evaluate({
        auth: { userId: TEST_USER_ID, tenantId: TEST_COMPANY_ID, role: '', permissions, correlationId: 'corr-1' },
        requiredPermission: 'M08:view',
        resourceTenantId: TEST_COMPANY_ID,
      });
      expect(result.allowed).toBe(true);
    });

    it('denies a permission key that does not exist in the real catalog', async () => {
      const permissions = Array.from(await permissionService.getUserPermissions(TEST_USER_ID));
      const result = authorizationService.evaluate({
        auth: { userId: TEST_USER_ID, tenantId: TEST_COMPANY_ID, role: '', permissions, correlationId: 'corr-2' },
        requiredPermission: 'M99:view',
        resourceTenantId: TEST_COMPANY_ID,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('PERMISSION_MISSING');
    });

    it('denies on tenant mismatch regardless of permissions', () => {
      const result = authorizationService.evaluate({
        auth: { userId: TEST_USER_ID, tenantId: TEST_COMPANY_ID, role: '', permissions: ['M08:view'], correlationId: 'corr-3' },
        requiredPermission: 'M08:view',
        resourceTenantId: OTHER_COMPANY_ID,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('TENANT_MISMATCH');
    });
  });

  describe('buildTrustedRequestSource — real Express req shape', () => {
    it('builds a TrustedRequestSource from req.user/req.tenant with real permissions fetched', async () => {
      const fakeReq = {
        user: { id: TEST_USER_ID, companyId: TEST_COMPANY_ID },
        tenant: { companyId: TEST_COMPANY_ID },
        requestId: 'req-abc',
      } as any;

      const source = await buildTrustedRequestSource(fakeReq);
      expect(source.authenticatedUserId).toBe(TEST_USER_ID);
      expect(source.authenticatedTenantId).toBe(TEST_COMPANY_ID);
      expect(source.permissions).toContain('M08:view');
      expect(source.correlationId).toBe('req-abc');

      const auth = tenantContextService.establish(source);
      expect(auth.tenantId).toBe(TEST_COMPANY_ID);
    });

    it('throws when the request has no authenticated user', async () => {
      await expect(buildTrustedRequestSource({} as any)).rejects.toThrow();
    });
  });

  describe('TenantIsolationGuard + CrossTenantDetectorService — real SecurityEvent table', () => {
    it('allows same-tenant access without recording anything', async () => {
      const before = await prisma.securityEvent.count({ where: { companyId: TEST_COMPANY_ID, eventType: 'CROSS_TENANT_ATTEMPT' } });
      await tenantIsolationGuard.enforce({
        auth: { userId: TEST_USER_ID, tenantId: TEST_COMPANY_ID, role: '', permissions: [], correlationId: 'corr-4' },
        resourceTenantId: TEST_COMPANY_ID,
        resourceType: 'party',
      });
      const after = await prisma.securityEvent.count({ where: { companyId: TEST_COMPANY_ID, eventType: 'CROSS_TENANT_ATTEMPT' } });
      expect(after).toBe(before);
    });

    it('rejects cross-tenant access and writes a real SecurityEvent row (M19 table, no new table)', async () => {
      await expect(
        tenantIsolationGuard.enforce({
          auth: { userId: TEST_USER_ID, tenantId: TEST_COMPANY_ID, role: '', permissions: [], correlationId: 'corr-5' },
          resourceTenantId: OTHER_COMPANY_ID,
          resourceType: 'party',
          resourceId: 'party-1',
        }),
      ).rejects.toThrow(TenantIsolationViolationError);

      const row = await prisma.securityEvent.findFirst({
        where: { companyId: TEST_COMPANY_ID, eventType: 'CROSS_TENANT_ATTEMPT' },
        orderBy: { createdAt: 'desc' },
      });
      expect(row).not.toBeNull();
      expect((row!.metadata as any).actorId).toBe(TEST_USER_ID);
      expect((row!.metadata as any).targetTenantId).toBe(OTHER_COMPANY_ID);
    });

    it('flags suspicious after threshold (5) attempts within the window', async () => {
      const actorId = randomUUID();
      let last: { suspicious: boolean; recentCount: number } | undefined;
      for (let i = 0; i < 5; i++) {
        last = await crossTenantDetectorService.recordAttempt({
          actorId, actorTenantId: TEST_COMPANY_ID, targetTenantId: OTHER_COMPANY_ID,
          resourceType: 'party', correlationId: `corr-loop-${i}`,
        });
      }
      expect(last!.suspicious).toBe(true);
      expect(last!.recentCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('SecurityAuditService — real AuditLog table (M19, reused)', () => {
    it('inserts a row into the real AuditLog table, module fixed to M23', async () => {
      await securityAuditService.record({
        tenantId: TEST_COMPANY_ID, actorId: TEST_USER_ID, action: 'TEST_ACTION',
        resourceType: 'party', resourceId: 'party-9', outcome: 'DENIED', correlationId: 'corr-audit-1',
      });
      const row = await prisma.auditLog.findFirst({
        where: { companyId: TEST_COMPANY_ID, module: 'M23', action: 'TEST_ACTION' },
      });
      expect(row).not.toBeNull();
      expect(row!.resource).toBe('party');
      expect((row!.afterData as any).outcome).toBe('DENIED');
    });

    it('strips sensitive keys from metadata before persisting (Rule 16)', async () => {
      await securityAuditService.record({
        tenantId: TEST_COMPANY_ID, actorId: TEST_USER_ID, action: 'TEST_ACTION_SECRET',
        resourceType: 'party', resourceId: 'party-9', outcome: 'ALLOWED', correlationId: 'corr-audit-2',
        metadata: { password: 'should-not-be-stored', safeField: 'kept' },
      });
      const row = await prisma.auditLog.findFirst({
        where: { companyId: TEST_COMPANY_ID, module: 'M23', action: 'TEST_ACTION_SECRET' },
      });
      const afterData = row!.afterData as any;
      expect(afterData.password).toBeUndefined();
      expect(afterData.safeField).toBe('kept');
    });
  });

  describe('SecurityEventService — real shared eventBus', () => {
    it('publishes onto the real GNT_EVENTS.SECURITY_ACCESS_DENIED catalog name', async () => {
      const received: unknown[] = [];
      const handler = (payload: unknown) => { received.push(payload); };
      eventBus.subscribe(GNT_EVENTS.SECURITY_ACCESS_DENIED, handler);

      await securityEventService.publish({
        eventName: 'SECURITY.ACCESS_DENIED', tenantId: TEST_COMPANY_ID, actorId: TEST_USER_ID,
        correlationId: 'corr-evt-1', entityType: 'party', entityId: 'party-1',
      });

      expect(received.length).toBe(1);
      expect((received[0] as any).tenantId).toBe(TEST_COMPANY_ID);
      expect((received[0] as any).eventName).toBe('SECURITY.ACCESS_DENIED');
    });
  });

  describe('PolicyEngineService — real security_policy table', () => {
    it('default-denies when no policy matches', async () => {
      const result = await policyEngineService.evaluate({ tenantId: TEST_COMPANY_ID, resource: 'party', action: 'delete' });
      expect(result.effect).toBe('DENY');
      expect(result.matchedPolicyId).toBeNull();
    });

    it('ALLOW policy permits the matching action', async () => {
      await prisma.securityPolicy.create({
        data: { id: randomUUID(), companyId: TEST_COMPANY_ID, name: 'allow-view', resource: 'party', action: 'view', effect: 'ALLOW', active: true },
      });
      const result = await policyEngineService.evaluate({ tenantId: TEST_COMPANY_ID, resource: 'party', action: 'view' });
      expect(result.effect).toBe('ALLOW');
    });

    it('DENY overrides ALLOW for the same resource/action (deny-overrides)', async () => {
      await prisma.securityPolicy.create({
        data: { id: randomUUID(), companyId: TEST_COMPANY_ID, name: 'deny-view-override', resource: 'party', action: 'view', effect: 'DENY', active: true },
      });
      const result = await policyEngineService.evaluate({ tenantId: TEST_COMPANY_ID, resource: 'party', action: 'view' });
      expect(result.effect).toBe('DENY');
    });
  });

  describe('DataRetentionService — real data_retention_policy table', () => {
    it('runs the registered executor for a policy and reports purged count', async () => {
      await prisma.dataRetentionPolicy.create({
        data: { id: randomUUID(), companyId: TEST_COMPANY_ID, entityType: 'test_entity', retentionDays: 30, active: true },
      });
      let calledWith: { tenantId: string; entityType: string } | null = null;
      dataRetentionService.registerExecutor('test_entity', {
        async purgeOlderThan(tenantId, entityType) {
          calledWith = { tenantId, entityType };
          return { purgedCount: 3 };
        },
      });

      const results = await dataRetentionService.executeForTenant(TEST_COMPANY_ID);
      const testResult = results.find((r) => r.entityType === 'test_entity');
      expect(testResult?.purgedCount).toBe(3);
      expect(calledWith).toEqual({ tenantId: TEST_COMPANY_ID, entityType: 'test_entity' });
    });

    it('skips entity types with no registered executor rather than guessing how to delete', async () => {
      await prisma.dataRetentionPolicy.create({
        data: { id: randomUUID(), companyId: TEST_COMPANY_ID, entityType: 'unregistered_entity', retentionDays: 10, active: true },
      });
      const results = await dataRetentionService.executeForTenant(TEST_COMPANY_ID);
      expect(results.find((r) => r.entityType === 'unregistered_entity')).toBeUndefined();
    });
  });

  describe('ScopeResolverService — real user_master.branch_id', () => {
    it('returns empty scope for a user with no branch (no restriction)', async () => {
      const scope = await scopeResolverService.resolve(TEST_USER_ID, TEST_COMPANY_ID);
      expect(scope.branchId).toBeUndefined();
    });

    it('returns the real branchId for a user with one set', async () => {
      const scope = await scopeResolverService.resolve(BRANCH_USER_ID, TEST_COMPANY_ID);
      expect(scope.branchId).toBe(BRANCH_ID);
    });

    it('isWithinScope: candidate branch must match granted branch exactly', () => {
      expect(scopeResolverService.isWithinScope({ branchId: BRANCH_ID }, { branchId: BRANCH_ID })).toBe(true);
      expect(scopeResolverService.isWithinScope({ branchId: BRANCH_ID }, { branchId: 'other' })).toBe(false);
    });
  });
});
