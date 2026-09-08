// ============================================================================
// Data Sense — TRANSFER executor (मंज़ूरी के बाद GREEN rows को असल modules में डालना)
// (पहले M21; owner फ़ैसला 2026-09-08 से M11 के अंदर।)
//
// यह किसी master का मालिक नहीं बनता — यह सिर्फ़ सही module को सौंपता है।
//
// जुड़े adapters (सब REAL): party→M05, item→M06, export→M20, sales→M08,
// purchase→M07, accounting→M10, बैंक-receipt→M10 (credit-ledger, default) या
// M11 (settle-invoices-fifo — owner फ़ैसला #3 Option B: पुराने open बिल क्रम से चुकता)।
// सिर्फ़ 'scheme' (trade scheme/rate, SPEC-B) अभी pending-adapter।
// ============================================================================

import { prisma } from '@/common/config/prisma';
import { partyService } from '@/modules/m05-party-management';
import type { CreatePartyDTO } from '@/modules/m05-party-management';
import { ProductService } from '@/modules/m06-inventory';
import type { ProductDTO } from '@/modules/m06-inventory';
import { TradeService } from '@/modules/m20-international-trade';
import { EventBus } from '@/shared/events/event-bus';
import type { TransferPlanItem } from '../types/dataSense.types';

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

// बैंक-receipt import के लिए एक भुगतान-विधि चाहिए; tenant के पास कोई सक्रिय
// विधि न हो तो एक BANK_TRANSFER बना देते हैं (owner बाद में rename कर सकता है)।
async function getOrCreateReceiptMethod(companyId: string, userId: string): Promise<string> {
  const existing = await prisma.paymentMethod.findFirst({
    where: { tenantId: companyId, isActive: true },
    orderBy: [{ code: 'asc' }],
  });
  if (existing) return existing.id;
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
}

interface FifoResult {
  status: 'created' | 'skipped' | 'failed';
  id?: string;
  note: string;
}

// owner फ़ैसला #3 Option B — बैंक में आई रक़म को उसी पार्टी के सबसे पुराने open
// invoice से क्रम में (FIFO) चुकता करना। M11 का PaymentTransaction + Allocation
// लिखता है और settled invoice का amountPaid/paymentStatus अपडेट करता है।
async function settleInvoicesFifo(
  companyId: string,
  rowNumber: number,
  payload: Record<string, unknown>,
  userId: string
): Promise<FifoResult> {
  const receipt = num(payload.credit) ?? 0;
  if (receipt <= 0) return { status: 'skipped', note: 'जमा राशि 0 — कुछ नहीं किया' };

  const partyName = str(payload.ledgerName);
  const partyId = await resolvePartyId(companyId, partyName, userId, 'customer');

  const open = await prisma.salesInvoice.findMany({
    where: { companyId, customerId: partyId, paymentStatus: { in: ['unpaid', 'partial'] } },
    orderBy: [{ invoiceDate: 'asc' }, { invoiceNumber: 'asc' }],
  });
  if (open.length === 0) {
    return {
      status: 'skipped',
      note: `'${partyName ?? partyId}' का कोई बकाया बिल नहीं — receipt suspense में`,
    };
  }

  const dateStr = str(payload.voucherDate);
  const valueDate = dateStr ? new Date(dateStr) : new Date();
  const methodId = await getOrCreateReceiptMethod(companyId, userId);

  let remaining = receipt;
  const allocations: Array<{
    targetId: string;
    targetNumber: string;
    allocatedAmount: number;
    isFullPayment: boolean;
  }> = [];
  const invoiceUpdates: Array<{ id: string; newPaid: number; status: 'partial' | 'paid' }> = [];

  for (const inv of open) {
    if (remaining <= 0.00001) break;
    const grand = Number(inv.grandTotal);
    const already = Number(inv.amountPaid);
    const balance = Math.max(grand - already, 0);
    if (balance <= 0) continue;
    const alloc = Math.min(remaining, balance);
    remaining -= alloc;
    const newPaid = already + alloc;
    const full = newPaid >= grand - 0.00001;
    allocations.push({
      targetId: inv.id,
      targetNumber: inv.invoiceNumber,
      allocatedAmount: alloc,
      isFullPayment: full,
    });
    invoiceUpdates.push({ id: inv.id, newPaid, status: full ? 'paid' : 'partial' });
  }

  if (allocations.length === 0) {
    return { status: 'skipped', note: 'सभी बकाया बिल पहले से चुकता — कुछ allocate नहीं हुआ' };
  }

  const settledAmount = receipt - remaining;
  const txnId = await prisma.$transaction(async (tx) => {
    const txn = await tx.paymentTransaction.create({
      data: {
        transactionNumber: `TXN-${Date.now()}-${rowNumber}`,
        partyType: 'CUSTOMER',
        partyId,
        partyName: partyName ?? 'बिना-नाम',
        amount: settledAmount,
        baseAmount: settledAmount,
        direction: 'IN',
        status: 'COMPLETED',
        paymentMethodId: methodId,
        referenceType: 'INVOICE',
        referenceId: allocations[0].targetId,
        referenceNumber: allocations.map((a) => a.targetNumber).join(', '),
        narration: str(payload.narration) ?? 'Data Sense — बैंक receipt FIFO settlement',
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
          targetType: 'INVOICE',
          targetId: a.targetId,
          targetNumber: a.targetNumber,
          allocatedAmount: a.allocatedAmount,
          isFullPayment: a.isFullPayment,
          tenantId: companyId,
        },
      });
    }
    for (const u of invoiceUpdates) {
      await tx.salesInvoice.update({
        where: { id: u.id },
        data: { amountPaid: u.newPaid, paymentStatus: u.status },
      });
    }
    return txn.id;
  });

  const note =
    remaining > 0.00001
      ? `${allocations.length} बिल चुकता; ₹${remaining.toFixed(2)} advance बची`
      : `${allocations.length} बिल पूरे/आंशिक चुकता`;
  return { status: 'created', id: txnId, note };
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

      // 'credit-ledger' (फ़ैसला #3 default) targetModule 'm10-accounting' है —
      // नीचे वाला m10 case ही credit/debit से ledger entry बना देता है।
      if (item.operation !== 'create' && item.operation !== 'credit-ledger') {
        summary.pendingAdapter++;
        rows.push({
          ...base,
          status: 'pending-adapter',
          note: `${item.operation} का असली चालान अगले increment में`,
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
          const dateStr = str(item.payload.invoiceDate);
          const date = dateStr ? new Date(dateStr) : new Date();
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
          const dateStr = str(item.payload.invoiceDate);
          const date = dateStr ? new Date(dateStr) : new Date();
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
          const dateStr = str(item.payload.voucherDate);
          const date = dateStr ? new Date(dateStr) : new Date();
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
