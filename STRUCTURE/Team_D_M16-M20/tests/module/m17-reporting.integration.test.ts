/**
 * M17 Reporting — Integration Tests
 * Owner: D4-DELTA
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../../test-utils/server';
import { createTestDatabase } from '../../test-utils/database';

describe('M17 Reporting — Integration Tests', () => {
  let server: any;
  let db: any;

  beforeAll(async () => {
    db = await createTestDatabase();
    server = createTestServer({ database: db });
  });

  afterAll(async () => {
    await db.close();
    await server.close();
  });

  it('should generate sales report end-to-end', async () => {
    const response = await server.request()
      .post('/api/v1/reports/generate')
      .set('x-company-id', 'test-company')
      .send({
        reportType: 'sales',
        filters: { dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.reportType).toBe('sales');
  });

  it('should generate inventory report end-to-end', async () => {
    const response = await server.request()
      .post('/api/v1/reports/generate')
      .set('x-company-id', 'test-company')
      .send({
        reportType: 'inventory',
        filters: { warehouseId: 'wh-1' },
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should create and retrieve report config', async () => {
    const createResponse = await server.request()
      .post('/api/v1/reports/configs')
      .set('x-company-id', 'test-company')
      .set('x-user-id', 'test-user')
      .send({
        companyId: 'test-company',
        name: 'Monthly Sales Config',
        reportType: 'sales',
        filtersJson: { dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

    expect(createResponse.status).toBe(201);
    const configId = createResponse.body.data.id;

    const getResponse = await server.request()
      .get('/api/v1/reports/configs')
      .set('x-company-id', 'test-company');

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toBeInstanceOf(Array);
    expect(getResponse.body.data.some((c: any) => c.id === configId)).toBe(true);
  });

  it('should create and retrieve report template', async () => {
    const createResponse = await server.request()
      .post('/api/v1/reports/templates')
      .set('x-company-id', 'test-company')
      .set('x-user-id', 'test-user')
      .send({
        companyId: 'test-company',
        name: 'Standard PDF Template',
        templateType: 'pdf',
        layoutJson: { columnWidths: [80, 120, 100] },
      });

    expect(createResponse.status).toBe(201);
    const templateId = createResponse.body.data.id;

    const getResponse = await server.request()
      .get('/api/v1/reports/templates')
      .set('x-company-id', 'test-company');

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.some((t: any) => t.id === templateId)).toBe(true);
  });
});
