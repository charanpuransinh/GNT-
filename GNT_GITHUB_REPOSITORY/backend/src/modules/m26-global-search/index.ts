/**
 * M26 — Global Search & Intelligent Search
 * index.ts — Public M26 exports.
 * PROVIDE (per blueprint): Global search API.
 * FORBIDDEN: returning records outside tenant/scope.
 */

export { SearchQueryBuilder, searchQueryBuilder, type SearchRequest, type BuiltSearchQuery } from './search/search-query-builder';
export {
  ElasticsearchService,
  elasticsearchService,
  type SearchDocument,
  type SearchEngineResult,
  type SearchEngineClient,
} from './search/elasticsearch.service';
export { SearchIndexService, searchIndexService, type IndexableEntity } from './search/search-index.service';
export { FullTextSearch, fullTextSearch, type FullTextSearchResponse } from './search/full-text-search';

export {
  SearchAccessGuard,
  searchAccessGuard,
  SearchAccessDeniedError,
  type SearchAuthContext,
  type SearchAccessCheckInput,
} from './security/search-access-guard';

export { SearchController, searchController, type ApiResponse, type ApiSuccess, type ApiFailure } from './api/search.controller';

export { searchRoutes } from './routes/search.routes';
export { buildSearchAuthContext } from './adapters/real-search-auth-context';
