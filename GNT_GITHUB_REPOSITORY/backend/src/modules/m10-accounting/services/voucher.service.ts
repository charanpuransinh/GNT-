import { PrismaClient, Prisma } from '@prisma/client';

/**
 * M10 — VoucherService
 *
 * मालिक पूरन सिंह का फ़ैसला (2026-09-05): **यह service रहेगी, हटाई नहीं जाएगी।**
 * (मैंने बताया था कि इसे कोई नहीं बुलाता, फिर भी इसकी 3 tests हरी थीं — फ़ैसला "KEEP"।)
 *
 * मालिक का design, ज्यों-का-त्यों:
 *   • हर payment/receipt (पूरा हो या partial) की **अलग voucher entry**
 *   • हर voucher उस **party के ledger** और उस **specific बिल** से लिंक
 *   • **partial payments चलेंगे** — एक बिल के against कई vouchers, जब तक पूरा clear न हो
 *
 * इसके साथ मालिक का हार्ड रूल भी यहीं लागू होता है (party isolation):
 * एक voucher सिर्फ़ **उसी party** के बिल से जुड़ सकता है। दूसरी party के बिल पर
 * allocate करने की कोशिश यहीं रुक जाती है — नीचे `PARTY_MISMATCH` देखें।
 */

export type ReferenceType = 'SALES_INVOICE' | 'PURCHASE_INVOICE';

export interface AllocationInput {
  reference_type: ReferenceType;
  reference_id: string;
  allocated_amount: number;
}

export interface PaymentVoucherInput {
  companyId: string;
  partyId: string;
  /** payment = हमने दिया (सप्लायर को) · receipt = हमें मिला (ग्राहक से) */
  voucherType: 'payment' | 'receipt';
  voucherDate: Date;
  /** बैंक/नक़द का खाता — पैसा कहाँ से गया / कहाँ आया */
  bankOrCashAccountId: string;
  /** party का खाता — किसके नाम चढ़े */
  partyAccountId: string;
  amount: number;
  allocations: AllocationInput[];
  narration?: string;
  branchId?: string;
  createdBy?: string;
}

export class VoucherServiceError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'VoucherServiceError';
  }
}

export class VoucherService {
  constructor(private prisma: PrismaClient) {}

  // ── बिल की जानकारी — दोनों तरफ़ का एक ही आकार में ───────────────────────
  private async getBill(companyId: string, type: ReferenceType, id: string) {
    if (type === 'SALES_INVOICE') {
      const inv = await this.prisma.salesInvoice.findFirst({
        where: { id, companyId },
        select: { id: true, customerId: true, grandTotal: true },
      });
      return inv ? { id: inv.id, partyId: inv.customerId, total: Number(inv.grandTotal) } : null;
    }
    const inv = await this.prisma.purchase_invoice.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, supplier_id: true, grand_total: true },
    });
    return inv ? { id: inv.id, partyId: inv.supplier_id, total: Number(inv.grand_total ?? 0) } : null;
  }

  /** इस बिल पर अब तक कितना चुकाया गया (सारे vouchers जोड़कर) */
  async getAllocatedTotal(companyId: string, type: ReferenceType, referenceId: string): Promise<number> {
    const agg = await this.prisma.voucher_allocation.aggregate({
      where: {
        company_id: companyId,
        reference_type: type,
        reference_id: referenceId,
        // रद्द की गई voucher का पैसा गिनती में नहीं आना चाहिए
        voucher: { status: { not: 'cancelled' } },
      },
      _sum: { allocated_amount: true },
    });
    return Number(agg._sum.allocated_amount ?? 0);
  }

  /**
   * एक बिल का पूरा हिसाब — कुल, चुकाया, बकाया।
   * मालिक की शर्त: "matching और बकाया अमाउंट ट्रैक हो सके"।
   */
  async getBillOutstanding(companyId: string, type: ReferenceType, referenceId: string) {
    const bill = await this.getBill(companyId, type, referenceId);
    if (!bill) throw new VoucherServiceError('BILL_NOT_FOUND', 'बिल नहीं मिला');

    const paid = await this.getAllocatedTotal(companyId, type, referenceId);
    const outstanding = Number((bill.total - paid).toFixed(4));
    return {
      reference_type: type,
      reference_id: referenceId,
      party_id: bill.partyId,
      total: bill.total,
      paid,
      outstanding,
      is_cleared: outstanding <= 0,
    };
  }

  /** इस party के सारे बिलों का बकाया — सिर्फ़ इसी party का, किसी दूसरी का कभी नहीं */
  async getPartyOutstanding(companyId: string, partyId: string) {
    const rows = await this.prisma.voucher_allocation.groupBy({
      by: ['reference_type', 'reference_id'],
      where: { company_id: companyId, party_id: partyId, voucher: { status: { not: 'cancelled' } } },
      _sum: { allocated_amount: true },
    });
    const paidByBill = new Map(rows.map((r) => [`${r.reference_type}:${r.reference_id}`, Number(r._sum.allocated_amount ?? 0)]));

    const sales = await this.prisma.salesInvoice.findMany({
      where: { companyId, customerId: partyId },
      select: { id: true, grandTotal: true },
    });
    const purchases = await this.prisma.purchase_invoice.findMany({
      where: { company_id: companyId, supplier_id: partyId },
      select: { id: true, grand_total: true },
    });

    const bills = [
      ...sales.map((b) => ({ reference_type: 'SALES_INVOICE' as const, reference_id: b.id, total: Number(b.grandTotal) })),
      ...purchases.map((b) => ({ reference_type: 'PURCHASE_INVOICE' as const, reference_id: b.id, total: Number(b.grand_total ?? 0) })),
    ].map((b) => {
      const paid = paidByBill.get(`${b.reference_type}:${b.reference_id}`) ?? 0;
      return { ...b, paid, outstanding: Number((b.total - paid).toFixed(4)) };
    });

    return {
      party_id: partyId,
      bills,
      total_outstanding: Number(bills.reduce((sum, b) => sum + b.outstanding, 0).toFixed(4)),
    };
  }

  /**
   * payment/receipt की voucher — मालिक के design का दिल।
   *
   * सब कुछ एक ही transaction में होता है: voucher + उसके दो items + allocations +
   * party के ledger की दोनों पंक्तियाँ। बीच में कुछ फ़ेल हुआ तो कुछ भी नहीं बचता —
   * आधा-अधूरा हिसाब कभी दर्ज नहीं होगा।
   */
  async createPaymentVoucher(input: PaymentVoucherInput) {
    const {
      companyId, partyId, voucherType, voucherDate, amount, allocations,
      bankOrCashAccountId, partyAccountId, narration, branchId, createdBy,
    } = input;

    if (!allocations.length) {
      throw new VoucherServiceError('ALLOCATION_REQUIRED', 'कम से कम एक बिल चुनना ज़रूरी है');
    }
    if (amount <= 0) {
      throw new VoucherServiceError('AMOUNT_INVALID', 'रकम शून्य से बड़ी होनी चाहिए');
    }

    const allocTotal = Number(allocations.reduce((s, a) => s + a.allocated_amount, 0).toFixed(4));
    if (Math.abs(allocTotal - amount) > 0.01) {
      throw new VoucherServiceError('ALLOCATION_MISMATCH', `बिलों में बाँटी रकम (${allocTotal}) कुल रकम (${amount}) से मेल नहीं खाती`);
    }

    // हर बिल की जाँच — **allocate करने से पहले**, कुछ लिखने से पहले
    for (const alloc of allocations) {
      if (alloc.allocated_amount <= 0) {
        throw new VoucherServiceError('AMOUNT_INVALID', 'हर बिल पर रकम शून्य से बड़ी होनी चाहिए');
      }

      const bill = await this.getBill(companyId, alloc.reference_type, alloc.reference_id);
      if (!bill) throw new VoucherServiceError('BILL_NOT_FOUND', `बिल नहीं मिला: ${alloc.reference_id}`);

      // 🔒 मालिक का हार्ड रूल — voucher सिर्फ़ **उसी party** के बिल से जुड़ सकता है।
      // इसके बिना party A का payment party B के बिल पर चढ़ जाता, और दोनों के ledger
      // आपस में जुड़ जाते — ठीक वही चीज़ जो मालिक ने मना की है।
      if (bill.partyId !== partyId) {
        throw new VoucherServiceError('PARTY_MISMATCH', 'यह बिल इस party का नहीं है — दूसरी party के बिल पर भुगतान नहीं चढ़ सकता');
      }

      // पहले से चुकाए से ज़्यादा न चढ़े
      const alreadyPaid = await this.getAllocatedTotal(companyId, alloc.reference_type, alloc.reference_id);
      const bacha = Number((bill.total - alreadyPaid).toFixed(4));
      if (alloc.allocated_amount - bacha > 0.01) {
        throw new VoucherServiceError('OVER_ALLOCATION', `बिल का बकाया ${bacha} है, उससे ज़्यादा (${alloc.allocated_amount}) नहीं चढ़ सकता`);
      }
    }

    // receipt = ग्राहक से पैसा आया → बैंक debit, party credit
    // payment  = सप्लायर को दिया  → party debit, बैंक credit
    const isReceipt = voucherType === 'receipt';
    const bankDebit = isReceipt ? amount : 0;
    const bankCredit = isReceipt ? 0 : amount;
    const partyDebit = isReceipt ? 0 : amount;
    const partyCredit = isReceipt ? amount : 0;

    const voucherNumber = `${isReceipt ? 'RCPT' : 'PAY'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          company_id: companyId,
          ...(branchId ? { branch_id: branchId } : {}),
          voucher_type: voucherType,
          voucher_number: voucherNumber,
          voucher_date: voucherDate,
          total_debit: new Prisma.Decimal(amount),
          total_credit: new Prisma.Decimal(amount),
          narration: narration ?? null,
          status: 'posted',
          created_by: createdBy ?? null,
          items: {
            create: [
              { account_id: bankOrCashAccountId, debit_amount: bankDebit, credit_amount: bankCredit },
              { account_id: partyAccountId, party_id: partyId, debit_amount: partyDebit, credit_amount: partyCredit },
            ],
          },
        },
        include: { items: true },
      });

      await tx.voucher_allocation.createMany({
        data: allocations.map((a) => ({
          company_id: companyId,
          voucher_id: voucher.id,
          party_id: partyId,
          reference_type: a.reference_type,
          reference_id: a.reference_id,
          allocated_amount: new Prisma.Decimal(a.allocated_amount),
          created_by: createdBy ?? null,
        })),
      });

      // party के ledger की पंक्ति — party_id के साथ, ताकि party-वार खाता-बही सच में
      // अपने में बंद रहे (मालिक का नियम 5)
      await tx.ledger.createMany({
        data: [
          {
            company_id: companyId, ...(branchId ? { branch_id: branchId } : {}),
            voucher_id: voucher.id, account_id: bankOrCashAccountId,
            transaction_date: voucherDate, debit_amount: bankDebit, credit_amount: bankCredit,
            narration: narration ?? null, created_by: createdBy ?? null,
          },
          {
            company_id: companyId, ...(branchId ? { branch_id: branchId } : {}),
            voucher_id: voucher.id, account_id: partyAccountId, party_id: partyId,
            transaction_date: voucherDate, debit_amount: partyDebit, credit_amount: partyCredit,
            narration: narration ?? null, created_by: createdBy ?? null,
            reference_type: allocations[0]?.reference_type ?? null,
            reference_id: allocations[0]?.reference_id ?? null,
          },
        ],
      });

      // बिक्री के बिल पर "कितना चुका" और उसकी हालत साथ-साथ अपडेट
      for (const a of allocations.filter((x) => x.reference_type === 'SALES_INVOICE')) {
        const bill = await tx.salesInvoice.findFirst({ where: { id: a.reference_id, companyId }, select: { grandTotal: true, amountPaid: true } });
        if (!bill) continue;
        const naya = Number(bill.amountPaid) + a.allocated_amount;
        const kul = Number(bill.grandTotal);
        await tx.salesInvoice.update({
          where: { id: a.reference_id },
          data: {
            amountPaid: new Prisma.Decimal(naya),
            paymentStatus: naya + 0.01 >= kul ? 'paid' : 'partial',
          },
        });
      }

      return voucher;
    });
  }

  // ── पढ़ने वाली methods — सब company से बँधी ───────────────────────────────

  async getVouchers(companyId: string, type?: string, fromDate?: Date, toDate?: Date): Promise<unknown[]> {
    return this.prisma.voucher.findMany({
      where: {
        company_id: companyId,
        ...(type ? { voucher_type: type } : {}),
        ...(fromDate && toDate ? { voucher_date: { gte: fromDate, lte: toDate } } : {}),
      },
      include: { items: true, allocations: true },
      orderBy: { voucher_date: 'desc' },
    });
  }

  // 2026-09-05: पहले सिर्फ़ id से खोजता था — यानी दूसरी company की voucher पढ़ी जा सकती थी
  async getVoucherById(companyId: string, id: string): Promise<unknown> {
    return this.prisma.voucher.findFirst({
      where: { id, company_id: companyId },
      include: { items: true, allocations: true },
    });
  }

  async cancelVoucher(companyId: string, id: string): Promise<unknown> {
    const voucher = await this.prisma.voucher.findFirst({ where: { id, company_id: companyId } });
    if (!voucher) throw new VoucherServiceError('VOUCHER_NOT_FOUND', 'Voucher नहीं मिली');
    if (voucher.status === 'cancelled') throw new VoucherServiceError('ALREADY_CANCELLED', 'यह voucher पहले ही रद्द है');

    // रद्द होते ही इसकी allocations बकाया गिनती से अपने आप बाहर हो जाती हैं
    // (getAllocatedTotal में `status: { not: 'cancelled' }` की छन्नी है)
    return this.prisma.voucher.update({
      where: { id },
      data: { status: 'cancelled', updated_at: new Date() },
    });
  }
}
