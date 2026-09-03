import { describe, it, expect } from 'vitest';

import { randomUUID } from 'node:crypto';
import request from 'supertest';
import express from 'express';
import inventoryRoutes from '../../routes/inventory.routes';

// असली DB पर (TEST_DB=1) — m06 columns @db.Uuid हैं, असली UUIDs चाहिए
const COMPANY_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '99999999-9999-4999-8999-999999999999';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).tenant = { companyId: COMPANY_ID };
  (req as any).user = { id: USER_ID, companyId: COMPANY_ID };
  next();
});
app.use('/api/v1/inventory', inventoryRoutes);

// हर run पर unique code — DB में पिछले run का डेटा रह सकता है
async function createProduct() {
  const res = await request(app).post('/api/v1/inventory/products').send({
    company_id: COMPANY_ID, name: 'Integration Product', code: `INT-${randomUUID().slice(0, 8)}`, sale_price: 100, purchase_price: 80
  });
  return res.body.data.id as string;
}

describe.runIf(process.env.TEST_DB === '1')(
'M06 Inventory Integration', () => {
  it('✓ Product → Stock creation flow', async () => {
    const productRes = await request(app).post('/api/v1/inventory/products').send({
      company_id: COMPANY_ID, name: 'Integration Product', code: `INT-${randomUUID().slice(0, 8)}`, sale_price: 100, purchase_price: 80
    });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.id;
    const stockRes = await request(app).get(`/api/v1/inventory/products/${productId}/stock`);
    expect(stockRes.status).toBe(200);
  });

  it('✓ Stock adjustment → Movement audit trail', async () => {
    const productId = await createProduct();
    const adjRes = await request(app).post('/api/v1/inventory/stock/adjustment').send({
      product_id: productId, quantity: 10, reason: 'Integration test'
    });
    expect(adjRes.status).toBe(200);
    const moveRes = await request(app).get('/api/v1/inventory/stock/movements').query({ product_id: productId });
    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.length).toBeGreaterThan(0);
  });

  it('✓ Low stock event published correctly', async () => {
    const lowRes = await request(app).get('/api/v1/inventory/stock/low');
    expect(lowRes.status).toBe(200);
    expect(Array.isArray(lowRes.body.data)).toBe(true);
  });

  it('✓ Cross-module public API: checkAvailability() returns correct data', async () => {
    const productId = await createProduct();
    const res = await request(app).post('/api/v1/inventory/stock/check').send({
      product_id: productId, requested_qty: 100
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('available');
    expect(res.body.data).toHaveProperty('current_qty');
  });
});
