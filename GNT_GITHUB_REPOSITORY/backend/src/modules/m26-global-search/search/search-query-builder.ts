/**
 * M26 — search/search-query-builder.ts
 * OWN: Filters, sorting, pagination and ranking for search requests.
 * Rule 13 (Global Rules): Global search must still be tenant-scoped.
 */

export interface SearchRequest {
  query: string;
  entityTypes: string[];
  filters?: Record<string, unknown>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  page?: number;
  pageSize?: number;
}

export interface BuiltSearchQuery {
  tenantId: string;
  query: string;
  entityTypes: string[];
  filters: Record<string, unknown>;
  sort: { field: string; direction: 'asc' | 'desc' } | null;
  from: number;
  size: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export class SearchQueryBuilder {
  /** tenantId is a mandatory, trusted parameter — never taken from the request body. */
  build(tenantId: string, request: SearchRequest): BuiltSearchQuery {
    if (!tenantId) {
      throw new Error('SearchQueryBuilder.build: tenantId is required');
    }
    const page = Math.max(1, request.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, request.pageSize ?? DEFAULT_PAGE_SIZE));

    return {
      tenantId,
      query: request.query?.trim() ?? '',
      entityTypes: request.entityTypes ?? [],
      // Tenant scope is always injected into filters, so the downstream
      // search-index adapter cannot accidentally drop it.
      filters: { ...(request.filters ?? {}), tenantId },
      sort: request.sort ?? null,
      from: (page - 1) * pageSize,
      size: pageSize,
    };
  }
}

export const searchQueryBuilder = new SearchQueryBuilder();
