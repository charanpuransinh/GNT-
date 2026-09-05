// ============================================================================
// M08 — approvedBy/postedBy कभी x-user-id header से नहीं (TEST_DB=1)
//
// पहले: approveInvoice/postInvoice controller `req.headers['x-user-id']` को
// सीधे approvedBy/postedBy मान लेते थे — कोई भी client यह header मनचाहा भेजकर
// किसी और के नाम पर invoice approve/post करवा सकता था, audit trail झूठा।
// यहाँ साबित करते हैं कि अब header कुछ भी हो, असली column में हमेशा token
// वाला असली user जाता है।
//
// साथ ही: सारे company/customer/product id प्लेन UUID हैं (कोई FK नहीं
// party_master/product_master पर — schema.prisma जाँच लिया), असली party/
// product बनाने की ज़रूरत नहीं।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M08 — approvedBy/postedBy header से spoof नहीं होते', () => {
  const branchId = randomUUID();
  const customerId = randomUUID();
  const productId = randomUUID();
  const impersonatedId = randomUUID();
  let invoiceId: string;

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });

    const res = await request(app).post('/api/v1/sales/invoices').set('Authorization', mintBearer()).send({
      branchId,
      customerId,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items: [{ productId, quantity: 1, rate: 100, taxRate: 0 }],
    });
    invoiceId = res.body.data.id;
  });

  afterAll(async () => {
    await prisma.salesInvoiceItem.deleteMany({ where: { salesInvoiceId: invoiceId } });
    await prisma.salesInvoice.deleteMany({ where: { id: invoiceId } });
  });

  it('approve: भेजा गया x-user-id header अनदेखा होता है', async () => {
    const res = await request(app)
      .post(`/api/v1/sales/invoices/${invoiceId}/approve`)
      .set('Authorization', mintBearer())
      .set('x-user-id', impersonatedId)
      .send({});

    expect(res.status).toBe(200);
    const row = await prisma.salesInvoice.findUnique({ where: { id: invoiceId } });
    expect(row?.approvedBy).toBe(TEST_USER_ID);
    expect(row?.approvedBy).not.toBe(impersonatedId);
  });
});
