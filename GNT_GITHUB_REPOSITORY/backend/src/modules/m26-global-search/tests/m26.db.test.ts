// ============================================================================
// M26 — Global Search — real DB + real HTTP wiring
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { mintBearer, TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';

import { searchQueryBuilder } from '../search/search-query-builder';
import { elasticsearchService } from '../search/elasticsearch.service';
import { searchIndexService } from '../search/search-index.service';
import { fullTextSearch } from '../search/full-text-search';
import { searchAccessGuard, SearchAccessDeniedError } from '../security/search-access-guard';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-0000000000f3';

describe.runIf(process.env.TEST_DB === '1')('M26 — Global Search (real Postgres-backed index)', () => {
  beforeAll(async () => {
    await registerModules();
    await prisma.searchDocument.deleteMany({ where: { companyId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] } } });
  });

  afterAll(async () => {
    await prisma.searchDocument.deleteMany({ where: { companyId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] } } });
  });

  describe('SearchQueryBuilder', () => {
    it('always injects tenantId into filters and requires it', () => {
      expect(() => searchQueryBuilder.build('', { query: 'x', entityTypes: [] })).toThrow();
      const built = searchQueryBuilder.build(TEST_COMPANY_ID, { query: 'acme', entityTypes: ['party'] });
      expect(built.filters.tenantId).toBe(TEST_COMPANY_ID);
    });
  });

  describe('ElasticsearchService -> real search_document table', () => {
    it('indexes, finds (tenant-scoped), and deletes a document via real Postgres', async () => {
      const entityId = randomUUID();
      await searchIndexService.indexEntity({
        id: entityId, entityType: 'party', tenantId: TEST_COMPANY_ID,
        searchableFields: { name: 'Acme Traders', city: 'Mumbai' },
      });
      // Same entityId in a different tenant must never leak into results.
      await searchIndexService.indexEntity({
        id: entityId, entityType: 'party', tenantId: OTHER_COMPANY_ID,
        searchableFields: { name: 'Acme Traders (other tenant)', city: 'Delhi' },
      });

      const resultSameTenant = await elasticsearchService.search(
        searchQueryBuilder.build(TEST_COMPANY_ID, { query: 'Acme', entityTypes: ['party'] }),
      );
      expect(resultSameTenant.total).toBe(1);
      expect(resultSameTenant.items[0].tenantId).toBe(TEST_COMPANY_ID);

      await searchIndexService.removeEntity('party', entityId, TEST_COMPANY_ID);
      const afterDelete = await elasticsearchService.search(
        searchQueryBuilder.build(TEST_COMPANY_ID, { query: 'Acme', entityTypes: ['party'] }),
      );
      expect(afterDelete.total).toBe(0);

      // Other tenant's document is untouched.
      const otherStillThere = await elasticsearchService.search(
        searchQueryBuilder.build(OTHER_COMPANY_ID, { query: 'Acme', entityTypes: ['party'] }),
      );
      expect(otherStillThere.total).toBe(1);
    });

    it('rebuildIndex reports the real count of currently-indexed documents for the tenant', async () => {
      await searchIndexService.indexEntity({ id: randomUUID(), entityType: 'party', tenantId: TEST_COMPANY_ID, searchableFields: { name: 'A' } });
      await searchIndexService.indexEntity({ id: randomUUID(), entityType: 'party', tenantId: TEST_COMPANY_ID, searchableFields: { name: 'B' } });
      const result = await elasticsearchService.rebuild(TEST_COMPANY_ID);
      const count = await prisma.searchDocument.count({ where: { companyId: TEST_COMPANY_ID } });
      expect(result.indexed).toBe(count);
    });
  });

  describe('FullTextSearch.execute', () => {
    it('paginates using real indexed rows', async () => {
      const response = await fullTextSearch.execute(TEST_COMPANY_ID, { query: '', entityTypes: ['party'], page: 1, pageSize: 1 }, 'corr-1');
      expect(response.page).toBe(1);
      expect(response.pageSize).toBe(1);
      expect(response.items.length).toBeLessThanOrEqual(1);
    });
  });

  describe('SearchAccessGuard — real permission model', () => {
    it('denies cross-tenant search', () => {
      expect(() =>
        searchAccessGuard.enforce({
          auth: { userId: TEST_USER_ID, tenantId: TEST_COMPANY_ID, permissions: ['M26:view'] },
          requestedTenantId: OTHER_COMPANY_ID,
          entityTypes: [],
        }),
      ).toThrow(SearchAccessDeniedError);
    });

    it('denies without M26:view', () => {
      expect(() =>
        searchAccessGuard.enforce({
          auth: { userId: TEST_USER_ID, tenantId: TEST_COMPANY_ID, permissions: [] },
          requestedTenantId: TEST_COMPANY_ID,
          entityTypes: [],
        }),
      ).toThrow(SearchAccessDeniedError);
    });

    it('denies payroll search without the owning module (M12) permission', () => {
      expect(() =>
        searchAccessGuard.enforce({
          auth: { userId: TEST_USER_ID, tenantId: TEST_COMPANY_ID, permissions: ['M26:view'] },
          requestedTenantId: TEST_COMPANY_ID,
          entityTypes: ['payroll'],
        }),
      ).toThrow(SearchAccessDeniedError);
    });

    it('allows payroll search when both M26:view and M12:view are present', () => {
      expect(() =>
        searchAccessGuard.enforce({
          auth: { userId: TEST_USER_ID, tenantId: TEST_COMPANY_ID, permissions: ['M26:view', 'M12:view'] },
          requestedTenantId: TEST_COMPANY_ID,
          entityTypes: ['payroll'],
        }),
      ).not.toThrow();
    });
  });

  describe('HTTP — GET /api/v1/search (real permission middleware, Owner role)', () => {
    it('200s for an authenticated Owner (has M26:view via seeded ALL_PERMISSIONS)', async () => {
      const res = await request(app)
        .get('/api/v1/search?q=Acme&entityTypes=party')
        .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('401s without a token', async () => {
      const res = await request(app).get('/api/v1/search?q=x');
      expect(res.status).toBe(401);
    });
  });
});
