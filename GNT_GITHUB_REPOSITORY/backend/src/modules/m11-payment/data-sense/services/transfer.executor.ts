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

import { prisma } from '@/common/config/prisma';
import { partyService } from '@/modules/m05-party-management';
import type { CreatePartyDTO } from '@/modules/m05-party-management';
import { ProductService } from '@/modules/m06-inventory';
import type { ProductDTO } from '@/modules/m06-inventory';
import { StockService } from '@/modules/m06-inventory/services/stock.service';
import { TradeService } from '@/modules/m20-international-trade';
import { eventBus } from '@/common/events/event-bus';
import { SalesService } from '@/modules/m08-sales';
import { PurchaseService } from '@/modules/m07-purchase/services/purchase.service';
import { PurchaseEventHandlers } from '@/modules/m07-purchase/events/purchase.handlers';
import { InvoiceLedgerService } from '@/modules/m10-accounting';
import { gstService } from '@/modules/m09-gst';
import type { TransferPlanItem } from '../types/dataSense.types';
import { parseImportDate } from './date.util';
import { type HoldReason, createHold } from './paymentHold.service';
import { applyReceiptFifo, buildReceiptKey, findExactCustomer, round2 } from './receiptSettlement';

// module-registry.ts के M07 mount जैसी ही असली DI (stock/GST/ledger side-effects
// के लिए) — copy नहीं, वही असली PurchaseService जो production route पर चलता है,
// बस यहाँ भी वही तार जोड़े गए हैं ताकि raw prisma.purchase_invoice.create की जगह
// पूरी pipeline (numbering + GST calc + stock-in + M10 ledger post + events) चले।
function buildPurchaseService(): PurchaseService {
  const stockSvc = new StockService();
  const invoiceLedgerSvc = new InvoiceLedgerService(prisma);
  const stockServiceForHandlers = {
    async addStock(data: { product_id: string; quantity: number; rate: number; batch_id?: string; reference: string; company_id: string }): Promise<void> {
      await stockSvc.addStock(data.product_id, data.quantity, data.company_id, null, data.batch_id ?? null, data.rate ?? null, 'purchase', data.reference);
    },
    async deductStock(data: { product_id: string; quantity: number; reference: string; company_id: string }): Promise<void> {
      await stockSvc.deductStock(data.product_id, data.quantity, data.company_id, null, null, 'purchase_return', data.reference);
    },
  };
  const gstServiceForHandlers = {
    async calculateInputTax(data: {
      invoice_id: string;
      company_id: string;
      supplier_id: string;
      invoice_date: Date;
      taxable_amount: number;
      total_tax_amount: number;
      items: Array<{ product_id: string; tax_amount: number; hsn_code?: string }>;
    }): Promise<void> {
      try {
        await gstService.recordInvoiceTax({
          companyId: data.company_id,
          partyId: data.supplier_id,
          referenceType: 'purchase_invoice',
          referenceId: data.invoice_id,
          transactionDate: data.invoice_date,
          hsnCode: data.items.length === 1 ? data.items[0].hsn_code ?? null : null,
          taxableAmount: data.taxable_amount,
          totalTaxAmount: data.total_tax_amount,
          taxType: 'input',
        });
      } catch (e) {
        console.error(`[M07→M09] gst_transaction record failed for invoice ${data.invoice_id}:`, e);
      }
    },
    async reverseInputTax(data: {
      return_id: string; company_id: string; supplier_id: string; return_date: Date;
      taxable_amount: number; total_tax_amount: number;
      items: Array<{ product_id: string; tax_amount: number }>;
    }): Promise<void> {
      try {
        await gstService.recordInvoiceTax({
          companyId: data.company_id,
          partyId: data.supplier_id,
          referenceType: 'purchase_return',
          referenceId: data.return_id,
          transactionDate: data.return_date,
          taxableAmount: -data.taxable_amount,
          totalTaxAmount: -data.total_tax_amount,
          taxType: 'input',
        });
      } catch (e) {
        console.error(`[M07→M09] gst_transaction reversal failed for return ${data.return_id}:`, e);
      }
    },
  };
  const ledgerServiceForHandlers = {
    async createPurchaseEntry(data: { invoice_id: string; company_id: string; supplier_id: string; amount: number; tax_amount: number; reference: string }): Promise<void> {
      const res = await invoiceLedgerSvc.postPurchaseInvoice(data.company_id, data.invoice_id, 'system');
      if (!res.posted && res.reason !== 'already posted to ledger') {
        throw new Error(`M07→M10 purchase ledger posting failed: ${res.reason}`);
      }
    },
    async createPurchaseReturnEntry(data: { return_id: string; company_id: string; supplier_id: string; amount: number; tax_amount: number; reference: string }): Promise<void> {
      const res = await invoiceLedgerSvc.postPurchaseReturn(data.company_id, data.return_id, 'system');
      if (!res.posted && res.reason !== 'already posted to ledger') {
        throw new Error(`M07→M10 purchase-return ledger reversal failed: ${res.reason}`);
      }
    },
  };
  const handlers = new PurchaseEventHandlers(stockServiceForHandlers, gstServiceForHandlers, ledgerServiceForHandlers, eventBus);
  return new PurchaseService(prisma, handlers, eventBus);
}

export interface TransferRowResult {
  rowNumber: number;
  targetModule: string;
  operation: string;
  status: 'created' | 'skipped' | 'failed' | 'pending-adapter' | 'on-hold';
  id?: string;
  note?: string;
}

export interface TransferResult {
  companyId: string;
  summary: {
    created: number;
    skipped: number;
    failed: number;
    pendingAdapter: number;
    onHold: number;
  };
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

interface FifoResult {
  status: 'created' | 'skipped' | 'failed' | 'on-hold';
  id?: string;
  note: string;
}

// बैंक-receipt पंक्ति process करो — उद्योग-मानक "Apply to Oldest":
//  • साफ़ payment (customer मिला, बकाया बिल है) → अपने-आप FIFO, चुपचाप
//  • shak़ी / customer न मिला / एक से ज़्यादा / कोई बकाया बिल नहीं → **on-hold** सूची
//    (owner फ़ैसला 2026-09-09) — GNT यहाँ से कभी अपने-आप कुछ apply/close नहीं करता।
async function settleReceiptRow(
  companyId: string,
  rowNumber: number,
  payload: Record<string, unknown>,
  userId: string,
  sheetName: string | undefined
): Promise<FifoResult> {
  const amount = round2(num(payload.credit) ?? 0);
  if (amount <= 0) return { status: 'skipped', note: 'जमा राशि 0 — कुछ नहीं किया' };

  const partyName = str(payload.ledgerName);
  if (!partyName) return { status: 'skipped', note: 'party नाम नहीं — पंक्ति छोड़ी' };

  const valueDate = payload.voucherDate ? parseImportDate(payload.voucherDate) : new Date();
  const narration = str(payload.narration) ?? 'Data Sense — बैंक receipt';

  const toHold = async (
    reason: HoldReason,
    resolvedPartyId: string | null,
    why: string
  ): Promise<FifoResult> => {
    const h = await createHold({
      companyId,
      userId,
      partyNameRaw: partyName,
      resolvedPartyId,
      amount,
      valueDate,
      narration,
      reason,
      sourceSheet: sheetName ?? null,
      sourceRow: rowNumber,
    });
    return { status: 'on-hold', id: h.id, note: `${why} — on-hold सूची में` };
  };

  // owner/फ़ाइल का shak़ी flag → सीधे on-hold, कभी auto-apply नहीं
  const flag = (str(payload.flag) ?? '').toLowerCase();
  if (flag.includes('disput')) return toHold('DISPUTED', null, 'disputed मार्क');
  if (flag.includes('doubt') || flag.includes('hold'))
    return toHold('DOUBTFUL', null, 'doubtful मार्क');

  const customer = await findExactCustomer(companyId, partyName);
  if (!customer) {
    const n = await prisma.party_master.count({
      where: {
        company_id: companyId,
        is_active: true,
        party_type: { in: ['customer', 'both'] },
        name: { equals: partyName, mode: 'insensitive' },
      },
    });
    return n > 1
      ? toHold('AMBIGUOUS_PARTY', null, `'${partyName}' नाम के ${n} customer`)
      : toHold('CUSTOMER_NOT_FOUND', null, `'${partyName}' नाम का customer नहीं मिला`);
  }

  const result = await applyReceiptFifo({
    companyId,
    userId,
    customerId: customer.id,
    customerName: customer.name,
    amount,
    valueDate,
    narration,
    receiptKey: buildReceiptKey(companyId, customer.id, amount, valueDate, narration),
    rowRef: rowNumber,
  });

  if (result.status === 'duplicate') return { status: 'skipped', note: result.note };
  if (result.status === 'no-open-invoice')
    return toHold('NO_OPEN_INVOICE', customer.id, result.note);
  return { status: 'created', id: result.txnId, note: result.note };
}

export async function executeTransfer(
  companyId: string,
  plan: TransferPlanItem[],
  userId?: string,
  sheetName?: string
): Promise<TransferResult> {
  const rows: TransferRowResult[] = [];
  const summary = { created: 0, skipped: 0, failed: 0, pendingAdapter: 0, onHold: 0 };

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

      // owner फ़ैसला #3 Option B — बैंक receipt → साफ़ हो तो FIFO, वरना on-hold सूची
      if (item.operation === 'settle-invoices-fifo') {
        const res = await settleReceiptRow(
          companyId,
          item.rowNumber,
          item.payload,
          userId ?? 'data-sense',
          sheetName
        );
        if (res.status === 'created') summary.created++;
        else if (res.status === 'skipped') summary.skipped++;
        else if (res.status === 'on-hold') summary.onHold++;
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
          const tradeService = new TradeService(prisma, eventBus);
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
          // असली M08 SalesService pipeline — पहले raw prisma.salesInvoice.create था,
          // जो invoice numbering, GST-calc engine, M10 ledger auto-post, और
          // sales.invoice.created event (M16/M17/M19 इसी पर निर्भर) — सब छोड़ देता
          // था, और productId की जगह HSN कोड string डाल देता था (ग़लत FK)।
          const actingUser = userId ?? 'data-sense';
          const partyId = await resolvePartyId(
            companyId,
            str(item.payload.partyName ?? item.payload.buyerName),
            userId
          );
          const productId = await resolveProductId(
            companyId,
            str(item.payload.productName),
            str(item.payload.hsn)
          );
          const taxable = num(item.payload.taxableValue) ?? 0;
          const tax = num(item.payload.gstAmount) ?? 0;
          const date = item.payload.invoiceDate
            ? parseImportDate(item.payload.invoiceDate)
            : new Date();
          const salesService = new SalesService();
          const draft = await salesService.createInvoice({
            companyId,
            branchId: companyId,
            customerId: partyId,
            invoiceNumber: str(item.payload.invoiceNo),
            invoiceDate: date,
            dueDate: date,
            items: [
              {
                productId,
                quantity: 1,
                rate: taxable,
                taxRate: taxable > 0 ? (tax / taxable) * 100 : 0,
                hsnCode: str(item.payload.hsn),
              },
            ],
            createdBy: actingUser,
          });
          await salesService.approveInvoice(draft.id, companyId, actingUser);
          const invoice = await salesService.postInvoice(draft.id, companyId, actingUser);
          summary.created++;
          rows.push({ ...base, status: 'created', id: invoice.id });
          break;
        }
        case 'm07-purchase': {
          // असली M07 PurchaseService pipeline — पहले raw prisma.purchase_invoice.create
          // था, जो numbering, GST-calc, stock-in on receipt, M10 ledger auto-post, और
          // purchase.invoice.approved/posted events — सब छोड़ देता था।
          const actingUser = userId ?? 'data-sense';
          const supplierId = await resolvePartyId(
            companyId,
            str(item.payload.supplierName),
            userId,
            'supplier'
          );
          const productId = await resolveProductId(
            companyId,
            str(item.payload.productName),
            str(item.payload.hsn)
          );
          const taxable = num(item.payload.taxableValue) ?? 0;
          const tax = num(item.payload.gstAmount) ?? 0;
          const date = item.payload.invoiceDate
            ? parseImportDate(item.payload.invoiceDate)
            : new Date();
          const purchaseService = buildPurchaseService();
          const draft = await purchaseService.createPurchaseInvoice({
            company_id: companyId,
            branch_id: companyId,
            supplier_id: supplierId,
            invoice_number: str(item.payload.invoiceNo) ?? `PINV-${Date.now()}`,
            invoice_date: date,
            items: [
              {
                product_id: productId,
                quantity: 1,
                rate: taxable,
                tax_rate: taxable > 0 ? (tax / taxable) * 100 : 0,
                hsn_code: str(item.payload.hsn),
              },
            ],
            created_by: actingUser,
          });
          await purchaseService.approvePurchaseInvoice(draft.id, companyId, actingUser);
          await purchaseService.postPurchaseInvoice(draft.id, companyId, actingUser);
          summary.created++;
          rows.push({ ...base, status: 'created', id: draft.id });
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
