/**
 * M26 — search/full-text-search.ts
 * OWN: Execute full-text searches.
 */

import { SearchRequest, SearchQueryBuilder, searchQueryBuilder } from './search-query-builder';
import { ElasticsearchService, elasticsearchService, SearchEngineResult } from './elasticsearch.service';

export interface FullTextSearchResponse {
  items: SearchEngineResult['items'];
  total: number;
  page: number;
  pageSize: number;
  correlationId: string;
}

export class FullTextSearch {
  constructor(
    private readonly queryBuilder: SearchQueryBuilder = searchQueryBuilder,
    private readonly engine: ElasticsearchService = elasticsearchService,
  ) {}

  /** tenantId must come from a trusted AuthContext (e.g. M23), never request input. */
  async execute(tenantId: string, request: SearchRequest, correlationId: string): Promise<FullTextSearchResponse> {
    const built = this.queryBuilder.build(tenantId, request);
    const result = await this.engine.search(built);
    const page = Math.floor(built.from / built.size) + 1;

    return {
      items: result.items,
      total: result.total,
      page,
      pageSize: built.size,
      correlationId,
    };
  }
}

export const fullTextSearch = new FullTextSearch();
