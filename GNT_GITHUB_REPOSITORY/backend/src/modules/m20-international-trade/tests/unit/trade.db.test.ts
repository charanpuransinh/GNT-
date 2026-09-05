// ============================================================================
// M20 — Trade (DB-gated): export shipment create → list → get → tenant isolation
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const COMPANY_ID = '00000000-0000-4000-8000-000000000040';
const OTHER_ID = '00000000-0000-4000-8000-000000000041';
const HSN = '84713000';
const auth = () => mintBearer(COMPANY_ID, TEST_USER_ID);
const authOther = () => mintBearer(OTHER_ID, TEST_USER_ID);

async function cleanup() {
  await prisma.trade_document.deleteMany({ where: { trade_job: { company_id: { in: [COMPANY_ID, OTHER_ID] } } } });
  await prisma.trade_job.deleteMany({ where: { company_id: { in: [COMPANY_ID, OTHER_ID] } } });
  await prisma.customs_tariff.deleteMany({ where: { code: HSN } });
}

describe.runIf(process.env.TEST_DB === '1')('M20 trade — live DB', () => {
  let shipmentId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: COMPANY_ID },
      update: { name: 'Trade Co' },
      create: { id: COMPANY_ID, name: 'Trade Co', code: 'TRDCO' },
    });
    await prisma.company_master.upsert({
      where: { id: OTHER_ID },
      update: { name: 'Trade Other' },
      create: { id: OTHER_ID, name: 'Trade Other', code: 'TRDOT' },
    });
    await cleanup();
    await prisma.customs_tariff.create({
      data: {
        code: HSN, description: 'Automatic data processing machines',
        chapter: '84', heading: '8471', subheading: '847130', tariff_item: HSN,
        gst_rate: 18, igst_rate: 18, cess_rate: 0,
      },
    });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('export shipment create → list → get → tenant isolation → delete', async () => {
    const created = await request(app)
      .post('/api/v1/trade/exports')
      .set('Authorization', auth())
      .send({
        type: 'export', reference_no: 'EXP-TEST-1', party_id: 'party-1', product_id: 'prod-1',
        hsn_code: HSN, quantity: 10, currency: 'USD', value_fob: 1000, fx_rate: 83,
      });
    expect(created.status).toBe(201);
    shipmentId = created.body.id;

    const list = await request(app).get('/api/v1/trade/shipments').set('Authorization', auth());
    expect(list.status).toBe(200);
    expect(list.body.data.some((s: { id: string }) => s.id === shipmentId)).toBe(true);

    const one = await request(app).get(`/api/v1/trade/shipments/${shipmentId}`).set('Authorization', auth());
    expect(one.status).toBe(200);
    expect(one.body.reference_no).toBe('EXP-TEST-1');

    const other = await request(app).get(`/api/v1/trade/shipments/${shipmentId}`).set('Authorization', authOther());
    expect(other.status).toBe(404);

    const del = await request(app).delete(`/api/v1/trade/shipments/${shipmentId}`).set('Authorization', auth());
    expect([200, 204]).toContain(del.status);
  });
});
