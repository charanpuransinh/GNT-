// ============================================================================
// M10 VoucherService — मालिक का design, असली database पर
//
// मालिक पूरन सिंह का फ़ैसला (2026-09-05):
//   "M10 VoucherService: KEEP. हर payment(full/partial) = अलग voucher,
//    party ledger+bill से linked। Partial payments allowed."
//
// ⚠️ इस फ़ाइल ने पुरानी `unit/voucher.service.test.ts` की जगह ली है। वो 2 tests
// पूरे Prisma को mock करती थीं और service को कोई बुलाता तक नहीं था — यानी वे हरी
// होकर भी कुछ साबित नहीं करतीं। (यही बात मैंने मालिक को बताई थी, और उन्होंने
// service रखने का फ़ैसला दिया।) अब service सच में controller से जुड़ी है और ये
// tests असली DB पर असली बिल बनाकर उन पर भुगतान चढ़ाती हैं।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { VoucherService, VoucherServiceError } from '../../services/voucher.service';

const prisma = new PrismaClient();
const service = new VoucherService(prisma);

const COMPANY_ID = '00000000-0000-4000-8000-00000000b101';
const DUSRI_COMPANY_ID = '00000000-0000-4000-8000-00000000b102';
const BRANCH_ID = '00000000-0000-4000-8000-00000000b103';
const stamp = Date.now();

let grahakA = '';       // ग्राहक A
let grahakB = '';       // ग्राहक B
let bankAccount = '';
let partyAccount = '';
let billA = '';         // ग्राहक A का बिल — ₹10,000
let billB = '';         // ग्राहक B का बिल — ₹5,000

async function makeInvoice(companyId: string, customerId: string, total: number, n: number): Promise<string> {
  const inv = await prisma.salesInvoice.create({
    data: {
      companyId, branchId: BRANCH_ID, customerId,
      invoiceNumber: `INV-${stamp}-${n}`,
      invoiceDate: new Date('2026-01-10'), dueDate: new Date('2026-02-10'),
      totalAmount: total, totalTax: 0, totalDiscount: 0, netAmount: total,
      roundOff: 0, grandTotal: total,
    },
  });
  return inv.id;
}

describe.runIf(process.env.TEST_DB === '1')('M10 VoucherService — भुगतान और बकाया (असली DB)', () => {
  beforeAll(async () => {
    for (const [id, name, code] of [
      [COMPANY_ID, 'Voucher Test Co', `VCO${stamp}`],
      [DUSRI_COMPANY_ID, 'Dusri Voucher Co', `VOTHER${stamp}`],
    ] as const) {
      await prisma.company_master.upsert({ where: { id }, update: {}, create: { id, name, code } });
    }

    const gA = await prisma.party_master.create({
      data: { company_id: COMPANY_ID, party_type: 'customer', name: `ग्राहक-A-${stamp}` },
    });
    const gB = await prisma.party_master.create({
      data: { company_id: COMPANY_ID, party_type: 'customer', name: `ग्राहक-B-${stamp}` },
    });
    grahakA = gA.id; grahakB = gB.id;

    const bank = await prisma.account_master.create({
      data: { company_id: COMPANY_ID, name: 'बैंक', code: `BANK-${stamp}`, type: 'asset', is_bank_account: true },
    });
    const party = await prisma.account_master.create({
      data: { company_id: COMPANY_ID, name: 'Sundry Debtors', code: `SD-${stamp}`, type: 'asset' },
    });
    bankAccount = bank.id; partyAccount = party.id;

    billA = await makeInvoice(COMPANY_ID, grahakA, 10000, 1);
    billB = await makeInvoice(COMPANY_ID, grahakB, 5000, 2);
  }, 60_000);

  afterAll(async () => {
    const companies = [COMPANY_ID, DUSRI_COMPANY_ID];
    await prisma.voucher_allocation.deleteMany({ where: { company_id: { in: companies } } });
    await prisma.ledger.deleteMany({ where: { company_id: { in: companies } } });
    await prisma.voucher.deleteMany({ where: { company_id: { in: companies } } });
    await prisma.salesInvoice.deleteMany({ where: { companyId: { in: companies } } });
    await prisma.party_master.deleteMany({ where: { company_id: { in: companies } } });
    await prisma.account_master.deleteMany({ where: { company_id: { in: companies } } });
    await prisma.company_master.deleteMany({ where: { id: { in: companies } } });
    await prisma.$disconnect();
  });

  const receipt = (partyId: string, amount: number, allocations: Array<{ reference_id: string; allocated_amount: number }>) =>
    service.createPaymentVoucher({
      companyId: COMPANY_ID, partyId, voucherType: 'receipt',
      voucherDate: new Date('2026-01-20'),
      bankOrCashAccountId: bankAccount, partyAccountId: partyAccount,
      amount, branchId: BRANCH_ID,
      allocations: allocations.map((a) => ({ reference_type: 'SALES_INVOICE' as const, ...a })),
    });

  it('शुरुआत में बिल का पूरा ₹10,000 बकाया है', async () => {
    const hisab = await service.getBillOutstanding(COMPANY_ID, 'SALES_INVOICE', billA);
    expect(hisab.total).toBe(10000);
    expect(hisab.paid).toBe(0);
    expect(hisab.outstanding).toBe(10000);
    expect(hisab.is_cleared).toBe(false);
  });

  it('पहला आधा भुगतान ₹4,000 — अलग voucher बनती है, बकाया ₹6,000 रहता है', async () => {
    const voucher: any = await receipt(grahakA, 4000, [{ reference_id: billA, allocated_amount: 4000 }]);
    expect(voucher.id).toBeTruthy();
    expect(voucher.voucher_type).toBe('receipt');

    const hisab = await service.getBillOutstanding(COMPANY_ID, 'SALES_INVOICE', billA);
    expect(hisab.paid).toBe(4000);
    expect(hisab.outstanding).toBe(6000);
    expect(hisab.is_cleared).toBe(false);

    // बिल पर भी हालत "partial" चढ़ी
    const bill = await prisma.salesInvoice.findUnique({ where: { id: billA } });
    expect(Number(bill?.amountPaid)).toBe(4000);
    expect(bill?.paymentStatus).toBe('partial');
  });

  it('दूसरा भुगतान ₹3,000 — दूसरी अलग voucher, एक ही बिल पर दो vouchers', async () => {
    await receipt(grahakA, 3000, [{ reference_id: billA, allocated_amount: 3000 }]);

    const hisab = await service.getBillOutstanding(COMPANY_ID, 'SALES_INVOICE', billA);
    expect(hisab.paid).toBe(7000);
    expect(hisab.outstanding).toBe(3000);

    const allocations = await prisma.voucher_allocation.findMany({
      where: { company_id: COMPANY_ID, reference_id: billA },
    });
    expect(allocations.length).toBe(2);   // मालिक की शर्त: कई vouchers, एक बिल
  });

  it('आख़िरी ₹3,000 — बिल पूरा clear, हालत "paid"', async () => {
    await receipt(grahakA, 3000, [{ reference_id: billA, allocated_amount: 3000 }]);

    const hisab = await service.getBillOutstanding(COMPANY_ID, 'SALES_INVOICE', billA);
    expect(hisab.paid).toBe(10000);
    expect(hisab.outstanding).toBe(0);
    expect(hisab.is_cleared).toBe(true);

    const bill = await prisma.salesInvoice.findUnique({ where: { id: billA } });
    expect(bill?.paymentStatus).toBe('paid');
  });

  it('🔒 बकाया से ज़्यादा नहीं चढ़ सकता', async () => {
    await expect(receipt(grahakA, 500, [{ reference_id: billA, allocated_amount: 500 }]))
      .rejects.toThrow(/बकाया/);
  });

  // ── मालिक का हार्ड रूल यहीं सबसे ज़रूरी है ──────────────────────────────
  it('🔒 party A का भुगतान party B के बिल पर कभी नहीं चढ़ सकता', async () => {
    await expect(receipt(grahakA, 1000, [{ reference_id: billB, allocated_amount: 1000 }]))
      .rejects.toThrow(/इस party का नहीं/);

    // और B का बिल छुआ तक नहीं गया
    const hisabB = await service.getBillOutstanding(COMPANY_ID, 'SALES_INVOICE', billB);
    expect(hisabB.paid).toBe(0);
    expect(hisabB.outstanding).toBe(5000);
  });

  it('🔒 एक party का बकाया दूसरी party से बिल्कुल अछूता', async () => {
    const bakayaA = await service.getPartyOutstanding(COMPANY_ID, grahakA);
    const bakayaB = await service.getPartyOutstanding(COMPANY_ID, grahakB);

    expect(bakayaA.total_outstanding).toBe(0);        // A का बिल पूरा चुका
    expect(bakayaB.total_outstanding).toBe(5000);     // B का ज्यों का त्यों
    expect(bakayaA.bills.every((b) => b.reference_id !== billB)).toBe(true);
    expect(bakayaB.bills.every((b) => b.reference_id !== billA)).toBe(true);
  });

  it('हर भुगतान party के ledger में उसी party के नाम चढ़ता है', async () => {
    const rows = await prisma.ledger.findMany({
      where: { company_id: COMPANY_ID, party_id: grahakA },
    });
    expect(rows.length).toBe(3);                      // तीन भुगतान = तीन पंक्तियाँ
    expect(rows.every((r) => r.party_id === grahakA)).toBe(true);
    expect(rows.every((r) => r.voucher_id !== null)).toBe(true);   // हर एक अपनी voucher से जुड़ी
  });

  it('voucher रद्द होते ही उसका पैसा बकाया गिनती से बाहर', async () => {
    const billC = await makeInvoice(COMPANY_ID, grahakB, 2000, 3);
    const voucher: any = await receipt(grahakB, 2000, [{ reference_id: billC, allocated_amount: 2000 }]);

    let hisab = await service.getBillOutstanding(COMPANY_ID, 'SALES_INVOICE', billC);
    expect(hisab.outstanding).toBe(0);

    await service.cancelVoucher(COMPANY_ID, voucher.id);

    hisab = await service.getBillOutstanding(COMPANY_ID, 'SALES_INVOICE', billC);
    expect(hisab.paid).toBe(0);
    expect(hisab.outstanding).toBe(2000);   // रद्द voucher का पैसा नहीं गिना गया
  });

  it('🔒 दूसरी company की voucher न पढ़ी जा सके, न रद्द हो', async () => {
    const voucher: any = await receipt(grahakB, 1000, [{ reference_id: billB, allocated_amount: 1000 }]);
    const mila = await service.getVoucherById(DUSRI_COMPANY_ID, voucher.id);
    expect(mila).toBeNull();
    await expect(service.cancelVoucher(DUSRI_COMPANY_ID, voucher.id)).rejects.toThrow(/नहीं मिली/);
  });

  it('🔒 बिलों में बाँटी रकम कुल रकम से मेल न खाए तो मना', async () => {
    await expect(receipt(grahakB, 1000, [{ reference_id: billB, allocated_amount: 600 }]))
      .rejects.toThrow(/मेल नहीं खाती/);
  });

  it('🔒 बिना बिल चुने भुगतान नहीं — हर voucher किसी बिल से जुड़ेगा (मालिक की शर्त)', async () => {
    await expect(receipt(grahakB, 100, [])).rejects.toThrow(/कम से कम एक बिल/);
  });

  it('एक भुगतान से कई बिल एक साथ चुकाए जा सकते हैं', async () => {
    const bill1 = await makeInvoice(COMPANY_ID, grahakB, 1500, 4);
    const bill2 = await makeInvoice(COMPANY_ID, grahakB, 2500, 5);

    await receipt(grahakB, 4000, [
      { reference_id: bill1, allocated_amount: 1500 },
      { reference_id: bill2, allocated_amount: 2500 },
    ]);

    expect((await service.getBillOutstanding(COMPANY_ID, 'SALES_INVOICE', bill1)).is_cleared).toBe(true);
    expect((await service.getBillOutstanding(COMPANY_ID, 'SALES_INVOICE', bill2)).is_cleared).toBe(true);
  });
});
