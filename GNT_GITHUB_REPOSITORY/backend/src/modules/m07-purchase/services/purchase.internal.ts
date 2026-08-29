// ============================================================================
// M07 PURCHASE MANAGEMENT — Internal Services (Calculation, Parser, Utils)
// ============================================================================

import { PurchaseInvoiceItemDTO, PurchaseOrderItemDTO, PurchaseReturnItemDTO, InvoiceCalculationResult } from '../types/purchase.types';

// ─── Invoice Calculation Engine ───

export function calculateInvoiceTotals(
  items: PurchaseInvoiceItemDTO[],
  round_off: number = 0,
): InvoiceCalculationResult {
  let total_amount = 0;
  let total_discount = 0;
  let total_tax = 0;
  let net_amount = 0;

  const calculatedItems = items.map(item => {
    const qty = item.quantity;
    const rate = item.rate;
    const discountPercent = item.discount_percent || 0;
    const taxRate = item.tax_rate || 0;

    // Amount before discount
    const grossAmount = qty * rate;

    // Discount
    const discountAmount = item.discount_amount || (grossAmount * discountPercent / 100);
    const amountAfterDiscount = grossAmount - discountAmount;

    // Tax
    const taxAmount = amountAfterDiscount * taxRate / 100;
    const itemNetAmount = amountAfterDiscount + taxAmount;

    total_amount += grossAmount;
    total_discount += discountAmount;
    total_tax += taxAmount;
    net_amount += itemNetAmount;

    return {
      amount: parseFloat(grossAmount.toFixed(4)),
      discount_amount: parseFloat(discountAmount.toFixed(4)),
      tax_amount: parseFloat(taxAmount.toFixed(4)),
      net_amount: parseFloat(itemNetAmount.toFixed(4)),
    };
  });

  const grand_total = net_amount + round_off;

  return {
    total_amount: parseFloat(total_amount.toFixed(4)),
    total_discount: parseFloat(total_discount.toFixed(4)),
    total_tax: parseFloat(total_tax.toFixed(4)),
    net_amount: parseFloat(net_amount.toFixed(4)),
    grand_total: parseFloat(grand_total.toFixed(4)),
    items: calculatedItems,
  };
}

export function calculatePOTotals(items: PurchaseOrderItemDTO[]) {
  let total_amount = 0;
  let total_discount = 0;
  let total_tax = 0;
  let net_amount = 0;

  items.forEach(item => {
    const qty = item.quantity;
    const rate = item.rate;
    const discountPercent = item.discount_percent || 0;
    const taxRate = item.tax_rate || 0;

    const grossAmount = qty * rate;
    const discountAmount = item.discount_amount || (grossAmount * discountPercent / 100);
    const amountAfterDiscount = grossAmount - discountAmount;
    const taxAmount = amountAfterDiscount * taxRate / 100;
    const itemNetAmount = amountAfterDiscount + taxAmount;

    total_amount += grossAmount;
    total_discount += discountAmount;
    total_tax += taxAmount;
    net_amount += itemNetAmount;
  });

  return {
    total_amount: parseFloat(total_amount.toFixed(4)),
    total_discount: parseFloat(total_discount.toFixed(4)),
    total_tax: parseFloat(total_tax.toFixed(4)),
    net_amount: parseFloat(net_amount.toFixed(4)),
  };
}

export function calculateReturnTotals(items: PurchaseReturnItemDTO[]) {
  if (items.length === 0) throw new Error('At least one return item is required');
  let total_amount = 0;
  let tax_amount = 0;
  let net_amount = 0;

  for (const item of items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new Error('Return quantity must be greater than 0');
    if (!Number.isFinite(item.rate) || item.rate < 0) throw new Error('Return rate cannot be negative');
    const amount = item.quantity * item.rate;
    const tax = item.tax_amount ?? 0;
    const net = item.net_amount ?? (amount + tax);
    if (!Number.isFinite(tax) || tax < 0 || !Number.isFinite(net) || net < 0) throw new Error('Invalid return tax/net amount');
    total_amount += amount;
    tax_amount += tax;
    net_amount += net;
  }

  return {
    total_amount: parseFloat(total_amount.toFixed(4)),
    tax_amount: parseFloat(tax_amount.toFixed(4)),
    net_amount: parseFloat(net_amount.toFixed(4)),
  };
}

// ─── Number to Words (Indian Format) ───

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertLessThanOneThousand(n: number): string {
  if (n === 0) return '';
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  if (n < 100) {
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  }
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  if (num < 0) return 'Negative ' + numberToWords(-num);

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = '';
  let n = integerPart;

  const crores = Math.floor(n / 10000000);
  n %= 10000000;
  const lakhs = Math.floor(n / 100000);
  n %= 100000;
  const thousands = Math.floor(n / 1000);
  n %= 1000;
  const hundreds = n;

  if (crores > 0) result += convertLessThanOneThousand(crores) + ' Crore ';
  if (lakhs > 0) result += convertLessThanOneThousand(lakhs) + ' Lakh ';
  if (thousands > 0) result += convertLessThanOneThousand(thousands) + ' Thousand ';
  if (hundreds > 0) result += convertLessThanOneThousand(hundreds);

  result = result.trim() + ' Rupees';
  if (decimalPart > 0) {
    result += ' and ' + convertLessThanOneThousand(decimalPart) + ' Paise';
  }
  result += ' Only';

  return result;
}

// ─── OCR Data Parser ───

export interface ParsedOCRData {
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  total_tax: number;
  items: Array<{
    product_name: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  confidence: number;
}

export function parseOCRText(rawText: string): ParsedOCRData {
  // Deterministic parser for OCR text. Missing fields remain empty so downstream
  // review/validation can reject incomplete extraction instead of inventing data.
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  let supplier_name = '';
  let invoice_number = '';
  let invoice_date = '';
  let total_amount = 0;
  let total_tax = 0;
  const items: ParsedOCRData['items'] = [];

  // Simple regex-based extraction
  for (const line of lines) {
    if (line.match(/invoice\s*#?\s*[:\-]?\s*(\w+)/i)) {
      const match = line.match(/invoice\s*#?\s*[:\-]?\s*(\w+)/i);
      if (match) invoice_number = match[1];
    }
    if (line.match(/date\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i)) {
      const match = line.match(/date\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
      if (match) invoice_date = match[1];
    }
    if (line.match(/total\s*[:\-]?\s*[₹$]?\s*([\d,.]+)/i)) {
      const match = line.match(/total\s*[:\-]?\s*[₹$]?\s*([\d,.]+)/i);
      if (match) total_amount = parseFloat(match[1].replace(/,/g, ''));
    }
    if (line.match(/tax\s*[:\-]?\s*[₹$]?\s*([\d,.]+)/i)) {
      const match = line.match(/tax\s*[:\-]?\s*[₹$]?\s*([\d,.]+)/i);
      if (match) total_tax = parseFloat(match[1].replace(/,/g, ''));
    }
    // Item extraction (simplified)
    const itemMatch = line.match(/(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
    if (itemMatch && !line.toLowerCase().includes('total')) {
      items.push({
        product_name: itemMatch[1].trim(),
        quantity: parseFloat(itemMatch[2]),
        rate: parseFloat(itemMatch[3]),
        amount: parseFloat(itemMatch[4]),
      });
    }
  }

  // Estimate confidence based on extracted fields
  let confidenceScore = 0;
  if (supplier_name) confidenceScore += 20;
  if (invoice_number) confidenceScore += 20;
  if (invoice_date) confidenceScore += 20;
  if (total_amount > 0) confidenceScore += 20;
  if (items.length > 0) confidenceScore += 20;

  return {
    supplier_name,
    invoice_number,
    invoice_date,
    total_amount,
    total_tax,
    items,
    confidence: confidenceScore,
  };
}
