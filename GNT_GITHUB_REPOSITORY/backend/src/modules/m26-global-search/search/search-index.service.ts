/**
 * M26 — search/search-index.service.ts
 * OWN: Create/update/delete searchable documents.
 */

import { ElasticsearchService, elasticsearchService, SearchDocument } from './elasticsearch.service';

export interface IndexableEntity {
  id: string;
  entityType: string;
  tenantId: string;
  searchableFields: Record<string, unknown>;
}

export class SearchIndexService {
  constructor(private readonly engine: ElasticsearchService = elasticsearchService) {}

  async indexEntity(entity: IndexableEntity): Promise<void> {
    const doc: SearchDocument = {
      id: entity.id,
      entityType: entity.entityType,
      tenantId: entity.tenantId,
      ...entity.searchableFields,
    };
    await this.engine.index(doc);
  }

  async removeEntity(entityType: string, id: string, tenantId: string): Promise<void> {
    await this.engine.remove(entityType, id, tenantId);
  }

  async rebuildForTenant(tenantId: string): Promise<{ indexed: number }> {
    return this.engine.rebuild(tenantId);
  }
}

export const searchIndexService = new SearchIndexService();
