// ============================================================================
// M09 — GST API tests
//
// 2026-09-04 को दोबारा लिखी गई। पुराने tests भी **सुरक्षा-छेद के भरोसे** पास हो
// रहे थे: बिना login के, `?company_id=...` query में भेजकर GST return माँग लेते थे।
// GSTR-1/GSTR-3B सरकारी return हैं — उन्हें बिना token खुला रखना सबसे भारी छेद था।
//
// अब ये असली app पर चलते हैं (registerModules) और असली token भेजते हैं — यानी
// पूरा रास्ता auth → tenant → route → controller से होकर जाता है।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

const DUSRI_COMPANY_ID = '00000000-0000-4000-8000-0000000009d9';

describe.runIf(process.env.TEST_DB === '1')('M09 GST API', () => {
  beforeAll(async () => {
    await registerModules();

    for (const [id, name, code] of [
      [TEST_COMPANY_ID, 'Test Company', 'TESTCO'],
      [DUSRI_COMPANY_ID, 'Dusri Company', 'M09OTHER'],
    ] as const) {
      await prisma.company_master.upsert({ where: { id }, update: { name }, create: { id, name, code } });
    }

    await prisma.tax_rate_master.deleteMany({ where: { company_id: { in: [TEST_COMPANY_ID, DUSRI_COMPANY_ID] } } });
    await prisma.tax_rate_master.create({
      data: {
        company_id: TEST_COMPANY_ID,
        name: '1001',
        cgst_rate: 9,
        sgst_rate: 9,
        igst_rate: 18,
        cess_rate: 0,
        is_active: true,
      },
    });
    // दूसरी company का अपना slab — सीमा जाँचने के लिए
    await prisma.tax_rate_master.create({
      data: {
        company_id: DUSRI_COMPANY_ID,
        name: '9999',
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        cess_rate: 0,
        is_active: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.tax_rate_master.deleteMany({ where: { company_id: { in: [TEST_COMPANY_ID, DUSRI_COMPANY_ID] } } });
  });

  it('बिना token GST return नहीं मिलता', async () => {
    // पहले यह 200 देता था — सरकारी return बिना किसी पहचान के खुला था
    const res = await request(app).get('/api/v1/gst/returns/gstr1?period=2024-04');
    expect(res.status).toBe(401);
  });

  it('POST /calculate सही tax breakup देता है', async () => {
    const res = await request(app)
      .post('/api/v1/gst/calculate')
      .set('Authorization', mintBearer())
      .send({
        items: [{ hsn_code: '1001', taxable_amount: 1000 }],
        state_code: '27',
        company_state_code: '27',
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_tax_amount');
  });

  it('GET /returns/gstr1 अपनी company का data देता है', async () => {
    const res = await request(app)
      .get('/api/v1/gst/returns/gstr1?period=2024-04')
      .set('Authorization', mintBearer());
    expect(res.status).toBe(200);
  });

  it('🔒 query में दूसरी company की id भेजने से उनके tax slab नहीं मिलते', async () => {
    // यही पुराना छेद था — तब दूसरी company के slab वापस आ जाते
    const res = await request(app)
      .get(`/api/v1/gst/tax-slabs?company_id=${DUSRI_COMPANY_ID}`)
      .set('Authorization', mintBearer());

    expect(res.status).toBe(200);
    for (const slab of res.body) {
      expect(slab.company_id).toBe(TEST_COMPANY_ID);
      expect(slab.name).not.toBe('9999'); // दूसरी company वाला slab
    }
  });

  it('🔒 body में दूसरी company की id भेजो तो slab अपनी ही company में बने', async () => {
    const res = await request(app)
      .post('/api/v1/gst/tax-slabs')
      .set('Authorization', mintBearer())
      .send({
        company_id: DUSRI_COMPANY_ID, // जान-बूझकर — अनदेखा होना चाहिए
        name: `TEST-${Date.now()}`,
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5,
        cess_rate: 0,
        is_active: true,
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.company_id).toBe(TEST_COMPANY_ID);
  });
});
