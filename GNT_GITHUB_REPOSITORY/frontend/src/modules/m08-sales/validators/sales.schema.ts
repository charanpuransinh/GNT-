/**
 * M08 SALES & BILLING — Frontend Zod Validators
 * Module: m08-sales | Team: B4-BRAVO
 */

import { z } from 'zod';

const decimal = z.union([z.string(), z.number()]).transform((v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) throw new Error('Invalid number');
  return n;
});

// ─── ITEM SCHEMAS ───
export const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  quantity: decimal.refine((v) => v > 0, 'Quantity must be > 0'),
  rate: decimal.refine((v) => v >= 0, 'Rate must be >= 0'),
  discountPercent: decimal.default(0),
  taxRate: decimal.default(0),
  hsnCode: z.string().optional(),
  batchId: z.string().optional(),
});

export const quotationItemSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  quantity: decimal.refine((v) => v > 0, 'Quantity must be > 0'),
  rate: decimal.refine((v) => v >= 0, 'Rate must be >= 0'),
  discountPercent: decimal.default(0),
  taxRate: decimal.default(0),
  hsnCode: z.string().optional(),
});

export const returnItemSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  quantity: decimal.refine((v) => v > 0, 'Quantity must be > 0'),
  rate: decimal.refine((v) => v >= 0, 'Rate must be >= 0'),
});

// ─── DOCUMENT SCHEMAS ───
export const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  invoiceDate: z.string().min(1, 'Date required'),
  dueDate: z.string().min(1, 'Due date required'),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
});

export const quotationSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  quotationDate: z.string().min(1, 'Date required'),
  expiryDate: z.string().min(1, 'Expiry date required'),
  notes: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'At least one item required'),
});

export const returnSchema = z.object({
  salesInvoiceId: z.string().min(1, 'Invoice required'),
  customerId: z.string().min(1, 'Customer required'),
  returnDate: z.string().min(1, 'Date required'),
  reason: z.string().optional(),
  items: z.array(returnItemSchema).min(1, 'At least one item required'),
});

export const paymentSchema = z.object({
  amount: decimal.refine((v) => v > 0, 'Amount must be > 0'),
  paymentMode: z.enum(['cash', 'bank', 'upi', 'card']),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().min(1, 'Date required'),
  notes: z.string().optional(),
});

export const shareSchema = z.object({
  method: z.enum(['whatsapp', 'email']),
  recipient: z.string().min(1, 'Recipient required'),
  message: z.string().optional(),
});

// ─── TYPE EXPORTS ───
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type ReturnItemInput = z.infer<typeof returnItemSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ShareInput = z.infer<typeof shareSchema>;
