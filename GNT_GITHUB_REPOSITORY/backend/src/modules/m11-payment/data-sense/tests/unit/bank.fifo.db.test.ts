import { prisma } from '@/common/config/prisma';
import { partyService } from '@/modules/m05-party-management';
// Data Sense — बैंक receipt → M11 FIFO invoice settlement (owner फ़ैसला #3, Option B)
// अलग module M21 था; अब M11 के अंदर। यह END-TO-END live-DB टेस्ट है।
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { dataSenseService } from '../../services/dataSense.service';

const COMPANY_ID = '00000000-0000-4000-8000-0000000000f1';
const USER_ID = '00000000-0000-4000-8000-000000000002';
const PARTY_NAME = 'FIFO Buyer Ltd';

async function cleanup() {
  await prisma.paymentAllocation.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.paymentTransaction.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.paymentMethod.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.salesInvoiceItem.deleteMany({ where: { salesInvoice: { companyId: COMPANY_ID } } });
  await prisma.salesInvoice.deleteMany({ where: { companyId: COMPANY_ID } });
  await prisma.party_master.deleteMany({ where: { company_id: COMPANY_ID } });
}

describe.runIf(process.env.TEST_DB === '1')(
  'Data Sense — bank receipt FIFO settlement (M11)',
  () => {
    let partyId = '';

    beforeAll(async () => {
      await cleanup();
      await prisma.company_master.upsert({
        where: { id: COMPANY_ID },
        update: { name: 'FIFO Co' },
        create: { id: COMPANY_ID, name: 'FIFO Co', code: 'FIFOCO' },
      });
      const party = await partyService.createParty(
        COMPANY_ID,
        { party_type: 'customer', name: PARTY_NAME, opening_balance: 0, opening_type: 'dr' },
        USER_ID
      );
      partyId = party.id;

      // दो बकाया बिल — पुराना ₹1000, नया ₹2000
      for (const [num, date, total] of [
        ['FIFO-OLD', '2026-01-05', 1000],
        ['FIFO-NEW', '2026-02-05', 2000],
      ] as const) {
        await prisma.salesInvoice.create({
          data: {
            companyId: COMPANY_ID,
            branchId: COMPANY_ID,
            customerId: partyId,
            invoiceNumber: num,
            invoiceDate: new Date(date),
            dueDate: new Date(date),
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
    });

    afterAll(cleanup);

    it('₹1500 receipt पुराने बिल को पूरा, नए को आंशिक चुकता करती है', async () => {
      const sheet = {
        sheetName: 'bank.csv',
        headers: ['Date', 'Particulars', 'Credit', 'Narration'],
        rows: [
          { Date: '2026-03-01', Particulars: PARTY_NAME, Credit: '1500', Narration: 'NEFT recd' },
        ],
      };

      const result = await dataSenseService.transfer(COMPANY_ID, sheet, {
        bankReconciliation: 'fifo-invoice-settlement',
      });

      expect(result.sense.group).toBe('accounting');
      expect(result.transferred).not.toBeNull();
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
    });

    it('बकाया बिल न हो तो receipt skip होती है (suspense)', async () => {
      await prisma.salesInvoice.updateMany({
        where: { companyId: COMPANY_ID },
        data: { amountPaid: 0, paymentStatus: 'paid' },
      });
      const sheet = {
        sheetName: 'bank2.csv',
        headers: ['Date', 'Particulars', 'Credit'],
        rows: [{ Date: '2026-03-02', Particulars: PARTY_NAME, Credit: '900' }],
      };
      const result = await dataSenseService.transfer(COMPANY_ID, sheet, {
        bankReconciliation: 'fifo-invoice-settlement',
      });
      expect(result.transferred?.rows[0].status).toBe('skipped');
    });
  }
);
