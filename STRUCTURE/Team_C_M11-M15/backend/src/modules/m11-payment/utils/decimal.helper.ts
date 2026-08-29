// M11 Payment Module - Decimal Helper
// Handles Prisma Decimal serialization safely

import { Decimal } from '@prisma/client/runtime/library';

export const toDecimal = (value: string | number | Decimal): Decimal => {
  if (value instanceof Decimal) return value;
  return new Decimal(value);
};

export const toDecimalString = (value: Decimal | string | number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  if (value instanceof Decimal) return value.toFixed(4);
  if (typeof value === 'number') return value.toFixed(4);
  return value;
};

export const addDecimals = (a: Decimal, b: Decimal): Decimal => a.add(b);
export const subDecimals = (a: Decimal, b: Decimal): Decimal => a.sub(b);
export const mulDecimals = (a: Decimal, b: Decimal): Decimal => a.mul(b);
export const divDecimals = (a: Decimal, b: Decimal): Decimal => a.div(b);

export const zeroDecimal = (): Decimal => new Decimal(0);

export const formatCurrency = (amount: Decimal | string, currency: string = 'INR'): string => {
  const val = amount instanceof Decimal ? amount.toNumber() : parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(val);
};

export const calculateInvoiceTotals = (lineItems: { quantity: Decimal; unitPrice: Decimal; taxRate: Decimal | null; discountPercent: Decimal | null }[]) => {
  let subTotal = zeroDecimal();
  let totalTax = zeroDecimal();
  let totalDiscount = zeroDecimal();

  for (const item of lineItems) {
    const lineTotal = item.quantity.mul(item.unitPrice);
    const discountAmount = item.discountPercent ? lineTotal.mul(item.discountPercent).div(100) : zeroDecimal();
    const taxableAmount = lineTotal.sub(discountAmount);
    const taxAmount = item.taxRate ? taxableAmount.mul(item.taxRate).div(100) : zeroDecimal();
    const itemTotal = taxableAmount.add(taxAmount);

    subTotal = subTotal.add(itemTotal);
    totalTax = totalTax.add(taxAmount);
    totalDiscount = totalDiscount.add(discountAmount);
  }

  return {
    subTotal,
    taxAmount: totalTax,
    discountAmount: totalDiscount,
    totalAmount: subTotal,
  };
};
