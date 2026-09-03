import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import request from 'supertest';
import express from 'express';
import gstRoutes from '../../routes/gst.routes';
import { prisma } from '@/common/config/prisma';

const app = express();
app.use(express.json());
app.use('/api/v1/gst', gstRoutes);

const COMPANY_ID = 'gst-test-co';

describe.runIf(process.env.TEST_DB === '1')(
'GST API', () => {
  beforeAll(async () => {
    await prisma.tax_rate_master.deleteMany({ where: { company_id: COMPANY_ID } });
    await prisma.tax_rate_master.create({
      data: {
        company_id: COMPANY_ID,
        name: '1001',
        cgst_rate: 9,
        sgst_rate: 9,
        igst_rate: 18,
        cess_rate: 0,
        is_active: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.tax_rate_master.deleteMany({ where: { company_id: COMPANY_ID } });
  });

  it('POST /calculate returns correct tax breakup', async () => {
    const res = await request(app)
      .post('/api/v1/gst/calculate')
      .send({
        items: [{ hsn_code: '1001', taxable_amount: 1000 }],
        state_code: '27',
        company_state_code: '27',
        company_id: COMPANY_ID,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_tax_amount');
  });

  it('GET /returns/gstr1 returns period data', async () => {
    const res = await request(app).get(`/api/v1/gst/returns/gstr1?company_id=${COMPANY_ID}&period=2024-04`);
    expect(res.status).toBe(200);
  });
});
