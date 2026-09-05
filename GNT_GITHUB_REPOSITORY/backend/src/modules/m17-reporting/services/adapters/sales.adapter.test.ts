// M17 — Sales adapter END-TO-END: असली sales_invoice data report me aata hai (fake empty nahi)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { SalesAdapter } from './sales.adapter';

const COMPANY_ID = '00000000-0000-4000-8000-000000000050';

async function cleanup() {
  await prisma.salesInvoiceItem.deleteMany({ where: { salesInvoice: { companyId: COMPANY_ID } } });
  await prisma.salesInvoice.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.party_master.deleteMany({ where: { company_id: COMPANY_ID } });
}

describe.runIf(process.env.TEST_DB === '1')('M17 sales adapter — live DB', () => {
  beforeAll(async () => {
    await cleanup();
    await prisma.company_master.upsert({ where: { id: COMPANY_ID }, update: { name: 'Rpt Co' }, create: { id: COMPANY_ID, name: 'Rpt Co', code: 'RPTCO' } });
    const customer = await prisma.party_master.create({
      data: { company_id: COMPANY_ID, party_type: 'customer', name: 'Report Customer' },
    });
    const inv = await prisma.salesInvoice.create({
      data: {
        companyId: COMPANY_ID, branchId: COMPANY_ID, customerId: customer.id,
        invoiceNumber: `RPT-${Date.now()}`, invoiceDate: new Date('2026-01-05'), dueDate: new Date('2026-01-20'),
        totalAmount: 1000, totalTax: 180, totalDiscount: 0, netAmount: 1000,
        roundOff: 0, grandTotal: 1180,
      },
    });
    await prisma.salesInvoiceItem.create({
      data: {
        salesInvoiceId: inv.id, productId: 'prod-1', quantity: 2, rate: 500,
        discountPercent: 0, discountAmount: 0, amount: 1000, taxRate: 18, taxAmount: 180, netAmount: 1000,
      },
    });
  });
  afterAll(cleanup);

  it('sales register me असली invoice + party naam aata hai', async () => {
    const adapter = new SalesAdapter();
    const report = await adapter.getSalesRegister({ companyId: COMPANY_ID });

    expect(report.summary.totalInvoices).toBe(1);
    expect(report.summary.totalRevenue).toBe(1180);
    expect(report.rows.length).toBe(1);
    expect(report.rows[0].customerName).toBe('Report Customer');
    expect(report.rows[0].quantity).toBe(2);
    expect(report.rows[0].totalTax).toBe(180);
  });
});
