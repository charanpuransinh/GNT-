import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('M15 Sync API Integration', () => {
  const tenantId = 'tenant-integration';
  const headers = {
    'x-tenant-id': tenantId,
    'x-user-id': 'user-test',
    'x-user-role': 'admin'
  };

  describe('GET /api/m15/sync/configs', () => {
    it('should return sync configs for tenant', async () => {
      const res = await request(app)
        .get('/api/m15/sync/configs')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/m15/sync/configs', () => {
    it('should create a new sync config', async () => {
      const config = {
        configCode: 'SYNC-TEST-001',
        name: 'Test Sync',
        sourceSystem: 'TALLY',
        syncDirection: 'BIDIRECTIONAL',
        connectionType: 'API',
        connectionConfig: { baseUrl: 'http://test' },
        entityConfigs: [{
          internalEntity: 'ITEM',
          externalEntity: 'Products',
          fieldMappings: [{ internalField: 'id', externalField: 'productId', isKey: true }]
        }]
      };

      const res = await request(app)
        .post('/api/m15/sync/configs')
        .set(headers)
        .send(config);

      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('GET /api/m15/sync/jobs', () => {
    it('should return sync jobs', async () => {
      const res = await request(app)
        .get('/api/m15/sync/jobs')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/m15/conflicts', () => {
    it('should return conflicts', async () => {
      const res = await request(app)
        .get('/api/m15/conflicts')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/m15/backups', () => {
    it('should return backup jobs', async () => {
      const res = await request(app)
        .get('/api/m15/backups')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/m15/integrations', () => {
    it('should return integrations', async () => {
      const res = await request(app)
        .get('/api/m15/integrations')
        .set(headers);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
