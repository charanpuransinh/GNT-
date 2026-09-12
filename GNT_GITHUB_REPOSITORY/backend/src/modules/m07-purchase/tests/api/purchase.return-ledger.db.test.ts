// ============================================================================
// M07 — Purchase Return post होते ही असली M10 ledger reversal + M09 GST reversal
//
// पहले: ledgerServiceForHandlers.createPurchaseReturnEntry हमेशा throw करता था
// ("not implemented yet") — यानी कोई purchase-return कभी post हो ही नहीं सकता
// था, और postPurchaseReturn पहले status 'posted' कर देता, फिर side-effects चलाता
// (उल्टा क्रम) — फेल होने पर भी DB में 'posted' दिखता, stock घट चुकी होती।
// अब: side-effects पहले, status बाद में; ledger reversal असली voucher बनाता है;
// GST reversal negative gst_transaction row लिखता है (GSTR sum में असली कटौती)।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M07 — Purchase Return ledger + GST reversal (live DB)', () => {
  const branchId = randomUUID();
  const supplierId = randomUUID();
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
    // stock_master.product_id पर असली FK है — invoice post होते ही addStock चलता
    // है, बिना असली product_master row के FK violation पर 400 देता (जो earlier
    // audit-identity test कभी नहीं पकड़ता क्योंकि वो कभी /post नहीं बुलाता, सिर्फ़ /approve)।
    await prisma.product_master.create({
      data: { id: productId, company_id: TEST_COMPANY_ID, name: `PRT test product ${stamp}` },
    });

    const created = await request(app).post('/api/v1/purchase/invoices').set('Authorization', mintBearer()).send({
      branch_id: branchId,
      supplier_id: supplierId,
      invoice_number: `PRT-${stamp}-1`,
      invoice_date: '2024-04-01',
      items: [{ product_id: productId, quantity: 1, rate: 1000, tax_rate: 18 }],
    });
    invoiceId = created.body.data.id;

    await request(app).post(`/api/v1/purchase/invoices/${invoiceId}/approve`).set('Authorization', mintBearer());
    await request(app).post(`/api/v1/purchase/invoices/${invoiceId}/post`).set('Authorization', mintBearer());
  });

  afterAll(async () => {
    await prisma.purchase_return.deleteMany({ where: { company_id: TEST_COMPANY_ID, return_number: { contains: `PRT-${stamp}` } } });
    await prisma.purchase_invoice.deleteMany({ where: { company_id: TEST_COMPANY_ID, invoice_number: { contains: `PRT-${stamp}` } } });
    await prisma.product_master.delete({ where: { id: productId } }).catch(() => {});
  });

  it('invoice असल में posted है और M10/M09 दोनों में असली entry बनी (आगे की जाँच का आधार)', async () => {
    const inv = await prisma.purchase_invoice.findUnique({ where: { id: invoiceId } });
    expect(inv?.status).toBe('posted');

    const voucher = await prisma.ledger.findFirst({ where: { company_id: TEST_COMPANY_ID, reference_type: 'PURCHASE_INVOICE', reference_id: invoiceId } });
    expect(voucher).not.toBeNull();

    const gst = await prisma.gst_transaction.findFirst({ where: { company_id: TEST_COMPANY_ID, reference_type: 'purchase_invoice', reference_id: invoiceId } });
    expect(gst).not.toBeNull();
    expect(Number(gst?.total_tax_amount)).toBe(180);
  });

  it('return post होते ही ledger reversal voucher बनता है (पहले हमेशा throw होता था)', async () => {
    const created = await request(app).post('/api/v1/purchase/returns').set('Authorization', mintBearer()).send({
      purchase_invoice_id: invoiceId,
      supplier_id: supplierId,
      return_number: `PRT-${stamp}-R1`,
      return_date: '2024-04-05',
      items: [{ product_id: productId, quantity: 1, rate: 1000, tax_amount: 180 }],
    });
    expect(created.status).toBe(201);
    returnId = created.body.data.id;

    const approved = await request(app).post(`/api/v1/purchase/returns/${returnId}/approve`).set('Authorization', mintBearer());
    expect(approved.status).toBe(200);

    const posted = await request(app).post(`/api/v1/purchase/returns/${returnId}/post`).set('Authorization', mintBearer());
    expect(posted.status).toBe(200);

    const ret = await prisma.purchase_return.findUnique({ where: { id: returnId } });
    expect(ret?.status).toBe('posted');

    const ledgerRows = await prisma.ledger.findMany({ where: { company_id: TEST_COMPANY_ID, reference_type: 'PURCHASE_RETURN', reference_id: returnId } });
    expect(ledgerRows.length).toBeGreaterThan(0);
    const totalDebit = ledgerRows.reduce((s, r) => s + Number(r.debit_amount), 0);
    const totalCredit = ledgerRows.reduce((s, r) => s + Number(r.credit_amount), 0);
    expect(totalDebit).toBeCloseTo(1180, 2); // net (creditors debited — payable घटा)
    expect(totalCredit).toBeCloseTo(1180, 2); // purchases 1000 + gst-input 180 (credit — reversal)

    const gstReversal = await prisma.gst_transaction.findFirst({ where: { company_id: TEST_COMPANY_ID, reference_type: 'purchase_return', reference_id: returnId } });
    expect(gstReversal).not.toBeNull();
    expect(Number(gstReversal?.total_tax_amount)).toBe(-180);
    expect(Number(gstReversal?.taxable_amount)).toBe(-1000);
  });
});
