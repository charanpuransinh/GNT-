// ============================================================================
// M07 — created_by/approved_by/posted_by कभी request body से नहीं (TEST_DB=1)
//
// पहले: PO create, invoice create, invoice approve/post, return post, और
// PO-to-invoice convert — सभी में असली user की जगह body में भेजा गया
// user_id/created_by/approved_by/posted_by इस्तेमाल हो जाता था। यानी कोई भी
// login किया हुआ user किसी और के नाम पर record बनवा/approve/post करवा सकता
// था — audit trail झूठा। यहाँ साबित करते हैं कि अब body में जो भी भेजो,
// असली column में हमेशा token वाले असली user की id ही जाती है।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M07 — असली पहचान token से, body से कभी नहीं', () => {
  const branchId = randomUUID();
  const supplierId = randomUUID();
  const productId = randomUUID();
  const impersonatedId = randomUUID();
  const stamp = Date.now();

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
  });

  afterAll(async () => {
    await prisma.purchase_invoice.deleteMany({ where: { company_id: TEST_COMPANY_ID, invoice_number: { contains: `AUD-${stamp}` } } });
    await prisma.purchase_order.deleteMany({ where: { company_id: TEST_COMPANY_ID, po_number: { contains: `AUD-${stamp}` } } });
  });

  it('POST /purchase/invoices: भेजा गया created_by अनदेखा होता है, token वाला user लिखा जाता है', async () => {
    const res = await request(app).post('/api/v1/purchase/invoices').set('Authorization', mintBearer()).send({
      branch_id: branchId,
      supplier_id: supplierId,
      invoice_number: `AUD-${stamp}-1`,
      invoice_date: '2024-04-01',
      created_by: impersonatedId, // छेड़ने की कोशिश — schema अब इसे स्वीकार ही नहीं करती
      items: [{ product_id: productId, quantity: 1, rate: 100 }],
    });

    expect(res.status).toBe(201);
    const row = await prisma.purchase_invoice.findUnique({ where: { id: res.body.data.id } });
    expect(row?.created_by).toBe(TEST_USER_ID);
    expect(row?.created_by).not.toBe(impersonatedId);
  });

  it('POST /purchase/invoices/{id}/approve: भेजा गया approved_by अनदेखा होता है', async () => {
    const created = await request(app).post('/api/v1/purchase/invoices').set('Authorization', mintBearer()).send({
      branch_id: branchId,
      supplier_id: supplierId,
      invoice_number: `AUD-${stamp}-2`,
      invoice_date: '2024-04-01',
      items: [{ product_id: productId, quantity: 1, rate: 100 }],
    });

    const res = await request(app)
      .post(`/api/v1/purchase/invoices/${created.body.data.id}/approve`)
      .set('Authorization', mintBearer())
      .send({ approved_by: impersonatedId });

    expect(res.status).toBe(200);
    const row = await prisma.purchase_invoice.findUnique({ where: { id: created.body.data.id } });
    expect(row?.approved_by).toBe(TEST_USER_ID);
    expect(row?.approved_by).not.toBe(impersonatedId);
  });

  it('POST /purchase/orders: भेजा गया created_by अनदेखा होता है', async () => {
    const res = await request(app).post('/api/v1/purchase/orders').set('Authorization', mintBearer()).send({
      branch_id: branchId,
      supplier_id: supplierId,
      po_number: `AUD-${stamp}-PO1`,
      po_date: '2024-04-01',
      created_by: impersonatedId,
      items: [{ product_id: productId, quantity: 1, rate: 100 }],
    });

    expect(res.status).toBe(201);
    const row = await prisma.purchase_order.findUnique({ where: { id: res.body.data.id } });
    expect(row?.created_by).toBe(TEST_USER_ID);
    expect(row?.created_by).not.toBe(impersonatedId);
  });
});
