import request from 'supertest';
import express from 'express';
import gstRoutes from '../../routes/gst.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/gst', gstRoutes);

describe('GST API', () => {
  it('POST /calculate returns correct tax breakup', async () => {
    const res = await request(app)
      .post('/api/v1/gst/calculate')
      .send({
        items: [{ hsn_code: '1001', taxable_amount: 1000 }],
        state_code: '27',
        company_state_code: '27',
        company_id: 'c1',
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_tax_amount');
  });

  it('GET /returns/gstr1 returns period data', async () => {
    const res = await request(app).get('/api/v1/gst/returns/gstr1?company_id=c1&period=2024-04');
    expect(res.status).toBe(200);
  });
});
