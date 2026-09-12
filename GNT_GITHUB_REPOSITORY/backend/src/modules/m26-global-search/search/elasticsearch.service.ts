/**
 * M26 — search/elasticsearch.service.ts
 * OWN: External search-engine adapter.
 *
 * WIRED (2026-09-12): verified no Elasticsearch/search-engine dependency
 * exists in this repo. Default client is `realSearchEngineClient`
 * (adapters/real-search-engine-client.ts), Postgres-backed via the new
 * `search_document` table — not a guessed external engine.
 */

import { BuiltSearchQuery } from './search-query-builder';
import { realSearchEngineClient } from '../adapters/real-search-engine-client';

export interface SearchDocument {
  id: string;
  entityType: string;
  tenantId: string;
  [field: string]: unknown;
}

export interface SearchEngineResult {
  items: SearchDocument[];
  total: number;
}

export interface SearchEngineClient {
  search(query: BuiltSearchQuery): Promise<SearchEngineResult>;
  indexDocument(doc: SearchDocument): Promise<void>;
  deleteDocument(entityType: string, id: string, tenantId: string): Promise<void>;
  rebuildIndex(tenantId: string): Promise<{ indexed: number }>;
}

/** In-memory client — used only by unit tests that don't want real DB I/O. */
export class InMemorySearchEngineClient implements SearchEngineClient {
  private documents: SearchDocument[] = [];

  async search(query: BuiltSearchQuery): Promise<SearchEngineResult> {
    const matches = this.documents.filter((doc) => {
      if (doc.tenantId !== query.tenantId) return false;
      if (query.entityTypes.length > 0 && !query.entityTypes.includes(doc.entityType)) return false;
      if (!query.query) return true;
      const haystack = JSON.stringify(doc).toLowerCase();
      return haystack.includes(query.query.toLowerCase());
    });
    return {
      items: matches.slice(query.from, query.from + query.size),
      total: matches.length,
    };
  }

  async indexDocument(doc: SearchDocument): Promise<void> {
    this.documents = this.documents.filter((d) => !(d.id === doc.id && d.entityType === doc.entityType));
    this.documents.push(doc);
  }

  async deleteDocument(entityType: string, id: string, tenantId: string): Promise<void> {
    this.documents = this.documents.filter(
      (d) => !(d.entityType === entityType && d.id === id && d.tenantId === tenantId),
    );
  }

  async rebuildIndex(tenantId: string): Promise<{ indexed: number }> {
    const count = this.documents.filter((d) => d.tenantId === tenantId).length;
    return { indexed: count };
  }
}

export class ElasticsearchService {
  constructor(private readonly client: SearchEngineClient = realSearchEngineClient) {}

  search(query: BuiltSearchQuery): Promise<SearchEngineResult> {
    return this.client.search(query);
  }
  index(doc: SearchDocument): Promise<void> {
    return this.client.indexDocument(doc);
  }
  remove(entityType: string, id: string, tenantId: string): Promise<void> {
    return this.client.deleteDocument(entityType, id, tenantId);
  }
  rebuild(tenantId: string): Promise<{ indexed: number }> {
    return this.client.rebuildIndex(tenantId);
  }
}

export const elasticsearchService = new ElasticsearchService();
