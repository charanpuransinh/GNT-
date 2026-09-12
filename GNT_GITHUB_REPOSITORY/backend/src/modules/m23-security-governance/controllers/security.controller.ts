/**
 * M23 — controllers/security.controller.ts
 * OWN: Security/Governance HTTP API — policy evaluation/CRUD, retention
 * policy CRUD + execution. Framework-agnostic, standard success/failure
 * envelope (same shape as M26/M27 controllers, Section 20).
 *
 * Real permission format ("M<code>:<action>") — same pattern as M26/M27.
 * tenantId is ALWAYS auth.tenantId (from the trusted request context) — a
 * request body/query never supplies its own tenantId, so there is no
 * cross-tenant write path to defend against here (not merely checked,
 * structurally impossible).
 */

import { PolicyEngineService, policyEngineService, type SecurityPolicy, type PolicyEffect } from '../access/policy-engine.service';
import { DataRetentionService, dataRetentionService, type DataRetentionPolicy } from '../privacy/data-retention.service';

export interface SecurityAuthContext {
  userId: string;
  tenantId: string;
  permissions: string[];
}

export interface ApiSuccess<T> { success: true; data: T; meta: { correlationId: string } }
export interface ApiFailure { success: false; error: { code: string; message: string }; meta: { correlationId: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class SecurityPermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityPermissionDeniedError';
  }
}

export class SecurityController {
  constructor(
    private readonly policy: PolicyEngineService = policyEngineService,
    private readonly retention: DataRetentionService = dataRetentionService,
  ) {}

  async evaluatePolicy(
    auth: SecurityAuthContext,
    resource: string,
    action: string,
    attributes: Record<string, unknown> | undefined,
    correlationId: string,
  ): Promise<ApiResponse<Awaited<ReturnType<PolicyEngineService['evaluate']>>>> {
    try {
      this.requirePermission(auth, 'M23:view');
      const data = await this.policy.evaluate({ tenantId: auth.tenantId, resource, action, attributes });
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async listPolicies(auth: SecurityAuthContext, correlationId: string): Promise<ApiResponse<SecurityPolicy[]>> {
    try {
      this.requirePermission(auth, 'M23:view');
      const data = await this.policy.listPolicies(auth.tenantId);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async createPolicy(
    auth: SecurityAuthContext,
    input: { name: string; resource: string; action: string; effect: PolicyEffect; conditions?: Record<string, unknown>; active?: boolean },
    correlationId: string,
  ): Promise<ApiResponse<SecurityPolicy>> {
    try {
      this.requirePermission(auth, 'M23:create');
      const data = await this.policy.createPolicy({
        tenantId: auth.tenantId,
        name: input.name,
        resource: input.resource,
        action: input.action,
        effect: input.effect,
        conditions: input.conditions,
        active: input.active ?? true,
      });
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async listRetentionPolicies(auth: SecurityAuthContext, correlationId: string): Promise<ApiResponse<DataRetentionPolicy[]>> {
    try {
      this.requirePermission(auth, 'M23:view');
      const data = await this.retention.listPolicies(auth.tenantId);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async createRetentionPolicy(
    auth: SecurityAuthContext,
    input: { entityType: string; retentionDays: number; active?: boolean },
    correlationId: string,
  ): Promise<ApiResponse<DataRetentionPolicy>> {
    try {
      this.requirePermission(auth, 'M23:create');
      if (!Number.isInteger(input.retentionDays) || input.retentionDays <= 0) {
        throw new Error('retentionDays must be a positive integer');
      }
      const data = await this.retention.createPolicy({
        tenantId: auth.tenantId,
        entityType: input.entityType,
        retentionDays: input.retentionDays,
        active: input.active ?? true,
      });
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  /** POST .../retention/execute — path ends in 'execute', mapped to 'edit' in permission-catalog.ts ACTION_OVERRIDES (maintenance action, same class as /rebuild, /reconcile). */
  async executeRetention(
    auth: SecurityAuthContext,
    correlationId: string,
  ): Promise<ApiResponse<Array<{ entityType: string; purgedCount: number }>>> {
    try {
      this.requirePermission(auth, 'M23:edit');
      const data = await this.retention.executeForTenant(auth.tenantId);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  private requirePermission(auth: SecurityAuthContext, permission: string): void {
    if (!auth.permissions.includes(permission)) {
      throw new SecurityPermissionDeniedError(`Missing permission ${permission}`);
    }
  }

  private toFailure(err: unknown, correlationId: string): ApiFailure {
    const code = err instanceof SecurityPermissionDeniedError ? 'SECURITY_ACCESS_DENIED' : 'SECURITY_ERROR';
    const message = err instanceof Error ? err.message : 'Unexpected security error';
    return { success: false, error: { code, message }, meta: { correlationId } };
  }
}

export const securityController = new SecurityController();
