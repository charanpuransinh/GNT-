// M17 — Accounting adapter END-TO-END: trial balance + receivables aging असली data se
// (pehle dono खाली [] return karte the — TODO #016)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { AccountingAdapter } from './accounting.adapter';

const COMPANY_ID = '00000000-0000-4000-8000-000000000051';

async function cleanup() {
  await prisma.salesInvoice.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.party_master.deleteMany({ where: { company_id: COMPANY_ID } });
  await prisma.ledger.deleteMany({ where: { company_id: COMPANY_ID } });
}

describe.runIf(process.env.TEST_DB === '1')('M17 accounting adapter — live DB', () => {
  beforeAll(async () => {
    await cleanup();
    await prisma.company_master.upsert({
      where: { id: COMPANY_ID },
      update: { name: 'Acct Rpt Co' },
      create: { id: COMPANY_ID, name: 'Acct Rpt Co', code: 'ACCRPT' },
    });

    // trial balance data: 2 accounts
    await prisma.ledger.createMany({
      data: [
        { company_id: COMPANY_ID, account_id: 'CASH', transaction_date: new Date('2026-01-10'), debit_amount: 1500, credit_amount: 0 },
        { company_id: COMPANY_ID, account_id: 'SALES', transaction_date: new Date('2026-01-10'), debit_amount: 0, credit_amount: 1500 },
      ],
    });

    // aging data: 1 customer, 2 unpaid invoices (alag age buckets)
    const customer = await prisma.party_master.create({
      data: { company_id: COMPANY_ID, party_type: 'customer', name: 'Aging Customer' },
    });
    const now = Date.now();
    await prisma.salesInvoice.createMany({
      data: [
        {
          companyId: COMPANY_ID, branchId: COMPANY_ID, customerId: customer.id,
          invoiceNumber: `AG-1-${now}`, invoiceDate: new Date(now - 5 * 86400000), dueDate: new Date(now - 5 * 86400000),
          totalAmount: 3000, totalTax: 0, totalDiscount: 0, netAmount: 3000, roundOff: 0, grandTotal: 3000,
          paymentStatus: 'unpaid', amountPaid: 0,
        },
        {
          companyId: COMPANY_ID, branchId: COMPANY_ID, customerId: customer.id,
          invoiceNumber: `AG-2-${now}`, invoiceDate: new Date(now - 45 * 86400000), dueDate: new Date(now - 45 * 86400000),
          totalAmount: 2000, totalTax: 0, totalDiscount: 0, netAmount: 2000, roundOff: 0, grandTotal: 2000,
          paymentStatus: 'partial', amountPaid: 0,
        },
      ],
    });
  });

  afterAll(cleanup);

  it('trial balance account-wise debit/credit जोड़कर देता है', async () => {
    const adapter = new AccountingAdapter();
    const tb = await adapter.getTrialBalance({ companyId: COMPANY_ID });

    expect(tb.length).toBe(2);
    const cash = tb.find((r) => r.ledgerName === 'CASH');
    const sales = tb.find((r) => r.ledgerName === 'SALES');
    expect(cash?.debit).toBe(1500);
    expect(cash?.credit).toBe(0);
    expect(sales?.credit).toBe(1500);
    expect(sales?.debit).toBe(0);
  });

  it('aging report unpaid invoices ko age bucket me rakhta hai', async () => {
    const adapter = new AccountingAdapter();
    const aging = await adapter.getAgingReport({ companyId: COMPANY_ID });

    expect(aging.length).toBe(1);
    expect(aging[0].partyName).toBe('Aging Customer');
    expect(aging[0].totalOutstanding).toBe(5000);
    expect(aging[0].days0_30).toBe(3000);
    expect(aging[0].days31_60).toBe(2000);
    expect(aging[0].days61_90).toBe(0);
    expect(aging[0].days91_plus).toBe(0);
  });

  it('companyId na ho toh खाली (koi cross-tenant leak nahi)', async () => {
    const adapter = new AccountingAdapter();
    expect(await adapter.getTrialBalance({})).toEqual([]);
    expect(await adapter.getAgingReport({})).toEqual([]);
  });
});
