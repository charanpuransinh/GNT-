/**
 * M08 SALES & BILLING — Zod Validation Schemas
 * Module: m08-sales | Team: B4-BRAVO
 */

import { z } from 'zod';

// ─── SHARED ───

const decimalString = z.union([z.string(), z.number()]).transform((v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) throw new Error('Invalid decimal');
  return n;
});

const uuid = z.string().uuid();

// ─── QUOTATION ───

export const quotationItemSchema = z.object({
  id: uuid.optional(),
  productId: uuid,
  quantity: decimalString.refine((v) => v > 0, 'Quantity must be > 0'),
  rate: decimalString.refine((v) => v >= 0, 'Rate must be >= 0'),
  discountPercent: decimalString.optional().default(0),
  discountAmount: decimalString.optional().default(0),
  amount: decimalString.optional(),
  taxRate: decimalString.optional().default(0),
  taxAmount: decimalString.optional().default(0),
  netAmount: decimalString.optional(),
  hsnCode: z.string().max(50).optional(),
});

export const quotationSchema = z.object({
  id: uuid.optional(),
  branchId: uuid,
  customerId: uuid,
  quotationNumber: z.string().max(100).optional(),
  quotationDate: z.union([z.string().datetime(), z.date()]),
  expiryDate: z.union([z.string().datetime(), z.date()]),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'converted']).optional().default('draft'),
  totalAmount: decimalString.optional(),
  totalTax: decimalString.optional(),
  totalDiscount: decimalString.optional(),
  netAmount: decimalString.optional(),
  roundOff: decimalString.optional().default(0),
  grandTotal: decimalString.optional(),
  notes: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'At least one item required'),
  createdBy: uuid.optional(),
});

// ─── SALES ORDER ───

export const salesOrderItemSchema = z.object({
  id: uuid.optional(),
  productId: uuid,
  quantity: decimalString.refine((v) => v > 0, 'Quantity must be > 0'),
  rate: decimalString.refine((v) => v >= 0, 'Rate must be >= 0'),
  discountPercent: decimalString.optional().default(0),
  discountAmount: decimalString.optional().default(0),
  amount: decimalString.optional(),
  taxRate: decimalString.optional().default(0),
  taxAmount: decimalString.optional().default(0),
  netAmount: decimalString.optional(),
  deliveredQty: decimalString.optional().default(0),
});

export const salesOrderSchema = z.object({
  id: uuid.optional(),
  branchId: uuid,
  customerId: uuid,
  quotationId: uuid.optional(),
  orderNumber: z.string().max(100).optional(),
  orderDate: z.union([z.string().datetime(), z.date()]),
  deliveryDate: z.union([z.string().datetime(), z.date()]),
  status: z.enum(['draft', 'confirmed', 'partial', 'delivered', 'cancelled']).optional().default('draft'),
  totalAmount: decimalString.optional(),
  totalTax: decimalString.optional(),
  totalDiscount: decimalString.optional(),
  netAmount: decimalString.optional(),
  roundOff: decimalString.optional().default(0),
  grandTotal: decimalString.optional(),
  notes: z.string().optional(),
  items: z.array(salesOrderItemSchema).min(1, 'At least one item required'),
  createdBy: uuid.optional(),
});

// ─── SALES INVOICE ───

export const salesInvoiceItemSchema = z.object({
  id: uuid.optional(),
  productId: uuid,
  batchId: uuid.optional(),
  quantity: decimalString.refine((v) => v > 0, 'Quantity must be > 0'),
  rate: decimalString.refine((v) => v >= 0, 'Rate must be >= 0'),
  discountPercent: decimalString.optional().default(0),
  discountAmount: decimalString.optional().default(0),
  amount: decimalString.optional(),
  taxRate: decimalString.optional().default(0),
  taxAmount: decimalString.optional().default(0),
  netAmount: decimalString.optional(),
  hsnCode: z.string().max(50).optional(),
});

export const salesInvoiceSchema = z.object({
  id: uuid.optional(),
  branchId: uuid,
  customerId: uuid,
  salesOrderId: uuid.optional(),
  quotationId: uuid.optional(),
  invoiceNumber: z.string().max(100).optional(),
  invoiceDate: z.union([z.string().datetime(), z.date()]),
  dueDate: z.union([z.string().datetime(), z.date()]),
  status: z.enum(['draft', 'approved', 'posted', 'paid', 'cancelled']).optional().default('draft'),
  totalAmount: decimalString.optional(),
  totalTax: decimalString.optional(),
  totalDiscount: decimalString.optional(),
  netAmount: decimalString.optional(),
  roundOff: decimalString.optional().default(0),
  grandTotal: decimalString.optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional().default('unpaid'),
  amountPaid: decimalString.optional().default(0),
  notes: z.string().optional(),
  termsConditions: z.string().optional(),
  items: z.array(salesInvoiceItemSchema).min(1, 'At least one item required'),
  createdBy: uuid.optional(),
  approvedBy: uuid.optional(),
  postedBy: uuid.optional(),
});

export const invoicePaymentSchema = z.object({
  amount: decimalString.refine((v) => v > 0, 'Amount must be > 0'),
  paymentMode: z.enum(['cash', 'bank', 'upi', 'card']),
  referenceNumber: z.string().optional(),
  paymentDate: z.union([z.string().datetime(), z.date()]),
  notes: z.string().optional(),
});

// ─── SALES RETURN ───

export const salesReturnItemSchema = z.object({
  id: uuid.optional(),
  productId: uuid,
  quantity: decimalString.refine((v) => v > 0, 'Quantity must be > 0'),
  rate: decimalString.refine((v) => v >= 0, 'Rate must be >= 0'),
  amount: decimalString.optional(),
  taxAmount: decimalString.optional(),
  netAmount: decimalString.optional(),
});

export const salesReturnSchema = z.object({
  id: uuid.optional(),
  salesInvoiceId: uuid,
  customerId: uuid,
  returnNumber: z.string().max(100).optional(),
  returnDate: z.union([z.string().datetime(), z.date()]),
  totalAmount: decimalString.optional(),
  taxAmount: decimalString.optional(),
  netAmount: decimalString.optional(),
  reason: z.string().optional(),
  status: z.enum(['draft', 'approved', 'posted']).optional().default('draft'),
  items: z.array(salesReturnItemSchema).min(1, 'At least one item required'),
});

// ─── DELIVERY CHALLAN ───

export const deliveryChallanItemSchema = z.object({
  id: uuid.optional(),
  productId: uuid,
  quantity: decimalString.refine((v) => v > 0, 'Quantity must be > 0'),
});

export const deliveryChallanSchema = z.object({
  id: uuid.optional(),
  salesOrderId: uuid,
  customerId: uuid,
  challanNumber: z.string().max(100).optional(),
  challanDate: z.union([z.string().datetime(), z.date()]),
  status: z.enum(['draft', 'delivered', 'returned']).optional().default('draft'),
  totalQuantity: decimalString.optional(),
  notes: z.string().optional(),
  items: z.array(deliveryChallanItemSchema).min(1, 'At least one item required'),
});

// ─── PRINT & SHARE ───

export const printRequestSchema = z.object({
  template: z.enum(['thermal-2inch', 'thermal-3inch', 'a4']),
  invoiceId: uuid,
});

export const shareRequestSchema = z.object({
  invoiceId: uuid,
  method: z.enum(['whatsapp', 'email']),
  recipient: z.string().min(1),
  message: z.string().optional(),
});

// ─── QUERY PARAMS ───

export const invoiceQuerySchema = z.object({
  // query में companyId controller खुद tenant से जोड़ता है — client से नहीं आता
  companyId: uuid.optional(),
  customerId: uuid.optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const quotationQuerySchema = z.object({
  companyId: uuid.optional(),
  customerId: uuid.optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const orderQuerySchema = z.object({
  companyId: uuid.optional(),
  customerId: uuid.optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const returnQuerySchema = z.object({
  companyId: uuid.optional(),
  customerId: uuid.optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const challanQuerySchema = z.object({
  companyId: uuid.optional(),
  salesOrderId: uuid.optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

// ─── TYPE EXPORTS ───
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;
export type SalesOrderInput = z.infer<typeof salesOrderSchema>;
export type SalesInvoiceItemInput = z.infer<typeof salesInvoiceItemSchema>;
export type SalesInvoiceInput = z.infer<typeof salesInvoiceSchema>;
export type InvoicePaymentInput = z.infer<typeof invoicePaymentSchema>;
export type SalesReturnItemInput = z.infer<typeof salesReturnItemSchema>;
export type SalesReturnInput = z.infer<typeof salesReturnSchema>;
export type DeliveryChallanItemInput = z.infer<typeof deliveryChallanItemSchema>;
export type DeliveryChallanInput = z.infer<typeof deliveryChallanSchema>;
export type PrintRequestInput = z.infer<typeof printRequestSchema>;
export type ShareRequestInput = z.infer<typeof shareRequestSchema>;
