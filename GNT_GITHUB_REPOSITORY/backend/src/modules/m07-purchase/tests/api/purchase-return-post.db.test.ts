// ============================================================================
// M07 — POST /purchase/returns/:id/post अब असल में चलता है (TEST_DB=1)
//
// पहले: repository.postReturn() status बदलता, फिर handleReturnPosted() जिसका
// M10 adapter unconditionally throw करता था → route हमेशा 500, return DB में
// 'posted' पर stuck, कोई voucher नहीं। अब: side-effects पहले (M06 stock deduct +
// M10 debit-note voucher), फिर status। यहाँ पूरे stack से साबित करते हैं।
// ============================================================================

import { randomUUID } from 'node:crypto';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app, registerModules } from '../../../../app';

describe.runIf(process.env.TEST_DB === '1')('M07 — purchase return post (full stack)', () => {
  const branchId = randomUUID();
  const supplierId = randomUUID();
  const productId = randomUUID();
  const stamp = Date.now();

  async function cleanup() {
    await prisma.ledger.deleteMany({
      where: { company_id: TEST_COMPANY_ID, narration: { contains: `PRET-${stamp}` } },
    });
    await prisma.purchase_return_item.deleteMany({
      where: { purchase_return: { return_number: { contains: `PRET-${stamp}` } } },
    });
    await prisma.purchase_return.deleteMany({
      where: { return_number: { contains: `PRET-${stamp}` } },
    });
    await prisma.purchase_invoice_item.deleteMany({
      where: { purchase_invoice: { invoice_number: { contains: `PRET-${stamp}` } } },
    });
    await prisma.purchase_invoice.deleteMany({
      where: { invoice_number: { contains: `PRET-${stamp}` } },
    });
    await prisma.stock_movement.deleteMany({
      where: { company_id: TEST_COMPANY_ID, product_id: productId },
    });
    await prisma.stock_master.deleteMany({
      where: { company_id: TEST_COMPANY_ID, product_id: productId },
    });
    await prisma.product_master.deleteMany({ where: { id: productId } });
    await prisma.party_master.deleteMany({ where: { id: supplierId } });
  }

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    await cleanup();
    await prisma.party_master.create({
      data: {
        id: supplierId,
        company_id: TEST_COMPANY_ID,
        party_type: 'supplier',
        name: 'PRet Supplier',
      },
    });
    await prisma.product_master.create({
      data: {
        id: productId,
        company_id: TEST_COMPANY_ID,
        name: 'PRet Widget',
        code: `PRET-${stamp}`,
        sale_price: 100,
      },
    });
  });

  afterAll(cleanup);

  it('create → approve → post purchase invoice, then create → approve → POST return: 200 + real M10 debit-note + stock down', async () => {
    // 1. purchase invoice: qty 5 @ 100 + 18% tax
    const inv = await request(app)
      .post('/api/v1/purchase/invoices')
      .set('Authorization', mintBearer())
      .send({
        branch_id: branchId,
        supplier_id: supplierId,
        invoice_number: `PRET-${stamp}-INV`,
        invoice_date: '2026-09-01',
        items: [{ product_id: productId, quantity: 5, rate: 100, tax_rate: 18 }],
      });
    expect(inv.status).toBe(201);
    const invId = inv.body.data.id;
    await request(app)
      .post(`/api/v1/purchase/invoices/${invId}/approve`)
      .set('Authorization', mintBearer())
      .send({});
    const postInv = await request(app)
      .post(`/api/v1/purchase/invoices/${invId}/post`)
      .set('Authorization', mintBearer())
      .send({});
    expect(postInv.status).toBe(200);

    const stockAfterBuy = await prisma.stock_master.aggregate({
      where: { company_id: TEST_COMPANY_ID, product_id: productId },
      _sum: { quantity: true },
    });
    expect(Number(stockAfterBuy._sum.quantity ?? 0)).toBe(5);

    // 2. purchase return: 2 units back to supplier
    const ret = await request(app)
      .post('/api/v1/purchase/returns')
      .set('Authorization', mintBearer())
      .send({
        purchase_invoice_id: invId,
        supplier_id: supplierId,
        return_number: `PRET-${stamp}-RET`,
        return_date: '2026-09-05',
        items: [{ product_id: productId, quantity: 2, rate: 100, tax_amount: 36 }],
      });
    expect(ret.status).toBe(201);
    const retId = ret.body.data.id;
    await request(app)
      .post(`/api/v1/purchase/returns/${retId}/approve`)
      .set('Authorization', mintBearer())
      .send({});

    // 3. THE FIX — post the return (was: 500)
    const postRet = await request(app)
      .post(`/api/v1/purchase/returns/${retId}/post`)
      .set('Authorization', mintBearer())
      .send({});
    expect(postRet.status).toBe(200);

    const retRow = await prisma.purchase_return.findUnique({ where: { id: retId } });
    expect(retRow?.status).toBe('posted');

    // real M10 debit-note voucher — balanced, ref PURCHASE_RETURN
    const led = await prisma.ledger.findMany({
      where: {
        company_id: TEST_COMPANY_ID,
        reference_type: 'PURCHASE_RETURN',
        reference_id: retId,
      },
    });
    expect(led.length).toBeGreaterThanOrEqual(2);
    const dr = led.reduce((s, l) => s + Number(l.debit_amount), 0);
    const cr = led.reduce((s, l) => s + Number(l.credit_amount), 0);
    expect(Math.round((dr - cr) * 100) / 100).toBe(0);
    expect(Math.round(dr * 100) / 100).toBe(236); // Dr Creditors = 200 + 36 tax

    // stock reduced by the returned qty
    const stockAfterReturn = await prisma.stock_master.aggregate({
      where: { company_id: TEST_COMPANY_ID, product_id: productId },
      _sum: { quantity: true },
    });
    expect(Number(stockAfterReturn._sum.quantity ?? 0)).toBe(3);
  });
});
