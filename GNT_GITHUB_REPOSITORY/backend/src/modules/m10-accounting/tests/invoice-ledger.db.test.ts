// ============================================================================
// M10 — InvoiceLedgerService — असली DB double-entry (मालिक P0, 2026-09-06)
//
// साबित करता है:
//   1. sales invoice post → M10 में असली voucher + balanced ledger (Dr Debtors /
//      Cr Sales Revenue / Cr GST Output), trial balance संतुलित
//   2. idempotent — दोबारा post safe (नई entry नहीं)
//   3. purchase invoice post → Dr Purchases / Dr GST Input / Cr Creditors
//   4. M08 का पूरा HTTP flow (create → approve → post) अब सच में चलता है
//      (पहले "M08 posting dependencies are not fully wired" पर throw करता था)
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { InvoiceLedgerService } from '../services/invoice-ledger.service';
import { LedgerService } from '../services/ledger.service';
import { LedgerRepository } from '../repositories/ledger.repository';
import { salesService } from '@/modules/m08-sales/services/sales.service';
import { TEST_COMPANY_ID, TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const svc = new InvoiceLedgerService(prisma);
const ledgerSvc = new LedgerService(new LedgerRepository(prisma), prisma);

async function ledgerSumForRef(refType: string, refId: string) {
  const rows = await prisma.ledger.findMany({ where: { company_id: TEST_COMPANY_ID, reference_type: refType, reference_id: refId } });
  const debit = rows.reduce((s, r) => s + Number(r.debit_amount), 0);
  const credit = rows.reduce((s, r) => s + Number(r.credit_amount), 0);
  return { rows, debit: Number(debit.toFixed(4)), credit: Number(credit.toFixed(4)) };
}

describe.runIf(process.env.TEST_DB === '1')('M10 InvoiceLedgerService — real DB double-entry', () => {
  const branchId = randomUUID();
  const salesInvoiceIds: string[] = [];
  const purchaseInvoiceIds: string[] = [];
  const customerId = randomUUID();
  const supplierId = randomUUID();

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
  });

  afterAll(async () => {
    for (const id of salesInvoiceIds) {
      await prisma.ledger.deleteMany({ where: { reference_id: id } });
      await prisma.voucher_item.deleteMany({ where: { voucher: { company_id: TEST_COMPANY_ID } } }).catch(() => {});
      await prisma.salesInvoiceItem.deleteMany({ where: { salesInvoiceId: id } });
      await prisma.salesInvoice.deleteMany({ where: { id } });
    }
    for (const id of purchaseInvoiceIds) {
      await prisma.ledger.deleteMany({ where: { reference_id: id } });
      await prisma.purchase_invoice.deleteMany({ where: { id } });
    }
    await prisma.voucher.deleteMany({ where: { company_id: TEST_COMPANY_ID, voucher_type: { in: ['sales', 'purchase'] } } });
  });

  it('sales invoice post → balanced Dr Debtors / Cr Sales / Cr GST Output', async () => {
    const inv = await salesService.createInvoice({
      companyId: TEST_COMPANY_ID,
      branchId,
      customerId,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 864e5),
      items: [{ productId: randomUUID(), quantity: 2, rate: 100, taxRate: 18, hsnCode: '8471' }],
    } as never);
    salesInvoiceIds.push(inv.id);
    await salesService.approveInvoice(inv.id, TEST_COMPANY_ID, TEST_USER_ID);

    const res = await svc.postSalesInvoice(TEST_COMPANY_ID, inv.id, TEST_USER_ID);
    expect(res.posted).toBe(true);

    const { rows, debit, credit } = await ledgerSumForRef('SALES_INVOICE', inv.id);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(debit).toBeCloseTo(credit, 2); // balanced
    expect(debit).toBeCloseTo(Number(inv.grandTotal), 2);

    // Dr side = Sundry Debtors (party account, party_id set)
    const drRow = rows.find((r) => Number(r.debit_amount) > 0);
    expect(drRow?.party_id).toBe(customerId);

    // voucher bana
    const voucher = await prisma.voucher.findFirst({ where: { id: (res as { voucherId: string }).voucherId } });
    expect(voucher?.voucher_type).toBe('sales');
    expect(voucher?.status).toBe('posted');
    expect(Number(voucher?.total_debit)).toBeCloseTo(Number(voucher?.total_credit), 2);
  });

  it('idempotent — दोबारा post करने पर नई entry नहीं', async () => {
    const invId = salesInvoiceIds[0];
    const before = (await ledgerSumForRef('SALES_INVOICE', invId)).rows.length;
    const res = await svc.postSalesInvoice(TEST_COMPANY_ID, invId, TEST_USER_ID);
    expect(res.posted).toBe(false);
    const after = (await ledgerSumForRef('SALES_INVOICE', invId)).rows.length;
    expect(after).toBe(before);
  });

  it('trial balance संतुलित रहता है (Dr कुल == Cr कुल)', async () => {
    const tb = await ledgerSvc.getTrialBalance(TEST_COMPANY_ID);
    const totalDr = tb.reduce((s: number, a: { debit: number }) => s + Number(a.debit), 0);
    const totalCr = tb.reduce((s: number, a: { credit: number }) => s + Number(a.credit), 0);
    expect(Number(totalDr.toFixed(2))).toBeCloseTo(Number(totalCr.toFixed(2)), 1);
  });

  it('purchase invoice post → Dr Purchases + Dr GST Input == Cr Creditors', async () => {
    const pi = await prisma.purchase_invoice.create({
      data: {
        company_id: TEST_COMPANY_ID,
        branch_id: branchId,
        supplier_id: supplierId,
        invoice_number: `PI-${Date.now()}`,
        invoice_date: new Date(),
        total_amount: 1000,
        total_tax: 180,
        total_discount: 0,
        net_amount: 1000,
        round_off: 0,
        grand_total: 1180,
        status: 'approved',
      },
    });
    purchaseInvoiceIds.push(pi.id);

    const res = await svc.postPurchaseInvoice(TEST_COMPANY_ID, pi.id, TEST_USER_ID);
    expect(res.posted).toBe(true);

    const { rows, debit, credit } = await ledgerSumForRef('PURCHASE_INVOICE', pi.id);
    expect(debit).toBeCloseTo(credit, 2);
    expect(credit).toBeCloseTo(1180, 2); // Cr Creditors = grand total
    const crRow = rows.find((r) => Number(r.credit_amount) > 0);
    expect(crRow?.party_id).toBe(supplierId);
  });

  it('M08 HTTP flow: create → approve → post अब सच में चलता है (200 + ledger)', async () => {
    const create = await request(app)
      .post('/api/v1/sales/invoices')
      .set('Authorization', mintBearer())
      .send({
        branchId,
        customerId,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 864e5).toISOString(),
        items: [{ productId: randomUUID(), quantity: 1, rate: 500, taxRate: 18 }],
      });
    expect(create.status).toBe(201);
    const invId = create.body.data.id;
    salesInvoiceIds.push(invId);

    await request(app).post(`/api/v1/sales/invoices/${invId}/approve`).set('Authorization', mintBearer()).send({});
    const post = await request(app).post(`/api/v1/sales/invoices/${invId}/post`).set('Authorization', mintBearer()).send({});
    expect(post.status).toBe(200);
    expect(post.body.data.status).toBe('posted');

    const { debit, credit, rows } = await ledgerSumForRef('SALES_INVOICE', invId);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(debit).toBeCloseTo(credit, 2);
  });
});
