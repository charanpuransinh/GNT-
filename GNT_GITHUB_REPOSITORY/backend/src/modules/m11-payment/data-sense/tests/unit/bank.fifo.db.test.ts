import { prisma } from '@/common/config/prisma';
import { partyService } from '@/modules/m05-party-management';
// Data Sense — बैंक receipt → M11: साफ़ हो तो FIFO auto, वरना on-hold list
// (owner फ़ैसला #3 Option B + 2026-09-09 on-hold spec)। END-TO-END live-DB।
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { dataSenseService } from '../../services/dataSense.service';
import { listOpenHolds, resolveHold } from '../../services/paymentHold.service';

const COMPANY_ID = '00000000-0000-4000-8000-0000000000f1';
const USER_ID = '00000000-0000-4000-8000-000000000002';
const PARTY_NAME = 'FIFO Buyer Ltd';

async function wipe() {
  await prisma.dataSensePaymentHold.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.paymentAllocation.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.paymentLedgerEntry.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.paymentTransaction.deleteMany({ where: { tenantId: COMPANY_ID } });
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
  extra: Record<string, unknown> = {},
  date = '2026-03-01',
  particulars = PARTY_NAME
) => ({
  sheetName: 'bank.csv',
  headers: ['Date', 'Particulars', 'Credit', 'Narration', 'Flag'],
  rows: [{ Date: date, Particulars: particulars, Credit: credit, Narration: 'x', ...extra }],
});

const fifo = (sheet: ReturnType<typeof bankRow>) =>
  dataSenseService.transfer(COMPANY_ID, sheet, { bankReconciliation: 'fifo-invoice-settlement' });

describe.runIf(process.env.TEST_DB === '1')(
  'Data Sense — bank receipt → FIFO / on-hold (M11)',
  () => {
    let customerId = '';

    beforeAll(async () => {
      await wipe();
      await prisma.company_master.upsert({
        where: { id: COMPANY_ID },
        update: { name: 'FIFO Co' },
        create: { id: COMPANY_ID, name: 'FIFO Co', code: 'FIFOCO' },
      });
    });
    afterAll(wipe);

    beforeEach(async () => {
      await prisma.dataSensePaymentHold.deleteMany({ where: { tenantId: COMPANY_ID } });
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

    const txnCount = () => prisma.paymentTransaction.count({ where: { tenantId: COMPANY_ID } });

    it('साफ़ receipt अपने-आप FIFO: पुराना पूरा, नया आंशिक; पूरा receipt txn में', async () => {
      await makeInvoice(customerId, 'FIFO-OLD', '2026-01-05', 1000);
      await makeInvoice(customerId, 'FIFO-NEW', '2026-02-05', 2000);

      const result = await fifo(bankRow('1500'));
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
      expect(Number(txn?.amount)).toBe(1500);
      expect(txn?.allocations).toHaveLength(2);
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

    it('receipt बिल से ज़्यादा → बाक़ी advance allocation, पूरा receipt record', async () => {
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

    it('कोई बकाया approved बिल नहीं → on-hold (NO_OPEN_INVOICE), invoice/txn अछूता', async () => {
      await makeInvoice(customerId, 'DRAFT-1', '2026-01-05', 500, 'draft');
      const result = await fifo(bankRow('500'));
      expect(result.transferred?.rows[0].status).toBe('on-hold');
      expect(await txnCount()).toBe(0);
      const inv = await prisma.salesInvoice.findFirst({
        where: { companyId: COMPANY_ID, invoiceNumber: 'DRAFT-1' },
      });
      expect(Number(inv?.amountPaid)).toBe(0);
      const hold = await prisma.dataSensePaymentHold.findFirst({ where: { tenantId: COMPANY_ID } });
      expect(hold?.reason).toBe('NO_OPEN_INVOICE');
      expect(hold?.status).toBe('OPEN');
    });

    it('customer नाम से नहीं मिला → on-hold (CUSTOMER_NOT_FOUND), कोई party/txn नहीं बनी', async () => {
      const beforeParties = await prisma.party_master.count({ where: { company_id: COMPANY_ID } });
      const result = await fifo(bankRow('500', {}, '2026-03-01', 'Totally Unknown Payer'));
      expect(result.transferred?.rows[0].status).toBe('on-hold');
      expect(await prisma.party_master.count({ where: { company_id: COMPANY_ID } })).toBe(
        beforeParties
      );
      expect(await txnCount()).toBe(0);
      const hold = await prisma.dataSensePaymentHold.findFirst({ where: { tenantId: COMPANY_ID } });
      expect(hold?.reason).toBe('CUSTOMER_NOT_FOUND');
    });

    it('एक ही नाम के दो customer → on-hold (AMBIGUOUS_PARTY), पैसा किसी पर नहीं लगा', async () => {
      await partyService.createParty(
        COMPANY_ID,
        { party_type: 'customer', name: PARTY_NAME, opening_balance: 0, opening_type: 'dr' },
        USER_ID
      );
      await makeInvoice(customerId, 'DUP-1', '2026-01-05', 500);
      const result = await fifo(bankRow('500'));
      expect(result.transferred?.rows[0].status).toBe('on-hold');
      expect(await txnCount()).toBe(0);
      const hold = await prisma.dataSensePaymentHold.findFirst({ where: { tenantId: COMPANY_ID } });
      expect(hold?.reason).toBe('AMBIGUOUS_PARTY');
    });

    it('Flag में "disputed" → on-hold (DISPUTED), auto-apply नहीं', async () => {
      await makeInvoice(customerId, 'DISP-1', '2026-01-05', 500);
      const result = await fifo(bankRow('500', { Flag: 'disputed' }));
      expect(result.transferred?.rows[0].status).toBe('on-hold');
      expect(await txnCount()).toBe(0);
      expect(
        (await prisma.dataSensePaymentHold.findFirst({ where: { tenantId: COMPANY_ID } }))?.reason
      ).toBe('DISPUTED');
    });

    it('दिन-पहले (dd/mm/yyyy) तारीख़ सही; अमान्य (31/02) → file blocked', async () => {
      await makeInvoice(customerId, 'DMY-1', '2026-01-05', 500);
      await fifo(bankRow('500', {}, '02/03/2026'));
      const txn = await prisma.paymentTransaction.findFirst({ where: { tenantId: COMPANY_ID } });
      expect(txn?.transactionDate.toISOString().slice(0, 10)).toBe('2026-03-02');

      const bad = await fifo(bankRow('500', {}, '31/02/2026'));
      expect(bad.blocked).toBe(true);
      expect(bad.transferred).toBeNull();
    });

    it('वही receipt दोबारा → skip (idempotent), सिर्फ़ एक txn', async () => {
      await makeInvoice(customerId, 'IDEM-1', '2026-01-05', 2000);
      const first = await fifo(bankRow('500', { Narration: 'same-ref' }));
      expect(first.transferred?.rows[0].status).toBe('created');
      const second = await fifo(bankRow('500', { Narration: 'same-ref' }));
      expect(second.transferred?.rows[0].status).toBe('skipped');
      expect(await txnCount()).toBe(1);
    });

    it('on-hold list — aging bucket + owner apply-fifo से settle, discard से बंद', async () => {
      await makeInvoice(customerId, 'RES-1', '2026-01-05', 900);

      // customer-not-found hold बनाओ
      await fifo(bankRow('600', {}, '2026-03-01', 'Unknown One'));
      // no-open-invoice hold (दूसरा customer, कोई बिल नहीं)
      await partyService.createParty(
        COMPANY_ID,
        { party_type: 'customer', name: 'Bill-less Cust', opening_balance: 0, opening_type: 'dr' },
        USER_ID
      );
      await fifo(bankRow('300', {}, '2026-02-01', 'Bill-less Cust'));

      const list = await listOpenHolds(COMPANY_ID);
      expect(list.total).toBe(2);
      expect(list.totalAmount).toBe(900);
      expect(Object.keys(list.byBucket).length).toBeGreaterThan(0);

      const unknownHold = list.items.find((h) => h.reason === 'CUSTOMER_NOT_FOUND');
      const billless = list.items.find((h) => h.reason === 'NO_OPEN_INVOICE');
      if (!unknownHold || !billless) throw new Error('expected both holds');

      // owner: unknown wala hold असल में हमारे known customer का था → apply-fifo with customerId
      const resolved = await resolveHold(COMPANY_ID, USER_ID, unknownHold.id, {
        action: 'apply-fifo',
        customerId,
      });
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedTxnId).toBeTruthy();
      const inv = await prisma.salesInvoice.findFirst({
        where: { companyId: COMPANY_ID, invoiceNumber: 'RES-1' },
      });
      expect(Number(inv?.amountPaid)).toBe(600);

      // billless wala → discard
      const discarded = await resolveHold(COMPANY_ID, USER_ID, billless.id, { action: 'discard' });
      expect(discarded.status).toBe('DISCARDED');

      expect((await listOpenHolds(COMPANY_ID)).total).toBe(0);
    });

    it('opening-balance dues जिनके सामने receipt नहीं आई — हमेशा unpaid (Open) रहते हैं', async () => {
      await makeInvoice(customerId, 'OPEN-1', '2025-06-01', 5000, 'posted');
      // कोई receipt नहीं — कोई transfer नहीं
      const inv = await prisma.salesInvoice.findFirst({
        where: { companyId: COMPANY_ID, invoiceNumber: 'OPEN-1' },
      });
      expect(inv?.paymentStatus).toBe('unpaid');
      expect(Number(inv?.amountPaid)).toBe(0);
    });
  }
);
