/**
 * M18 — API Tests (HTTP Layer)
 * Owner: D4-DELTA
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { createApp } from './test-app'; // Assume test harness exposes app factory

describe('M18 API Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/v1/integrations', () => {
    it('should return 200 with paginated integrations', async () => {
      const res = await request(app)
        .get('/api/v1/integrations')
        .query({ company_id: '00000000-0000-0000-0000-000000000001', page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.page).toBe(1);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/v1/integrations')
        .query({ type: 'sms' })
        .expect(200);

      expect(res.body.data.items.every((i: any) => i.type === 'sms')).toBe(true);
    });
  });

  describe('POST /api/v1/integrations', () => {
    it('should create integration and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/integrations')
        .send({
          company_id: '00000000-0000-0000-0000-000000000001',
          provider: 'Razorpay',
          type: 'payment',
          config_json: { key_id: 'rzp_test', key_secret: 'secret' },
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('pending');
    });

    it('should return 400 for invalid type', async () => {
      await request(app)
        .post('/api/v1/integrations')
        .send({
          company_id: '00000000-0000-0000-0000-000000000001',
          provider: 'X',
          type: 'invalid_type',
          config_json: {},
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/integrations/test', () => {
    it('should test connection and return result', async () => {
      // First create an integration
      const createRes = await request(app)
        .post('/api/v1/integrations')
        .send({
          company_id: '00000000-0000-0000-0000-000000000001',
          provider: 'Stripe',
          type: 'payment',
          config_json: { secret_key: 'sk_test' },
        });

      const id = createRes.body.data.id;

      const res = await request(app)
        .post('/api/v1/integrations/test')
        .send({ integration_id: id })
        .expect(200);

      expect(res.body.data.success).toBeDefined();
      expect(res.body.data.latency_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/v1/integrations/api-keys', () => {
    it('should generate API key and show plain key once', async () => {
      const res = await request(app)
        .post('/api/v1/integrations/api-keys')
        .send({
          company_id: '00000000-0000-0000-0000-000000000001',
          name: 'Test Key',
          permissions: ['gateway:read'],
          created_by: '00000000-0000-0000-0000-000000000002',
        })
        .expect(201);

      expect(res.body.data.plain_key).toMatch(/^gnt_/);
      expect(res.body.data.id).toBeDefined();
    });
  });

  describe('POST /api/v1/integrations/webhook/:provider', () => {
    it('should always return 200 even on error', async () => {
      const res = await request(app)
        .post('/api/v1/integrations/webhook/unknown-provider')
        .send({ event: 'test' })
        .expect(200);

      expect(res.body.received).toBe(true);
    });

    it('should accept Razorpay webhook payload', async () => {
      const res = await request(app)
        .post('/api/v1/integrations/webhook/razorpay')
        .set('X-Razorpay-Signature', 'test-sig')
        .send({
          event: 'payment.captured',
          payload: {
            payment: { entity: { order_id: 'order_123' } },
          },
        })
        .expect(200);

      expect(res.body.log_id).toBeDefined();
    });
  });
});
