import { prisma } from '@/common/config/prisma';
import { partyService } from '@/modules/m05-party-management';
// M08 — the three endpoints that used to always 500 (injectDependencies never
// called): /invoices/:id/print, /invoices/:id/share, /returns/:id/post.
// Now wired to real M04/M05/M16/M06/M10. Live-DB, effect assertions.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { returnService } from '../services/return.service';
import { salesService } from '../services/sales.service';

const CO = '00000000-0000-4000-8000-0000000008a1';
const USER = '00000000-0000-4000-8000-000000000002';

async function wipe() {
  await prisma.ledger.deleteMany({ where: { company_id: CO } });
  await prisma.voucher.deleteMany({ where: { company_id: CO } });
  await prisma.salesReturnItem.deleteMany({ where: { salesReturn: { companyId: CO } } });
  await prisma.salesReturn.deleteMany({ where: { companyId: CO } });
  await prisma.salesInvoiceItem.deleteMany({ where: { salesInvoice: { companyId: CO } } });
  await prisma.salesInvoice.deleteMany({ where: { companyId: CO } });
  await prisma.stock_movement.deleteMany({ where: { company_id: CO } });
  await prisma.stock_master.deleteMany({ where: { company_id: CO } });
  await prisma.product_master.deleteMany({ where: { company_id: CO } });
  await prisma.party_master.deleteMany({ where: { company_id: CO } });
  await prisma.notificationMaster?.deleteMany({ where: { companyId: CO } }).catch(() => {});
}

describe.runIf(process.env.TEST_DB === '1')('M08 print / share / return-post — live DB', () => {
  let customerId = '';
  let productId = '';
  let invoiceId = '';

  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: CO },
      update: {},
      create: { id: CO, name: 'M08 Endpoints Co', code: 'M08EP-1' },
    });
    await wipe();

    const cust = await partyService.createParty(
      CO,
      {
        party_type: 'customer',
        name: 'Print Customer',
        state_code: '24',
        opening_balance: 0,
        opening_type: 'dr',
      },
      USER
    );
    customerId = cust.id;

    const prod = await prisma.product_master.create({
      data: { company_id: CO, name: 'Widget', code: 'WID-1', hsn_code: '8471', sale_price: 100 },
    });
    productId = prod.id;

    const inv = await salesService.createInvoice({
      companyId: CO,
      branchId: CO,
      customerId,
      invoiceDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-30'),
      items: [{ productId, quantity: 4, rate: 100, taxRate: 18, hsnCode: '8471' }],
    } as any);
    invoiceId = inv.id;
    await salesService.approveInvoice(invoiceId, CO, USER);
    await salesService.postInvoice(invoiceId, CO, USER);
  });

  afterAll(wipe);

  it('generatePrint returns real HTML with the invoice number (was: 500 "not wired")', async () => {
    const html = await salesService.generatePrint(invoiceId, CO, 'a4');
    expect(typeof html).toBe('string');
    const inv = await prisma.salesInvoice.findUnique({ where: { id: invoiceId } });
    expect(html).toContain(inv!.invoiceNumber);
    expect(html).toContain('Print Customer');
  });

  it('shareInvoice queues a real notification row (was: 500 "not wired")', async () => {
    const res = await salesService.shareInvoice(invoiceId, CO, 'email', 'buyer@example.com', USER);
    expect(res.success).toBe(true);
    const notif = await prisma.notificationMaster.findFirst({
      where: { companyId: CO, entityId: invoiceId, entityType: 'sales_invoice' },
    });
    expect(notif).toBeTruthy();
    expect(notif?.toAddress).toBe('buyer@example.com');
  });

  it('postReturn posts a real M10 credit-note voucher + adds stock back + status posted (was: 500)', async () => {
    const ret = await returnService.createReturn({
      companyId: CO,
      salesInvoiceId: invoiceId,
      customerId,
      returnNumber: `M08EP-RET-${Date.now()}`,
      returnDate: new Date('2026-09-05'),
      items: [{ productId, quantity: 1, rate: 100, taxRate: 18 }],
    } as any);
    await returnService.approveReturn(ret.id, CO);

    const stockBefore = await prisma.stock_master.aggregate({
      where: { company_id: CO, product_id: productId },
      _sum: { quantity: true },
    });

    const posted = await returnService.postReturn(ret.id, CO, USER);
    expect(posted.status).toBe('posted');

    // M10 credit-note voucher exists and is balanced
    const led = await prisma.ledger.findMany({
      where: { company_id: CO, reference_type: 'SALES_RETURN', reference_id: ret.id },
    });
    expect(led.length).toBeGreaterThanOrEqual(2);
    const dr = led.reduce((s, l) => s + Number(l.debit_amount), 0);
    const cr = led.reduce((s, l) => s + Number(l.credit_amount), 0);
    expect(Math.round((dr - cr) * 100) / 100).toBe(0);
    expect(Math.round(cr * 100) / 100).toBe(118); // 100 + 18% tax, credited to debtors

    // stock added back (+1)
    const stockAfter = await prisma.stock_master.aggregate({
      where: { company_id: CO, product_id: productId },
      _sum: { quantity: true },
    });
    expect(Number(stockAfter._sum.quantity ?? 0) - Number(stockBefore._sum.quantity ?? 0)).toBe(1);
  });

  it('postReturn is idempotent on the ledger (re-post does not double the voucher)', async () => {
    const ret = await prisma.salesReturn.findFirst({ where: { companyId: CO, status: 'posted' } });
    if (!ret) throw new Error('no posted return');
    // already posted -> re-running should not add more SALES_RETURN ledger rows
    const before = await prisma.ledger.count({
      where: { company_id: CO, reference_type: 'SALES_RETURN', reference_id: ret.id },
    });
    // status guard blocks re-post; call the ledger directly to prove idempotency
    const { InvoiceLedgerService } = await import('@/modules/m10-accounting');
    const svc = new InvoiceLedgerService(prisma);
    const r = await svc.postSalesReturn(CO, ret.id, USER);
    expect(r.posted).toBe(false);
    if (!r.posted) expect(r.reason).toBe('already posted to ledger');
    const after = await prisma.ledger.count({
      where: { company_id: CO, reference_type: 'SALES_RETURN', reference_id: ret.id },
    });
    expect(after).toBe(before);
  });
});
