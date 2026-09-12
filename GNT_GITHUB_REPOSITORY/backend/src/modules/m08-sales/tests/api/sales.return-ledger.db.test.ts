// ============================================================================
// M08 — Sales Return post होते ही असली M10 ledger reversal + M09 GST reversal
//
// पहले: `injectReturnDependencies()` कभी बुलाई ही नहीं जाती थी (grep-verified) —
// postReturn हमेशा "M08 return dependencies are not fully wired" पर throw करता,
// यानी कोई sales-return कभी post नहीं हो सकता था। अब असली M06/M09/M10 services।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M08 — Sales Return ledger + GST reversal (live DB)', () => {
  const branchId = randomUUID();
  const customerId = randomUUID();
  const productId = randomUUID();
  const stamp = Date.now();
  let invoiceId = '';
  let returnId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    // stock_master.product_id पर असली FK है — invoice post/return post दोनों
    // असली addStock चलाते हैं।
    await prisma.product_master.create({
      data: { id: productId, company_id: TEST_COMPANY_ID, name: `SRT test product ${stamp}` },
    });

    const created = await request(app).post('/api/v1/sales/invoices').set('Authorization', mintBearer()).send({
      branchId,
      customerId,
      invoiceNumber: `SRT-${stamp}-1`,
      invoiceDate: new Date('2024-04-01').toISOString(),
      dueDate: new Date('2024-04-15').toISOString(),
      items: [{ productId, quantity: 1, rate: 1000, taxRate: 18 }],
    });
    invoiceId = created.body.data.id;

    await request(app).post(`/api/v1/sales/invoices/${invoiceId}/approve`).set('Authorization', mintBearer());
    await request(app).post(`/api/v1/sales/invoices/${invoiceId}/post`).set('Authorization', mintBearer());
  });

  afterAll(async () => {
    await prisma.salesReturn.deleteMany({ where: { companyId: TEST_COMPANY_ID, returnNumber: { contains: `SRT-${stamp}` } } });
    await prisma.salesInvoice.deleteMany({ where: { companyId: TEST_COMPANY_ID, invoiceNumber: { contains: `SRT-${stamp}` } } });
    await prisma.product_master.delete({ where: { id: productId } }).catch(() => {});
  });

  it('invoice असल में posted है और M10/M09 दोनों में असली entry बनी', async () => {
    const inv = await prisma.salesInvoice.findUnique({ where: { id: invoiceId } });
    expect(inv?.status).toBe('posted');

    const voucher = await prisma.ledger.findFirst({ where: { company_id: TEST_COMPANY_ID, reference_type: 'SALES_INVOICE', reference_id: invoiceId } });
    expect(voucher).not.toBeNull();

    const gst = await prisma.gst_transaction.findFirst({ where: { company_id: TEST_COMPANY_ID, reference_type: 'sales_invoice', reference_id: invoiceId } });
    expect(gst).not.toBeNull();
    expect(Number(gst?.total_tax_amount)).toBe(180);
  });

  it('return post होते ही ledger reversal voucher बनता है (पहले हमेशा throw होता था)', async () => {
    const created = await request(app).post('/api/v1/sales/returns').set('Authorization', mintBearer()).send({
      salesInvoiceId: invoiceId,
      customerId,
      returnNumber: `SRT-${stamp}-R1`,
      returnDate: new Date('2024-04-05').toISOString(),
      items: [{ productId, quantity: 1, rate: 1000 }],
    });
    expect(created.status).toBe(201);
    returnId = created.body.data.id;

    const approved = await request(app).post(`/api/v1/sales/returns/${returnId}/approve`).set('Authorization', mintBearer());
    expect(approved.status).toBe(200);

    const posted = await request(app).post(`/api/v1/sales/returns/${returnId}/post`).set('Authorization', mintBearer());
    expect(posted.status).toBe(200);

    const ret = await prisma.salesReturn.findUnique({ where: { id: returnId } });
    expect(ret?.status).toBe('posted');

    const ledgerRows = await prisma.ledger.findMany({ where: { company_id: TEST_COMPANY_ID, reference_type: 'SALES_RETURN', reference_id: returnId } });
    expect(ledgerRows.length).toBeGreaterThan(0);
    const totalDebit = ledgerRows.reduce((s, r) => s + Number(r.debit_amount), 0);
    const totalCredit = ledgerRows.reduce((s, r) => s + Number(r.credit_amount), 0);
    expect(totalDebit).toBeCloseTo(1180, 2);
    expect(totalCredit).toBeCloseTo(1180, 2);

    const gstReversal = await prisma.gst_transaction.findFirst({ where: { company_id: TEST_COMPANY_ID, reference_type: 'sales_return', reference_id: returnId } });
    expect(gstReversal).not.toBeNull();
    expect(Number(gstReversal?.total_tax_amount)).toBe(-180);
    expect(Number(gstReversal?.taxable_amount)).toBe(-1000);
  });
});
