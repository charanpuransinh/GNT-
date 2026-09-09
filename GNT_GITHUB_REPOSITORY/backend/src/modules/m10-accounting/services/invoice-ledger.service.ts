// ============================================================================
// M10 — InvoiceLedgerService
//
// मालिक का फ़ैसला (2026-09-06, P0): "invoice post होते ही double-entry ledger
// अपने आप बने। जब तक यह ना बने, GNT का accounting हिस्सा अधूरा है।"
//
// पहले: M08 postInvoice `ledgerService.createEntry(...)` (एक ही पंक्ति, गलत) पर
// टिका था और वह DI कभी wire ही नहीं होती थी → हर post "M08 posting dependencies
// are not fully wired" पर throw करता था। M07 का ledger handler भी सीधे throw करता था।
//
// यह service accrual entry बनाती है (बिल उठते ही, payment से अलग/पहले):
//
//   SALES invoice posted:
//     Dr  Sundry Debtors            grand_total
//         Cr  Sales Revenue             (grand_total − tax − round_off)
//         Cr  GST Output Tax            total_tax
//         Cr/Dr Round Off              round_off (± sign)
//
//   PURCHASE invoice posted:
//     Dr  Purchases                 (grand_total − tax − round_off)
//     Dr  GST Input Tax             total_tax
//     Dr/Cr Round Off              round_off (± sign)
//         Cr  Sundry Creditors          grand_total
//
// Control accounts deterministic lookup-or-create हैं (M11 LedgerBridgeService
// वाला pattern — कोई नया chart-of-accounts फ़ैसला नहीं)। Debtors/Creditors के
// लिए वही `M11-AR-<cid>` / `M11-AP-<cid>` code reuse होते हैं ताकि बाद में payment
// voucher उसी खाते पर घटे और outstanding सही नेट हो।
//
// Idempotent: दोबारा post करने पर `{ posted: false, reason: 'already posted' }`
// (revenue/purchases खाते की ledger पंक्ति उसी reference_id पर मौजूद है या नहीं —
// यह खाता सिर्फ़ invoice-posting छूता है, payment नहीं)।
// ============================================================================

import { Prisma, PrismaClient } from '@prisma/client';

export type InvoiceLedgerResult =
  | { posted: true; voucherId: string }
  | { posted: false; reason: string };

interface ResolvedAccount {
  id: string;
}

const r4 = (n: number): number => Number(n.toFixed(4));

export class InvoiceLedgerService {
  constructor(private prisma: PrismaClient) {}

  // ── deterministic lookup-or-create (M11 bridge जैसा) ───────────────────
  private async resolveAccount(
    companyId: string,
    code: string,
    name: string,
    type: 'asset' | 'liability' | 'income' | 'expense'
  ): Promise<ResolvedAccount> {
    const existing = await this.prisma.account_master.findFirst({
      where: { company_id: companyId, code },
    });
    if (existing) return { id: existing.id };
    const created = await this.prisma.account_master.create({
      data: { company_id: companyId, name, code, type },
    });
    return { id: created.id };
  }

  private debtors(companyId: string) {
    return this.resolveAccount(companyId, `M11-AR-${companyId}`, 'Sundry Debtors', 'asset');
  }
  private creditors(companyId: string) {
    return this.resolveAccount(companyId, `M11-AP-${companyId}`, 'Sundry Creditors', 'liability');
  }
  private salesRevenue(companyId: string) {
    return this.resolveAccount(companyId, `M10-SALES-${companyId}`, 'Sales Revenue', 'income');
  }
  private purchases(companyId: string) {
    return this.resolveAccount(companyId, `M10-PURCHASE-${companyId}`, 'Purchases', 'expense');
  }
  private gstOutput(companyId: string) {
    return this.resolveAccount(
      companyId,
      `M10-GST-OUTPUT-${companyId}`,
      'GST Output Tax',
      'liability'
    );
  }
  private gstInput(companyId: string) {
    return this.resolveAccount(companyId, `M10-GST-INPUT-${companyId}`, 'GST Input Tax', 'asset');
  }
  private roundOff(companyId: string) {
    return this.resolveAccount(companyId, `M10-ROUNDOFF-${companyId}`, 'Round Off', 'expense');
  }

  private async alreadyPosted(
    companyId: string,
    referenceType: 'SALES_INVOICE' | 'PURCHASE_INVOICE' | 'SALES_RETURN' | 'PURCHASE_RETURN',
    referenceId: string,
    incomeExpenseAccountId: string
  ): Promise<boolean> {
    const row = await this.prisma.ledger.findFirst({
      where: {
        company_id: companyId,
        reference_type: referenceType,
        reference_id: referenceId,
        account_id: incomeExpenseAccountId,
      },
      select: { id: true },
    });
    return row !== null;
  }

  /**
   * एक balanced double-entry voucher + उसके items + ledger पंक्तियाँ — एक transaction में।
   * lines में हर {accountId, debit, credit} — शून्य लाइनें अपने आप छँट जाती हैं।
   */
  private async writeVoucher(params: {
    companyId: string;
    branchId?: string | null;
    voucherType: 'sales' | 'purchase';
    voucherDate: Date;
    narration: string;
    referenceType: 'SALES_INVOICE' | 'PURCHASE_INVOICE' | 'SALES_RETURN' | 'PURCHASE_RETURN';
    referenceId: string;
    partyId: string;
    partyAccountId: string;
    createdBy?: string | null;
    lines: Array<{ accountId: string; debit: number; credit: number; isParty?: boolean }>;
  }): Promise<string> {
    const {
      companyId,
      branchId,
      voucherType,
      voucherDate,
      narration,
      referenceType,
      referenceId,
      partyId,
      createdBy,
    } = params;
    const lines = params.lines.filter((l) => r4(l.debit) > 0 || r4(l.credit) > 0);
    const totalDebit = r4(lines.reduce((s, l) => s + l.debit, 0));
    const totalCredit = r4(lines.reduce((s, l) => s + l.credit, 0));
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `M10 invoice voucher unbalanced: Dr ${totalDebit} != Cr ${totalCredit} (${referenceType} ${referenceId})`
      );
    }

    const voucherNumber = `${voucherType === 'sales' ? 'SV' : 'PV'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          company_id: companyId,
          ...(branchId ? { branch_id: branchId } : {}),
          voucher_type: voucherType,
          voucher_number: voucherNumber,
          voucher_date: voucherDate,
          total_debit: new Prisma.Decimal(totalDebit),
          total_credit: new Prisma.Decimal(totalCredit),
          narration,
          status: 'posted',
          created_by: createdBy ?? null,
          items: {
            create: lines.map((l) => ({
              account_id: l.accountId,
              ...(l.isParty ? { party_id: partyId } : {}),
              debit_amount: new Prisma.Decimal(r4(l.debit)),
              credit_amount: new Prisma.Decimal(r4(l.credit)),
              narration,
            })),
          },
        },
      });

      await tx.ledger.createMany({
        data: lines.map((l) => ({
          company_id: companyId,
          ...(branchId ? { branch_id: branchId } : {}),
          voucher_id: voucher.id,
          account_id: l.accountId,
          transaction_date: voucherDate,
          debit_amount: new Prisma.Decimal(r4(l.debit)),
          credit_amount: new Prisma.Decimal(r4(l.credit)),
          narration,
          reference_type: referenceType,
          reference_id: referenceId,
          ...(l.isParty ? { party_id: partyId } : {}),
          created_by: createdBy ?? null,
        })),
      });

      return voucher.id;
    });
  }

  /** M08 → M10: sales invoice posted होते ही accrual entry */
  async postSalesInvoice(
    companyId: string,
    invoiceId: string,
    userId?: string
  ): Promise<InvoiceLedgerResult> {
    const inv = await this.prisma.salesInvoice.findFirst({ where: { id: invoiceId, companyId } });
    if (!inv) return { posted: false, reason: 'sales invoice not found for this company' };

    const grandTotal = r4(Number(inv.grandTotal));
    const totalTax = r4(Number(inv.totalTax));
    const roundOff = r4(Number(inv.roundOff));
    const revenue = r4(grandTotal - totalTax - roundOff);
    if (grandTotal <= 0) return { posted: false, reason: 'grand total is zero — nothing to post' };

    const [debtors, salesRev, gstOut, roundOffAcct] = await Promise.all([
      this.debtors(companyId),
      this.salesRevenue(companyId),
      this.gstOutput(companyId),
      this.roundOff(companyId),
    ]);

    if (await this.alreadyPosted(companyId, 'SALES_INVOICE', invoiceId, salesRev.id)) {
      return { posted: false, reason: 'already posted to ledger' };
    }

    const lines = [
      { accountId: debtors.id, debit: grandTotal, credit: 0, isParty: true },
      { accountId: salesRev.id, debit: 0, credit: revenue },
      { accountId: gstOut.id, debit: 0, credit: totalTax },
    ];
    if (roundOff > 0.0001) lines.push({ accountId: roundOffAcct.id, debit: 0, credit: roundOff });
    else if (roundOff < -0.0001)
      lines.push({ accountId: roundOffAcct.id, debit: -roundOff, credit: 0 });

    const voucherId = await this.writeVoucher({
      companyId,
      branchId: inv.branchId,
      voucherType: 'sales',
      voucherDate: inv.invoiceDate ?? new Date(),
      narration: `Sales Invoice ${inv.invoiceNumber}`,
      referenceType: 'SALES_INVOICE',
      referenceId: invoiceId,
      partyId: inv.customerId,
      partyAccountId: debtors.id,
      createdBy: userId,
      lines,
    });
    return { posted: true, voucherId };
  }

  /** M07 → M10: purchase invoice posted होते ही accrual entry */
  async postPurchaseInvoice(
    companyId: string,
    invoiceId: string,
    userId?: string
  ): Promise<InvoiceLedgerResult> {
    const inv = await this.prisma.purchase_invoice.findFirst({
      where: { id: invoiceId, company_id: companyId },
    });
    if (!inv) return { posted: false, reason: 'purchase invoice not found for this company' };

    const grandTotal = r4(Number(inv.grand_total ?? 0));
    const totalTax = r4(Number(inv.total_tax ?? 0));
    const roundOff = r4(Number(inv.round_off ?? 0));
    const purchaseValue = r4(grandTotal - totalTax - roundOff);
    if (grandTotal <= 0) return { posted: false, reason: 'grand total is zero — nothing to post' };

    const [creditors, purchasesAcct, gstIn, roundOffAcct] = await Promise.all([
      this.creditors(companyId),
      this.purchases(companyId),
      this.gstInput(companyId),
      this.roundOff(companyId),
    ]);

    if (await this.alreadyPosted(companyId, 'PURCHASE_INVOICE', invoiceId, purchasesAcct.id)) {
      return { posted: false, reason: 'already posted to ledger' };
    }

    const lines = [
      { accountId: purchasesAcct.id, debit: purchaseValue, credit: 0 },
      { accountId: gstIn.id, debit: totalTax, credit: 0 },
      { accountId: creditors.id, debit: 0, credit: grandTotal, isParty: true },
    ];
    if (roundOff > 0.0001) lines.push({ accountId: roundOffAcct.id, debit: roundOff, credit: 0 });
    else if (roundOff < -0.0001)
      lines.push({ accountId: roundOffAcct.id, debit: 0, credit: -roundOff });

    const voucherId = await this.writeVoucher({
      companyId,
      branchId: inv.branch_id,
      voucherType: 'purchase',
      voucherDate: inv.invoice_date ?? new Date(),
      narration: `Purchase Invoice ${inv.invoice_number}`,
      referenceType: 'PURCHASE_INVOICE',
      referenceId: invoiceId,
      partyId: inv.supplier_id,
      partyAccountId: creditors.id,
      createdBy: userId,
      lines,
    });
    return { posted: true, voucherId };
  }

  /**
   * M08 → M10: sales return (credit note) posted — sales-invoice accrual का उल्टा।
   * Dr Sales Revenue (taxable) + Dr GST Output (tax) = Cr Sundry Debtors (gross)।
   * netAmount = totalAmount + taxAmount (return.service के totals से)।
   */
  async postSalesReturn(
    companyId: string,
    returnId: string,
    userId?: string
  ): Promise<InvoiceLedgerResult> {
    const ret = await this.prisma.salesReturn.findFirst({ where: { id: returnId, companyId } });
    if (!ret) return { posted: false, reason: 'sales return not found for this company' };

    const taxable = r4(Number(ret.totalAmount));
    const tax = r4(Number(ret.taxAmount));
    const gross = r4(Number(ret.netAmount));
    if (gross <= 0) return { posted: false, reason: 'return net amount is zero — nothing to post' };

    const [debtors, salesRev, gstOut] = await Promise.all([
      this.debtors(companyId),
      this.salesRevenue(companyId),
      this.gstOutput(companyId),
    ]);
    if (await this.alreadyPosted(companyId, 'SALES_RETURN', returnId, salesRev.id)) {
      return { posted: false, reason: 'already posted to ledger' };
    }

    const voucherId = await this.writeVoucher({
      companyId,
      branchId: null,
      voucherType: 'sales',
      voucherDate: ret.returnDate ?? new Date(),
      narration: `Sales Return ${ret.returnNumber}`,
      referenceType: 'SALES_RETURN',
      referenceId: returnId,
      partyId: ret.customerId,
      partyAccountId: debtors.id,
      createdBy: userId,
      lines: [
        { accountId: salesRev.id, debit: taxable, credit: 0 },
        { accountId: gstOut.id, debit: tax, credit: 0 },
        { accountId: debtors.id, debit: 0, credit: gross, isParty: true },
      ],
    });
    return { posted: true, voucherId };
  }

  /**
   * M07 → M10: purchase return (debit note) posted — purchase-invoice accrual का उल्टा।
   * Dr Sundry Creditors (gross) = Cr Purchases (taxable) + Cr GST Input (tax)।
   */
  async postPurchaseReturn(
    companyId: string,
    returnId: string,
    userId?: string
  ): Promise<InvoiceLedgerResult> {
    const ret = await this.prisma.purchase_return.findFirst({
      where: { id: returnId, company_id: companyId },
    });
    if (!ret) return { posted: false, reason: 'purchase return not found for this company' };

    const taxable = r4(Number(ret.total_amount ?? 0));
    const tax = r4(Number(ret.tax_amount ?? 0));
    const gross = r4(Number(ret.net_amount ?? 0)) || r4(taxable + tax);
    if (gross <= 0) return { posted: false, reason: 'return net amount is zero — nothing to post' };

    const [creditors, purchasesAcct, gstIn] = await Promise.all([
      this.creditors(companyId),
      this.purchases(companyId),
      this.gstInput(companyId),
    ]);
    if (await this.alreadyPosted(companyId, 'PURCHASE_RETURN', returnId, purchasesAcct.id)) {
      return { posted: false, reason: 'already posted to ledger' };
    }

    const voucherId = await this.writeVoucher({
      companyId,
      branchId: null,
      voucherType: 'purchase',
      voucherDate: ret.return_date ?? new Date(),
      narration: `Purchase Return ${ret.return_number}`,
      referenceType: 'PURCHASE_RETURN',
      referenceId: returnId,
      partyId: ret.supplier_id,
      partyAccountId: creditors.id,
      createdBy: userId,
      lines: [
        { accountId: creditors.id, debit: gross, credit: 0, isParty: true },
        { accountId: purchasesAcct.id, debit: 0, credit: taxable },
        { accountId: gstIn.id, debit: 0, credit: tax },
      ],
    });
    return { posted: true, voucherId };
  }
}
