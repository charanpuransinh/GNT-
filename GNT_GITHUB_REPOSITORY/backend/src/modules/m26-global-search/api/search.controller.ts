/**
 * M26 — api/search.controller.ts
 * OWN: Search API endpoints.
 *
 * API Contract (Section 20 / blueprint Section 7):
 *   GET  /api/v1/search
 *   POST /api/v1/search/index/rebuild
 *   POST /api/v1/search/index/{entity}/sync
 *   DELETE /api/v1/search/index/{entity}/{id}
 *
 * Framework-agnostic: exposes plain async methods returning the standard
 * success/failure envelope (Section 20), rather than binding to a specific
 * HTTP framework until the project's real router style is verified.
 */

import { FullTextSearch, fullTextSearch } from '../search/full-text-search';
import { SearchIndexService, searchIndexService } from '../search/search-index.service';
import { SearchAccessGuard, searchAccessGuard, SearchAuthContext, SearchAccessDeniedError } from '../security/search-access-guard';
import { SearchRequest } from '../search/search-query-builder';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: { correlationId: string };
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string };
  meta: { correlationId: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class SearchController {
  constructor(
    private readonly fullTextSearchService: FullTextSearch = fullTextSearch,
    private readonly indexService: SearchIndexService = searchIndexService,
    private readonly accessGuard: SearchAccessGuard = searchAccessGuard,
  ) {}

  async search(
    auth: SearchAuthContext,
    request: SearchRequest,
    correlationId: string,
  ): Promise<ApiResponse<Awaited<ReturnType<FullTextSearch['execute']>>>> {
    try {
      this.accessGuard.enforce({ auth, requestedTenantId: auth.tenantId, entityTypes: request.entityTypes });
      const data = await this.fullTextSearchService.execute(auth.tenantId, request, correlationId);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async rebuildIndex(auth: SearchAuthContext, correlationId: string): Promise<ApiResponse<{ indexed: number }>> {
    try {
      this.accessGuard.enforce({ auth, requestedTenantId: auth.tenantId, entityTypes: [] });
      if (!auth.permissions.includes('M26:edit')) {
        throw new SearchAccessDeniedError('Missing M26:edit permission (index rebuild)');
      }
      const data = await this.indexService.rebuildForTenant(auth.tenantId);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async deleteFromIndex(
    auth: SearchAuthContext,
    entityType: string,
    id: string,
    correlationId: string,
  ): Promise<ApiResponse<{ deleted: true }>> {
    try {
      this.accessGuard.enforce({ auth, requestedTenantId: auth.tenantId, entityTypes: [entityType] });
      if (!auth.permissions.includes('M26:delete')) {
        throw new SearchAccessDeniedError('Missing M26:delete permission (index removal)');
      }
      await this.indexService.removeEntity(entityType, id, auth.tenantId);
      return { success: true, data: { deleted: true }, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  private toFailure(err: unknown, correlationId: string): ApiFailure {
    const code = err instanceof SearchAccessDeniedError ? 'SEARCH_ACCESS_DENIED' : 'SEARCH_ERROR';
    const message = err instanceof Error ? err.message : 'Unexpected search error';
    return { success: false, error: { code, message }, meta: { correlationId } };
  }
}

export const searchController = new SearchController();
