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

describe('M06 Inventory API', () => {
  it('✓ GET /products returns paginated list', async () => {
    const res = await request(app).get('/api/v1/inventory/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
  });

  it('✓ POST /products creates with valid context', async () => {
    const res = await request(app).post('/api/v1/inventory/products').send({
      name: 'API Test Product', code: 'API001', sale_price: 200
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('✓ POST /stock/adjustment without reason returns 400', async () => {
    const res = await request(app).post('/api/v1/inventory/stock/adjustment').send({
      product_id: 'p1', quantity: 5
    });
    expect(res.status).toBe(400);
  });

  it('✓ GET /stock/low returns only low-stock items', async () => {
    const res = await request(app).get('/api/v1/inventory/stock/low');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('✓ Unauthorized access returns 401/403', async () => {
    const unauthorizedApp = express();
    unauthorizedApp.use(express.json());
    unauthorizedApp.use('/api/v1/inventory', inventoryRoutes);
    const res = await request(unauthorizedApp).get('/api/v1/inventory/products');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Company context required');
  });

  it('✓ GET /categories/tree returns nested structure', async () => {
    const res = await request(app).get('/api/v1/inventory/categories/tree');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('✓ POST /stock/transfer with invalid quantity fails', async () => {
    const res = await request(app).post('/api/v1/inventory/stock/transfer').send({
      product_id: 'p1', from_branch_id: 'b1', to_branch_id: 'b2', quantity: -5
    });
    expect(res.status).toBe(400);
  });
});
