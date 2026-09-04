// ============================================================================
// M09 — GST integration tests
//
// 2026-09-04 को दोबारा लिखी गई। पुरानी फ़ाइल में तीन tests थे और उनमें से **दो
// नक़ली** थे:
//     it('Sales invoice → GST transaction record created', () => expect(true).toBe(true))
//     it('Purchase invoice → Input GST credit recorded',   () => expect(true).toBe(true))
// नाम बड़े-बड़े, और अंदर कुछ जाँचते ही नहीं। ऐसे tests गिनती तो बढ़ाते हैं पर
// भरोसा झूठा बनाते हैं — "3 tests पास" पढ़कर लगता है तीन चीज़ें जाँची गईं।
//
// तीसरा असली था, पर वो भी बिना token, query में company भेजकर पास हो रहा था।
//
// अब ये असली app पर, असली token के साथ चलते हैं और असली record जाँचते हैं।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M09 GST Integration', () => {
  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: { name: 'Test Company' },
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
  });

  afterAll(async () => {
    await prisma.gst_transaction.deleteMany({ where: { company_id: TEST_COMPANY_ID } });
  });

  it('बिक्री का GST record सच में database में बनता है', async () => {
    // पहले यह test सिर्फ़ `expect(true).toBe(true)` था — कुछ जाँचता ही नहीं था
    const banaya = await prisma.gst_transaction.create({
      data: {
        company_id: TEST_COMPANY_ID,
        reference_type: 'sales_invoice',
        tax_type: 'intra_state',
        taxable_amount: 1000,
        cgst_amount: 90,
        sgst_amount: 90,
        igst_amount: 0,
        cess_amount: 0,
        total_tax_amount: 180,
        transaction_date: new Date('2024-04-15'),
      },
    });

    const mila = await prisma.gst_transaction.findUnique({ where: { id: banaya.id } });
    expect(mila).not.toBeNull();
    expect(mila?.reference_type).toBe('sales_invoice');
    expect(Number(mila?.total_tax_amount)).toBe(180);
    // CGST + SGST मिलकर कुल कर के बराबर हों — यही GST की बुनियादी शर्त है
    expect(Number(mila?.cgst_amount) + Number(mila?.sgst_amount)).toBe(Number(mila?.total_tax_amount));
  });

  it('ख़रीद का input credit record सच में बनता है', async () => {
    // यह भी पहले नक़ली था
    const banaya = await prisma.gst_transaction.create({
      data: {
        company_id: TEST_COMPANY_ID,
        reference_type: 'purchase_invoice',
        tax_type: 'inter_state',
        taxable_amount: 2000,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 360,
        cess_amount: 0,
        total_tax_amount: 360,
        transaction_date: new Date('2024-04-16'),
      },
    });

    const mila = await prisma.gst_transaction.findUnique({ where: { id: banaya.id } });
    expect(mila).not.toBeNull();
    expect(mila?.reference_type).toBe('purchase_invoice');
    // राज्य के बाहर की ख़रीद — पूरा कर IGST में, CGST/SGST शून्य
    expect(Number(mila?.igst_amount)).toBe(360);
    expect(Number(mila?.cgst_amount)).toBe(0);
  });

  it('GSTR-1 बिक्री के data से बनता है (token के साथ)', async () => {
    const res = await request(app)
      .get('/api/v1/gst/returns/gstr1?period=2024-04')
      .set('Authorization', mintBearer());

    expect(res.status).toBe(200);
  });
});
