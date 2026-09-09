// ============================================================================
// Data Sense — TRANSFER executor (मंज़ूरी के बाद GREEN rows को असल modules में डालना)
// (पहले M21; owner फ़ैसला 2026-09-08 से M11 के अंदर।)
//
// यह किसी master का मालिक नहीं बनता — यह सिर्फ़ सही module को सौंपता है।
//
// जुड़े adapters (सब REAL): party→M05, item→M06, export→M20, sales→M08,
// purchase→M07, accounting→M10 (journal 'create'), बैंक-receipt → M11
// (settle-invoices-fifo — owner फ़ैसला #3 Option B: पुराने बकाया बिल क्रम से चुकता)।
//
// pending-adapter (अभी auto-post नहीं): 'scheme' (trade rate), और
// 'credit-ledger' (फ़ैसला #3 default — M10 में सीधे party-ledger credit के लिए
// owner का bank/receivable account mapping चाहिए; तब तक Option B या manual)।
// ============================================================================

import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/common/config/prisma';
import { partyService } from '@/modules/m05-party-management';
import type { CreatePartyDTO } from '@/modules/m05-party-management';
import { ProductService } from '@/modules/m06-inventory';
import type { ProductDTO } from '@/modules/m06-inventory';
import { LedgerRepository } from '@/modules/m11-payment/repositories/ledger.repository';
import { TradeService } from '@/modules/m20-international-trade';
import { EventBus } from '@/shared/events/event-bus';
import { Decimal } from '@prisma/client/runtime/library';
import type { TransferPlanItem } from '../types/dataSense.types';
import { parseImportDate } from './date.util';

export interface TransferRowResult {
  rowNumber: number;
  targetModule: string;
  operation: string;
  status: 'created' | 'skipped' | 'failed' | 'pending-adapter';
  id?: string;
  note?: string;
}

export interface TransferResult {
  companyId: string;
  summary: { created: number; skipped: number; failed: number; pendingAdapter: number };
  rows: TransferRowResult[];
}

const productService = new ProductService();

function str(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function num(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(String(v).replace(/[,\s₹%]/g, ''));
  return Number.isNaN(n) ? undefined : n;
}

function mapParty(payload: Record<string, unknown>): CreatePartyDTO {
  const rawType = (str(payload.partyType) ?? 'customer').toLowerCase();
  const party_type =
    rawType.includes('supplier') && !rawType.includes('customer') ? 'supplier' : 'customer';
  return {
    party_type,
    name: str(payload.name) ?? 'बिना-नाम',
    gstin: str(payload.gstin),
    phone: str(payload.phone),
    email: str(payload.email),
    billing_address: str(payload.address),
    state_code: str(payload.state),
    opening_balance: num(payload.openingBalance) ?? 0,
    opening_type: 'dr',
  };
}

function mapProduct(companyId: string, payload: Record<string, unknown>): ProductDTO {
  return {
    company_id: companyId,
    name: str(payload.name) ?? 'बिना-नाम',
    code: str(payload.sku),
    hsn_code: str(payload.hsn),
    unit: str(payload.unit),
    sale_price: num(payload.rate),
    purchase_price: num(payload.purchaseRate),
    gst_rate: num(payload.gstRate),
  };
}

// export (M20) के लिए party — buyer नाम से ढूँढो, न मिले तो बनाओ
async function resolvePartyId(
  companyId: string,
  buyerName: string | undefined,
  userId?: string,
  partyType: 'customer' | 'supplier' = 'customer'
): Promise<string> {
  const name = buyerName?.trim();
  if (name) {
    const existing = (
      (await partyService.listParties(companyId, { search: name, limit: 1 })) as any
    )?.data?.[0];
    if (existing?.id) return existing.id;
  }
  const party = await partyService.createParty(
    companyId,
    mapParty({ name: name || 'बिना-नाम', partyType }),
    userId
  );
  return party.id;
}

// export (M20) के लिए product — नाम/hsn से ढूँढो, न मिले तो बनाओ
async function resolveProductId(
  companyId: string,
  productName: string | undefined,
  hsn: string | undefined
): Promise<string> {
  const search = productName?.trim() || hsn?.trim();
  if (search) {
    const found = await productService.searchProducts(search, companyId);
    if (found?.[0]?.id) return found[0].id;
  }
  const product = await productService.createProduct(
    mapProduct(companyId, { name: search || 'बिना-नाम', hsn })
  );
  return product.id;
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

// बैंक-receipt import के लिए tenant की **BANK_TRANSFER** भुगतान-विधि चाहिए (कोई भी
// active विधि नहीं — cash/card/wallet बैंक-receipt नहीं होते)। न मिले तो बना देते हैं।
async function getOrCreateBankTransferMethod(companyId: string, userId: string): Promise<string> {
  const existing = await prisma.paymentMethod.findFirst({
    where: { tenantId: companyId, code: 'BANK_TRANSFER' },
  });
  if (existing) return existing.id;
  try {
    const created = await prisma.paymentMethod.create({
      data: {
        code: 'BANK_TRANSFER',
        name: 'Bank Transfer',
        tenantId: companyId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
    return created.id;
  } catch {
    // P2002 race — किसी और request ने बना दी; दोबारा ढूँढो
    const again = await prisma.paymentMethod.findFirst({
      where: { tenantId: companyId, code: 'BANK_TRANSFER' },
    });
    if (again) return again.id;
    throw new Error('BANK_TRANSFER payment method नहीं बन सका');
  }
}

// नाम से एक ही customer — substring/GST/phone match नहीं, बस tenant-scoped exact नाम।
// 0 या 1 से ज़्यादा मिले → null (row suspense में जाएगी, गलत party पर पैसा नहीं लगेगा)।
async function findExactCustomer(
  companyId: string,
  name: string
): Promise<{ id: string; name: string } | null> {
  const hits = await prisma.party_master.findMany({
    where: {
      company_id: companyId,
      is_active: true,
      party_type: { in: ['customer', 'both'] },
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true, name: true },
    take: 2,
  });
  return hits.length === 1 ? hits[0] : null;
}

interface FifoResult {
  status: 'created' | 'skipped' | 'failed';
  id?: string;
  note: string;
}

// owner फ़ैसला #3 Option B — बैंक में आई रक़म को उसी customer के सबसे पुराने बकाया
// (approved/posted) invoice से क्रम में (FIFO) चुकता करना।
//
// यह एक real, idempotent M11 settlement है:
//  • customer exact नाम से (auto-create नहीं) — न मिला/एक से ज़्यादा → suspense
//  • सिर्फ़ approved/posted बिल (draft नहीं)
//  • पूरा receipt एक PaymentTransaction (IN/COMPLETED) — बचत advance allocation में
//  • हर invoice update conditional (बीच में कोई और चुका दे तो rollback)
//  • same receipt दोबारा import → providerRef key से पहचान कर skip
//  • balanced M11 audit-ledger pair (Dr Bank / Cr Receivable)
//
// जान-बूझकर दायरे से बाहर: इस import path से M10 में ताज़ा voucher **नहीं** बनता
// (migrated opening balances के साथ double-count से बचने के लिए) — यह
// M11 का settlement record + M11 audit ledger है, M08 invoice balance update करता है।
async function settleInvoicesFifo(
  companyId: string,
  rowNumber: number,
  payload: Record<string, unknown>,
  userId: string
): Promise<FifoResult> {
  const receiptRaw = num(payload.credit) ?? 0;
  const receipt = round2(receiptRaw);
  if (receipt <= 0) return { status: 'skipped', note: 'जमा राशि 0 — कुछ नहीं किया' };

  const partyName = str(payload.ledgerName);
  if (!partyName) return { status: 'skipped', note: 'party नाम नहीं — suspense में' };

  const customer = await findExactCustomer(companyId, partyName);
  if (!customer) {
    return {
      status: 'skipped',
      note: `'${partyName}' नाम का एक customer नहीं मिला (0 या एक से ज़्यादा) — suspense में`,
    };
  }

  const valueDate = payload.voucherDate ? parseImportDate(payload.voucherDate) : new Date();
  const narration = str(payload.narration) ?? 'Data Sense — बैंक receipt FIFO settlement';

  // idempotency — वही (company, party, राशि, तारीख़, narration) दोबारा आए तो एक ही बार
  const receiptKey =
    'DS-' +
    createHash('sha256')
      .update(
        `${companyId}|${customer.id}|${receipt.toFixed(2)}|${valueDate.toISOString().slice(0, 10)}|${narration}`
      )
      .digest('hex')
      .slice(0, 48);
  const dup = await prisma.paymentTransaction.findFirst({
    where: { tenantId: companyId, providerRef: receiptKey },
    select: { transactionNumber: true },
  });
  if (dup) {
    return {
      status: 'skipped',
      note: `यह receipt पहले import हो चुकी (txn ${dup.transactionNumber})`,
    };
  }

  const methodId = await getOrCreateBankTransferMethod(companyId, userId);
  const txnNumber = `TXN-${Date.now()}-${rowNumber}-${randomBytes(3).toString('hex')}`;

  const outcome = await prisma.$transaction(async (tx) => {
    const open = await tx.salesInvoice.findMany({
      where: {
        companyId,
        customerId: customer.id,
        status: { in: ['approved', 'posted'] },
        paymentStatus: { in: ['unpaid', 'partial'] },
      },
      orderBy: [{ invoiceDate: 'asc' }, { invoiceNumber: 'asc' }],
    });

    let remaining = receipt;
    const allocations: Array<{
      targetType: string;
      targetId: string;
      targetNumber: string | null;
      allocatedAmount: number;
      isFullPayment: boolean;
    }> = [];

    for (const inv of open) {
      if (remaining <= 0.00001) break;
      const grand = Number(inv.grandTotal);
      const already = Number(inv.amountPaid);
      const balance = round2(grand - already);
      if (balance <= 0) continue;
      const alloc = round2(Math.min(remaining, balance));
      const newPaid = round2(already + alloc);
      const full = newPaid >= grand - 0.00001;
      // conditional — बीच में कोई और payment इसी invoice पर लगा दे तो count 0 → rollback
      const upd = await tx.salesInvoice.updateMany({
        where: { id: inv.id, amountPaid: inv.amountPaid },
        data: { amountPaid: newPaid, paymentStatus: full ? 'paid' : 'partial' },
      });
      if (upd.count !== 1) {
        throw new Error(`invoice ${inv.invoiceNumber} बीच में बदल गई — import दोबारा चलाएँ`);
      }
      remaining = round2(remaining - alloc);
      allocations.push({
        targetType: 'INVOICE',
        targetId: inv.id,
        targetNumber: inv.invoiceNumber,
        allocatedAmount: alloc,
        isFullPayment: full,
      });
    }

    const settled = round2(receipt - remaining);
    if (allocations.length === 0) {
      return { txnId: null as string | null, settled: 0, advance: 0, invoiceCount: 0 };
    }

    // बची हुई रक़म — पूरा receipt record हो, इसलिए advance allocation
    if (remaining > 0.00001) {
      allocations.push({
        targetType: 'ACCOUNT',
        targetId: customer.id,
        targetNumber: null,
        allocatedAmount: remaining,
        isFullPayment: false,
      });
    }

    const txn = await tx.paymentTransaction.create({
      data: {
        transactionNumber: txnNumber,
        partyType: 'CUSTOMER',
        partyId: customer.id,
        partyName: customer.name,
        amount: receipt,
        baseAmount: receipt,
        direction: 'IN',
        status: 'COMPLETED',
        paymentMethodId: methodId,
        referenceType: 'INVOICE',
        referenceId: allocations[0].targetId,
        referenceNumber:
          allocations
            .filter((a) => a.targetNumber)
            .map((a) => a.targetNumber)
            .join(', ') || null,
        providerRef: receiptKey,
        narration,
        transactionDate: valueDate,
        valueDate,
        settledAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        tenantId: companyId,
      },
    });
    for (const a of allocations) {
      await tx.paymentAllocation.create({
        data: {
          transactionId: txn.id,
          targetType: a.targetType,
          targetId: a.targetId,
          targetNumber: a.targetNumber,
          allocatedAmount: a.allocatedAmount,
          isFullPayment: a.isFullPayment,
          tenantId: companyId,
        },
      });
    }
    // balanced M11 audit ledger (M11 का अपना संक्षिप्त ledger — payment.service जैसा)
    await new LedgerRepository(tx).create(
      [
        {
          transactionId: txn.id,
          accountCode: 'CASH_BANK',
          debitAmount: new Decimal(receipt),
          creditAmount: new Decimal(0),
          narration: `Receipt ${txnNumber}`,
          entryDate: valueDate,
        },
        {
          transactionId: txn.id,
          accountCode: 'ACCOUNTS_RECEIVABLE',
          debitAmount: new Decimal(0),
          creditAmount: new Decimal(receipt),
          narration: `Receipt ${txnNumber}`,
          entryDate: valueDate,
        },
      ],
      companyId,
      userId
    );

    return {
      txnId: txn.id as string | null,
      settled,
      advance: remaining,
      invoiceCount: allocations.filter((a) => a.targetType === 'INVOICE').length,
    };
  });

  if (!outcome.txnId) {
    return {
      status: 'skipped',
      note: `'${partyName}' का कोई बकाया approved बिल नहीं — receipt suspense में`,
    };
  }
  const note =
    outcome.advance > 0.00001
      ? `${outcome.invoiceCount} बिल में ₹${outcome.settled.toFixed(2)}; ₹${outcome.advance.toFixed(2)} advance जमा`
      : `${outcome.invoiceCount} बिल पूरे/आंशिक चुकता`;
  return { status: 'created', id: outcome.txnId, note };
}

export async function executeTransfer(
  companyId: string,
  plan: TransferPlanItem[],
  userId?: string
): Promise<TransferResult> {
  const rows: TransferRowResult[] = [];
  const summary = { created: 0, skipped: 0, failed: 0, pendingAdapter: 0 };

  for (const item of plan) {
    const base = {
      rowNumber: item.rowNumber,
      targetModule: item.targetModule,
      operation: item.operation,
    };
    try {
      if (item.operation === 'hold-for-review') {
        summary.skipped++;
        rows.push({ ...base, status: 'skipped', note: item.note ?? 'review में रोकी गई' });
        continue;
      }

      // owner फ़ैसला #3 Option B — बैंक receipt → M11 में FIFO invoice settlement
      if (item.operation === 'settle-invoices-fifo') {
        const res = await settleInvoicesFifo(
          companyId,
          item.rowNumber,
          item.payload,
          userId ?? 'data-sense'
        );
        if (res.status === 'created') summary.created++;
        else if (res.status === 'skipped') summary.skipped++;
        else summary.failed++;
        rows.push({ ...base, status: res.status, id: res.id, note: res.note });
        continue;
      }

      if (item.operation !== 'create') {
        // 'credit-ledger' यहीं रुकती है — M10 direct party-ledger credit के लिए
        // owner का bank/receivable account mapping चाहिए (ऊपर header देखें)।
        summary.pendingAdapter++;
        rows.push({
          ...base,
          status: 'pending-adapter',
          note:
            item.operation === 'credit-ledger'
              ? 'बैंक receipt का सीधा M10 ledger-credit — owner account mapping के बाद (तब तक Option B/manual)'
              : `${item.operation} का असली चालान अगले increment में`,
        });
        continue;
      }

      switch (item.targetModule) {
        case 'm05-party-management': {
          const party = await partyService.createParty(companyId, mapParty(item.payload), userId);
          summary.created++;
          rows.push({ ...base, status: 'created', id: party.id });
          break;
        }
        case 'm06-inventory': {
          const product = await productService.createProduct(mapProduct(companyId, item.payload));
          summary.created++;
          rows.push({ ...base, status: 'created', id: product.id });
          break;
        }
        case 'm20-international-trade': {
          const partyId = await resolvePartyId(companyId, str(item.payload.buyerName), userId);
          const productId = await resolveProductId(
            companyId,
            str(item.payload.productName),
            str(item.payload.hsn)
          );
          const tradeService = new TradeService(prisma, new EventBus());
          const shipment = await tradeService.createExportShipment({
            company_id: companyId,
            reference_no: str(item.payload.invoiceNo) ?? `EXP-${Date.now()}`,
            party_id: partyId,
            product_id: productId,
            hsn_code: str(item.payload.hsn) ?? '',
            quantity: num(item.payload.quantity) ?? 1,
            currency: str(item.payload.currency) ?? 'INR',
            value_fob: num(item.payload.fobValue),
          });
          summary.created++;
          rows.push({ ...base, status: 'created', id: (shipment as any).id });
          break;
        }
        case 'm08-sales': {
          // असली M08 sales_invoice बनाओ (single line item from summary) — pending-adapter नहीं
          const partyId = await resolvePartyId(
            companyId,
            str(item.payload.partyName ?? item.payload.buyerName),
            userId
          );
          const taxable = num(item.payload.taxableValue) ?? 0;
          const tax = num(item.payload.gstAmount) ?? 0;
          const total = num(item.payload.invoiceTotal) ?? taxable + tax;
          const date = item.payload.invoiceDate
            ? parseImportDate(item.payload.invoiceDate)
            : new Date();
          const invoice = await prisma.salesInvoice.create({
            data: {
              companyId,
              branchId: companyId,
              customerId: partyId,
              invoiceNumber: str(item.payload.invoiceNo) ?? `INV-${Date.now()}`,
              invoiceDate: date,
              dueDate: date,
              totalAmount: taxable,
              totalTax: tax,
              totalDiscount: 0,
              netAmount: taxable,
              roundOff: 0,
              grandTotal: total,
              items: {
                create: [
                  {
                    productId: str(item.payload.hsn) ?? 'generic',
                    quantity: 1,
                    rate: taxable,
                    discountPercent: 0,
                    discountAmount: 0,
                    amount: taxable,
                    taxRate: taxable > 0 ? (tax / taxable) * 100 : 0,
                    taxAmount: tax,
                    netAmount: taxable,
                    hsnCode: str(item.payload.hsn) ?? null,
                  },
                ],
              },
            },
          });
          summary.created++;
          rows.push({ ...base, status: 'created', id: invoice.id });
          break;
        }
        case 'm07-purchase': {
          // असली M07 purchase_invoice बनाओ (supplier resolve + item)
          const supplierId = await resolvePartyId(
            companyId,
            str(item.payload.supplierName),
            userId,
            'supplier'
          );
          const taxable = num(item.payload.taxableValue) ?? 0;
          const tax = num(item.payload.gstAmount) ?? 0;
          const total = num(item.payload.invoiceTotal) ?? taxable + tax;
          const date = item.payload.invoiceDate
            ? parseImportDate(item.payload.invoiceDate)
            : new Date();
          const invoice = await prisma.purchase_invoice.create({
            data: {
              company_id: companyId,
              branch_id: companyId,
              supplier_id: supplierId,
              invoice_number: str(item.payload.invoiceNo) ?? `PINV-${Date.now()}`,
              invoice_date: date,
              total_amount: taxable,
              total_tax: tax,
              total_discount: 0,
              net_amount: taxable,
              round_off: 0,
              grand_total: total,
              items: {
                create: [
                  {
                    product_id: str(item.payload.hsn) ?? 'generic',
                    quantity: 1,
                    rate: taxable,
                    discount_amount: 0,
                    amount: taxable,
                    tax_rate: taxable > 0 ? (tax / taxable) * 100 : 0,
                    tax_amount: tax,
                    net_amount: taxable,
                  },
                ],
              },
            },
          });
          summary.created++;
          rows.push({ ...base, status: 'created', id: invoice.id });
          break;
        }
        case 'm10-accounting': {
          // असली M10 ledger entry बनाओ (ledgerName → account resolve + debit/credit)
          const ledgerName = str(item.payload.ledgerName);
          if (!ledgerName) throw new Error('ledgerName required');
          const account = await prisma.account_master.findFirst({
            where: { company_id: companyId, name: ledgerName },
          });
          if (!account) throw new Error(`Account '${ledgerName}' not found`);
          const debit = num(item.payload.debit) ?? 0;
          const credit = num(item.payload.credit) ?? 0;
          const date = item.payload.voucherDate
            ? parseImportDate(item.payload.voucherDate)
            : new Date();
          const entry = await prisma.ledger.create({
            data: {
              company_id: companyId,
              account_id: account.id,
              transaction_date: date,
              debit_amount: debit,
              credit_amount: credit,
              narration: str(item.payload.narration) ?? null,
            },
          });
          summary.created++;
          rows.push({ ...base, status: 'created', id: entry.id });
          break;
        }
        default: {
          summary.pendingAdapter++;
          rows.push({
            ...base,
            status: 'pending-adapter',
            note: `${item.targetModule} का adapter अगले increment में`,
          });
        }
      }
    } catch (error) {
      summary.failed++;
      rows.push({
        ...base,
        status: 'failed',
        note: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { companyId, summary, rows };
}
