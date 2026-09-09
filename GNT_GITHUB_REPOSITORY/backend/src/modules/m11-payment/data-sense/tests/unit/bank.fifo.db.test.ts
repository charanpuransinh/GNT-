import { prisma } from '@/common/config/prisma';
import { partyService } from '@/modules/m05-party-management';
// Data Sense — बैंक receipt → M11 FIFO invoice settlement (owner फ़ैसला #3, Option B)
// अलग module M21 था; अब M11 के अंदर। यह END-TO-END live-DB टेस्ट है।
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { dataSenseService } from '../../services/dataSense.service';

const COMPANY_ID = '00000000-0000-4000-8000-0000000000f1';
const USER_ID = '00000000-0000-4000-8000-000000000002';
const PARTY_NAME = 'FIFO Buyer Ltd';

async function cleanup() {
  await prisma.paymentAllocation.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.paymentLedgerEntry.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.paymentTransaction.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.paymentMethod.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.salesInvoiceItem.deleteMany({ where: { salesInvoice: { companyId: COMPANY_ID } } });
  await prisma.salesInvoice.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.party_master.deleteMany({ where: { company_id: COMPANY_ID } });
}

async function makeInvoice(
  customerId: string,
  invoiceNumber: string,
  isoDate: string,
  total: number,
  status: 'draft' | 'approved' | 'posted' = 'approved'
) {
  await prisma.salesInvoice.create({
    data: {
      companyId: COMPANY_ID,
      branchId: COMPANY_ID,
      customerId,
      invoiceNumber,
      invoiceDate: new Date(isoDate),
      dueDate: new Date(isoDate),
      status,
      totalAmount: total,
      totalTax: 0,
      totalDiscount: 0,
      netAmount: total,
      roundOff: 0,
      grandTotal: total,
      amountPaid: 0,
      paymentStatus: 'unpaid',
    },
  });
}

const bankRow = (
  credit: string,
  date = '2026-03-01',
  particulars = PARTY_NAME,
  narration = 'x'
) => ({
  sheetName: 'bank.csv',
  headers: ['Date', 'Particulars', 'Credit', 'Narration'],
  rows: [{ Date: date, Particulars: particulars, Credit: credit, Narration: narration }],
});

const fifo = (sheet: ReturnType<typeof bankRow>) =>
  dataSenseService.transfer(COMPANY_ID, sheet, { bankReconciliation: 'fifo-invoice-settlement' });

describe.runIf(process.env.TEST_DB === '1')(
  'Data Sense — bank receipt FIFO settlement (M11)',
  () => {
    let customerId = '';

    beforeAll(async () => {
      await cleanup();
      await prisma.company_master.upsert({
        where: { id: COMPANY_ID },
        update: { name: 'FIFO Co' },
        create: { id: COMPANY_ID, name: 'FIFO Co', code: 'FIFOCO' },
      });
    });
    afterAll(cleanup);

    beforeEach(async () => {
      await prisma.paymentAllocation.deleteMany({ where: { tenantId: COMPANY_ID } });
      await prisma.paymentLedgerEntry.deleteMany({ where: { tenantId: COMPANY_ID } });
      await prisma.paymentTransaction.deleteMany({ where: { tenantId: COMPANY_ID } });
      await prisma.salesInvoice.deleteMany({ where: { companyId: COMPANY_ID } });
      await prisma.party_master.deleteMany({ where: { company_id: COMPANY_ID } });
      const c = await partyService.createParty(
        COMPANY_ID,
        { party_type: 'customer', name: PARTY_NAME, opening_balance: 0, opening_type: 'dr' },
        USER_ID
      );
      customerId = c.id;
    });

    it('₹1500 receipt पुराने बिल को पूरा, नए को आंशिक चुकता; पूरा receipt txn में', async () => {
      await makeInvoice(customerId, 'FIFO-OLD', '2026-01-05', 1000);
      await makeInvoice(customerId, 'FIFO-NEW', '2026-02-05', 2000);

      const result = await fifo(bankRow('1500'));
      expect(result.transferred?.rows[0].targetModule).toBe('m11-payment');
      expect(result.transferred?.rows[0].operation).toBe('settle-invoices-fifo');
      expect(result.transferred?.rows[0].status).toBe('created');

      const oldInv = await prisma.salesInvoice.findFirst({
        where: { companyId: COMPANY_ID, invoiceNumber: 'FIFO-OLD' },
      });
      const newInv = await prisma.salesInvoice.findFirst({
        where: { companyId: COMPANY_ID, invoiceNumber: 'FIFO-NEW' },
      });
      expect(Number(oldInv?.amountPaid)).toBe(1000);
      expect(oldInv?.paymentStatus).toBe('paid');
      expect(Number(newInv?.amountPaid)).toBe(500);
      expect(newInv?.paymentStatus).toBe('partial');

      const txn = await prisma.paymentTransaction.findFirst({
        where: { tenantId: COMPANY_ID },
        include: { allocations: true },
      });
      expect(txn?.direction).toBe('IN');
      expect(Number(txn?.amount)).toBe(1500);
      expect(txn?.allocations).toHaveLength(2);
      // balanced M11 audit ledger
      const led = await prisma.paymentLedgerEntry.findMany({ where: { tenantId: COMPANY_ID } });
      const dr = led
        .filter((l) => l.entryType === 'DEBIT')
        .reduce((s, l) => s + Number(l.amount), 0);
      const cr = led
        .filter((l) => l.entryType === 'CREDIT')
        .reduce((s, l) => s + Number(l.amount), 0);
      expect(dr).toBe(1500);
      expect(cr).toBe(1500);
    });

    it('receipt बिल से ज़्यादा → बाक़ी advance allocation में, पूरा receipt record', async () => {
      await makeInvoice(customerId, 'ADV-1', '2026-01-05', 400);

      const result = await fifo(bankRow('1000'));
      expect(result.transferred?.rows[0].status).toBe('created');

      const txn = await prisma.paymentTransaction.findFirst({
        where: { tenantId: COMPANY_ID },
        include: { allocations: true },
      });
      expect(Number(txn?.amount)).toBe(1000);
      const sum = (txn?.allocations ?? []).reduce((s, a) => s + Number(a.allocatedAmount), 0);
      expect(sum).toBe(1000);
      expect(
        txn?.allocations.some(
          (a) => a.targetType === 'ACCOUNT' && Number(a.allocatedAmount) === 600
        )
      ).toBe(true);
    });

    it('draft invoice चुकता नहीं होती', async () => {
      await makeInvoice(customerId, 'DRAFT-1', '2026-01-05', 500, 'draft');
      const result = await fifo(bankRow('500'));
      expect(result.transferred?.rows[0].status).toBe('skipped');
      const inv = await prisma.salesInvoice.findFirst({
        where: { companyId: COMPANY_ID, invoiceNumber: 'DRAFT-1' },
      });
      expect(Number(inv?.amountPaid)).toBe(0);
      expect(await prisma.paymentTransaction.count({ where: { tenantId: COMPANY_ID } })).toBe(0);
    });

    it('नाम का customer न मिले → suspense, कोई नई party नहीं बनती', async () => {
      const before = await prisma.party_master.count({ where: { company_id: COMPANY_ID } });
      const result = await fifo(bankRow('500', '2026-03-01', 'Totally Unknown Payer'));
      expect(result.transferred?.rows[0].status).toBe('skipped');
      expect(await prisma.party_master.count({ where: { company_id: COMPANY_ID } })).toBe(before);
      expect(await prisma.paymentTransaction.count({ where: { tenantId: COMPANY_ID } })).toBe(0);
    });

    it('एक ही नाम के दो customer → suspense (गलत party पर पैसा नहीं)', async () => {
      await partyService.createParty(
        COMPANY_ID,
        { party_type: 'customer', name: PARTY_NAME, opening_balance: 0, opening_type: 'dr' },
        USER_ID
      );
      await makeInvoice(customerId, 'DUP-1', '2026-01-05', 500);
      const result = await fifo(bankRow('500'));
      expect(result.transferred?.rows[0].status).toBe('skipped');
      expect(await prisma.paymentTransaction.count({ where: { tenantId: COMPANY_ID } })).toBe(0);
    });

    it('दिन-पहले (dd/mm/yyyy) तारीख़ सही पढ़ी जाती है', async () => {
      await makeInvoice(customerId, 'DMY-1', '2026-01-05', 500);
      await fifo(bankRow('500', '02/03/2026')); // 2 March, महीना 03
      const txn = await prisma.paymentTransaction.findFirst({ where: { tenantId: COMPANY_ID } });
      expect(txn?.transactionDate.toISOString().slice(0, 10)).toBe('2026-03-02');
    });

    it('अमान्य तारीख़ (31/02) → validate RED, file blocked, कुछ नहीं लिखा जाता', async () => {
      await makeInvoice(customerId, 'BADDATE-1', '2026-01-05', 500);
      const result = await fifo(bankRow('500', '31/02/2026'));
      expect(result.blocked).toBe(true);
      expect(result.transferred).toBeNull();
      expect(await prisma.paymentTransaction.count({ where: { tenantId: COMPANY_ID } })).toBe(0);
    });

    it('वही receipt दोबारा import → skip (idempotent), सिर्फ़ एक txn', async () => {
      await makeInvoice(customerId, 'IDEM-1', '2026-01-05', 2000);
      const first = await fifo(bankRow('500', '2026-03-01', PARTY_NAME, 'same-ref'));
      expect(first.transferred?.rows[0].status).toBe('created');
      const second = await fifo(bankRow('500', '2026-03-01', PARTY_NAME, 'same-ref'));
      expect(second.transferred?.rows[0].status).toBe('skipped');
      expect(await prisma.paymentTransaction.count({ where: { tenantId: COMPANY_ID } })).toBe(1);
    });
  }
);
