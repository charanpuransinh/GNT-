/**
 * M26 — adapters/real-search-engine-client.ts
 * WIRED (2026-09-12): verified `backend/package.json` has no Elasticsearch
 * client. Real search is Postgres-backed via the new `search_document`
 * table (migration 021), case-insensitive substring match on `content` —
 * genuinely real and tenant-scoped, but NOT ranked full-text search like
 * a real search engine would provide. Documented limitation, not hidden.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/common/config/prisma';
import type { BuiltSearchQuery } from '../search/search-query-builder';
import type { SearchDocument, SearchEngineClient, SearchEngineResult } from '../search/elasticsearch.service';

export class RealSearchEngineClient implements SearchEngineClient {
  async search(query: BuiltSearchQuery): Promise<SearchEngineResult> {
    const where = {
      companyId: query.tenantId,
      ...(query.entityTypes.length > 0 && { entityType: { in: query.entityTypes } }),
      ...(query.query && { content: { contains: query.query, mode: 'insensitive' as const } }),
    };

    const [rows, total] = await Promise.all([
      prisma.searchDocument.findMany({ where, skip: query.from, take: query.size, orderBy: { updatedAt: 'desc' } }),
      prisma.searchDocument.count({ where }),
    ]);

    return {
      items: rows.map((r) => ({
        id: r.entityId,
        entityType: r.entityType,
        tenantId: r.companyId,
        ...(r.fields as Record<string, unknown>),
      })),
      total,
    };
  }

  async indexDocument(doc: SearchDocument): Promise<void> {
    const { id, entityType, tenantId, ...fields } = doc;
    const content = Object.values(fields).filter((v) => typeof v === 'string' || typeof v === 'number').join(' ');
    await prisma.searchDocument.upsert({
      where: { companyId_entityType_entityId: { companyId: tenantId, entityType, entityId: id } },
      update: { content, fields: fields as Prisma.InputJsonValue },
      create: { companyId: tenantId, entityType, entityId: id, content, fields: fields as Prisma.InputJsonValue },
    });
  }

  async deleteDocument(entityType: string, id: string, tenantId: string): Promise<void> {
    await prisma.searchDocument.deleteMany({ where: { companyId: tenantId, entityType, entityId: id } });
  }

  /**
   * No other module currently calls SearchIndexService.indexEntity() to
   * populate search_document — that event-driven wiring (e.g. on
   * party.created, sales.invoice.created) is future work, not guessed here.
   * rebuildIndex() therefore only re-touches what IS already indexed for
   * this tenant and reports its count; it does not derive new documents
   * from other modules' source-of-truth tables.
   */
  async rebuildIndex(tenantId: string): Promise<{ indexed: number }> {
    const result = await prisma.searchDocument.updateMany({
      where: { companyId: tenantId },
      data: { updatedAt: new Date() },
    });
    return { indexed: result.count };
  }
}

export const realSearchEngineClient = new RealSearchEngineClient();
