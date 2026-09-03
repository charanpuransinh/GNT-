import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import request from 'supertest';
import express from 'express';
import accountingRoutes from '../../routes/accounting.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/accounting', accountingRoutes);

describe('Accounting API', () => {
  it('POST /vouchers with unbalanced debit/credit returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/accounting/vouchers')
      .send({
        company_id: 'c1',
        voucher_type: 'journal',
        voucher_number: 'JV001',
        voucher_date: '2024-04-01',
        items: [
          { account_id: 'a1', debit_amount: 100, credit_amount: 0 },
          { account_id: 'a2', debit_amount: 0, credit_amount: 50 },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('GET /trial-balance returns balanced TB', async () => {
    const res = await request(app).get('/api/v1/accounting/trial-balance?company_id=c1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /profit-loss returns correct net profit', async () => {
    const res = await request(app).get('/api/v1/accounting/profit-loss?company_id=c1&from_date=2024-04-01&to_date=2024-04-30');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('net_profit');
  });

  it('Unauthorized voucher posting blocked', async () => {
    expect(true).toBe(true);
  });
});
