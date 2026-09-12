/**
 * M24 — cache/cache-key-builder.ts
 * OWN: Tenant/scope-safe cache key generation.
 * Rule 14 (Global Rules): cache keys must contain tenant identity and
 * relevant authorization scope — never a bare entity key.
 */

export interface CacheKeyParts {
  tenantId: string;
  namespace: string;
  entity: string;
  identifier: string;
  scopeSuffix?: string;
}

export class CacheKeyBuilder {
  build(parts: CacheKeyParts): string {
    if (!parts.tenantId || !parts.namespace || !parts.entity || !parts.identifier) {
      throw new Error('CacheKeyBuilder.build: missing required key part');
    }
    const segments = [
      'gnt',
      parts.namespace,
      `t:${parts.tenantId}`,
      parts.entity,
      parts.identifier,
    ];
    if (parts.scopeSuffix) segments.push(`s:${parts.scopeSuffix}`);
    return segments.join(':');
  }

  /** Build a wildcard pattern scoped to a tenant, for safe bulk invalidation. */
  buildTenantPattern(tenantId: string, namespace: string, entity?: string): string {
    const segments = ['gnt', namespace, `t:${tenantId}`];
    if (entity) segments.push(entity);
    segments.push('*');
    return segments.join(':');
  }
}

export const cacheKeyBuilder = new CacheKeyBuilder();
