/**
 * M08 SALES & BILLING — Internal Services (Calculation, Numbering, Tax Breakup)
 * Module: m08-sales | Team: B4-BRAVO
 * SCOPE: INTERNAL — Called only by M08 services
 */

import {
  SalesInvoiceItemDTO,
  SalesInvoiceDTO,
  QuotationItemDTO,
  QuotationDTO,
  SalesOrderItemDTO,
  SalesOrderDTO,
  SalesReturnItemDTO,
  SalesReturnDTO,
  PrintTemplate,
} from '../types/sales.types';

// ─── CALCULATION ENGINE ───

interface TaxSlab {
  rate: number;
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface CalculatedTotals {
  totalAmount: number;
  totalDiscount: number;
  totalTax: number;
  netAmount: number;
  roundOff: number;
  grandTotal: number;
  taxBreakup: TaxSlab[];
}

export function calculateInvoiceTotals(items: SalesInvoiceItemDTO[]): CalculatedTotals {
  let totalAmount = 0;
  let totalDiscount = 0;
  const taxMap = new Map<number, TaxSlab>();

  const calculatedItems = items.map((item) => {
    const qty = Number(item.quantity);
    const rate = Number(item.rate);
    const discPercent = Number(item.discountPercent || 0);

    const gross = qty * rate;
    const discountAmount = (gross * discPercent) / 100;
    const amount = gross - discountAmount;

    const taxRate = Number(item.taxRate || 0);
    const taxAmount = (amount * taxRate) / 100;
    const netAmount = amount + taxAmount;

    totalAmount += gross;
    totalDiscount += discountAmount;

    if (!taxMap.has(taxRate)) {
      taxMap.set(taxRate, { rate: taxRate, amount: 0, cgst: 0, sgst: 0, igst: 0 });
    }
    const slab = taxMap.get(taxRate)!;
    slab.amount += taxAmount;
    slab.cgst += taxAmount / 2;
    slab.sgst += taxAmount / 2;
    // IGST logic would check interstate; simplified here

    return {
      ...item,
      discountAmount: Math.round(discountAmount * 100) / 100,
      amount: Math.round(amount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  });

  const totalTax = Array.from(taxMap.values()).reduce((sum, s) => sum + s.amount, 0);
  const netAmount = totalAmount - totalDiscount + totalTax;
  const grandTotal = Math.round(netAmount);
  const roundOff = grandTotal - netAmount;

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    roundOff: Math.round(roundOff * 100) / 100,
    grandTotal,
    taxBreakup: Array.from(taxMap.values()).map((s) => ({
      ...s,
      amount: Math.round(s.amount * 100) / 100,
      cgst: Math.round(s.cgst * 100) / 100,
      sgst: Math.round(s.sgst * 100) / 100,
      igst: Math.round(s.igst * 100) / 100,
    })),
  };
}

export function calculateQuotationTotals(items: QuotationItemDTO[]): CalculatedTotals {
  const mapped: SalesInvoiceItemDTO[] = items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    rate: i.rate,
    discountPercent: i.discountPercent,
    taxRate: i.taxRate,
  }));
  return calculateInvoiceTotals(mapped);
}

export function calculateOrderTotals(items: SalesOrderItemDTO[]): CalculatedTotals {
  const mapped: SalesInvoiceItemDTO[] = items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    rate: i.rate,
    discountPercent: i.discountPercent,
    taxRate: i.taxRate,
  }));
  return calculateInvoiceTotals(mapped);
}

export function calculateReturnTotals(items: SalesReturnItemDTO[]): CalculatedTotals {
  if (items.length === 0) throw new Error('At least one return item is required');
  let totalAmount = 0;
  let totalTax = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity);
    const rate = Number(item.rate);
    const taxRate = Number(item.taxRate ?? 0);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('Return quantity must be greater than 0');
    if (!Number.isFinite(rate) || rate < 0) throw new Error('Return rate cannot be negative');
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) throw new Error('Return tax rate must be between 0 and 100');
    const amount = qty * rate;
    const taxAmount = (amount * taxRate) / 100;
    const netAmount = amount + taxAmount;

    totalAmount += amount;
    totalTax += taxAmount;

    (item as any).amount = Math.round(amount * 100) / 100;
    (item as any).taxAmount = Math.round(taxAmount * 100) / 100;
    (item as any).netAmount = Math.round(netAmount * 100) / 100;
  });

  const netAmount = totalAmount + totalTax;
  const grandTotal = Math.round(netAmount);
  const roundOff = grandTotal - netAmount;

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalDiscount: 0,
    totalTax: Math.round(totalTax * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    roundOff: Math.round(roundOff * 100) / 100,
    grandTotal,
    taxBreakup: [],
  };
}

// ─── INVOICE NUMBERING ───

export function generateInvoiceNumber(companyId: string, sequence: number, prefix = 'INV'): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${yy}${mm}-${String(sequence).padStart(5, '0')}`;
}

export function generateQuotationNumber(companyId: string, sequence: number): string {
  return generateInvoiceNumber(companyId, sequence, 'QTN');
}

export function generateOrderNumber(companyId: string, sequence: number): string {
  return generateInvoiceNumber(companyId, sequence, 'ORD');
}

export function generateReturnNumber(companyId: string, sequence: number): string {
  return generateInvoiceNumber(companyId, sequence, 'RET');
}

export function generateChallanNumber(companyId: string, sequence: number): string {
  return generateInvoiceNumber(companyId, sequence, 'CHL');
}

// ─── PRINT TEMPLATE DATA PREP ───

export interface PrintData {
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress: string;
  customerGstin: string;
  items: Array<{
    sno: number;
    description: string;
    hsn: string;
    qty: number;
    rate: number;
    amount: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    netAmount: number;
  }>;
  totals: CalculatedTotals;
  paymentMode: string;
  terms: string;
  notes: string;
}

export function preparePrintData(invoice: SalesInvoiceDTO, customer: any, company: any, items: any[]): PrintData {
  return {
    companyName: company?.name || '',
    companyAddress: company?.address || '',
    companyGstin: company?.gstin || '',
    invoiceNumber: invoice.invoiceNumber || '',
    invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-IN'),
    dueDate: new Date(invoice.dueDate).toLocaleDateString('en-IN'),
    customerName: customer?.name || 'Walk-in Customer',
    customerAddress: customer?.address || '',
    customerGstin: customer?.gstin || '',
    items: items.map((item, idx) => ({
      sno: idx + 1,
      description: item.productName || item.productId,
      hsn: item.hsnCode || '',
      qty: Number(item.quantity),
      rate: Number(item.rate),
      amount: Number(item.amount),
      discount: Number(item.discountAmount || 0),
      taxRate: Number(item.taxRate || 0),
      taxAmount: Number(item.taxAmount || 0),
      netAmount: Number(item.netAmount),
    })),
    totals: calculateInvoiceTotals(invoice.items),
    paymentMode: 'Cash',
    terms: invoice.termsConditions || '',
    notes: invoice.notes || '',
  };
}
