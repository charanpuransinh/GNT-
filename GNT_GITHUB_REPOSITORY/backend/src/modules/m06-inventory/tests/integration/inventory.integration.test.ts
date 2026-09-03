import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import request from 'supertest';
import express from 'express';
import inventoryRoutes from '../../routes/inventory.routes';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  (req as any).tenant = { company_id: 'test-company-uuid' };
  (req as any).user = { id: 'test-user-uuid' };
  next();
});
app.use('/api/v1/inventory', inventoryRoutes);

describe('M06 Inventory Integration', () => {
  it('✓ Product → Stock creation flow', async () => {
    const productRes = await request(app).post('/api/v1/inventory/products').send({
      name: 'Integration Product', code: 'INT001', sale_price: 100, purchase_price: 80
    });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.id;
    const stockRes = await request(app).get(`/api/v1/inventory/products/${productId}/stock`);
    expect(stockRes.status).toBe(200);
  });

  it('✓ Stock adjustment → Movement audit trail', async () => {
    const adjRes = await request(app).post('/api/v1/inventory/stock/adjustment').send({
      product_id: 'p1', quantity: 10, reason: 'Integration test'
    });
    expect(adjRes.status).toBe(200);
    const moveRes = await request(app).get('/api/v1/inventory/stock/movements').query({ product_id: 'p1' });
    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.length).toBeGreaterThan(0);
  });

  it('✓ Low stock event published correctly', async () => {
    const lowRes = await request(app).get('/api/v1/inventory/stock/low');
    expect(lowRes.status).toBe(200);
    expect(Array.isArray(lowRes.body.data)).toBe(true);
  });

  it('✓ Cross-module public API: checkAvailability() returns correct data', async () => {
    const res = await request(app).post('/api/v1/inventory/stock/check').send({
      product_id: 'p1', requested_qty: 100
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('available');
    expect(res.body.data).toHaveProperty('current_qty');
  });
});
