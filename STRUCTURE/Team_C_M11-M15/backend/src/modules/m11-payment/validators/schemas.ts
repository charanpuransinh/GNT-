// M11 Payment Module - Zod Validation Schemas

import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid decimal format'),
  currency: z.string().default('INR'),
  paymentMethodId: z.string().min(1, 'Payment method required'),
  invoiceId: z.string().optional(),
  bankAccountId: z.string().optional(),
  payerName: z.string().optional(),
  payerEmail: z.string().email().optional(),
  payerPhone: z.string().optional(),
  payerId: z.string().optional(),
  payerType: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(['PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED']).optional(),
  gatewayRef: z.string().optional(),
  gatewayResponse: z.record(z.any()).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const processPaymentSchema = z.object({
  gatewayRef: z.string().optional(),
  gatewayResponse: z.record(z.any()).optional(),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  customerName: z.string().min(1, 'Customer name required'),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerGstin: z.string().optional(),
  invoiceDate: z.string().datetime().or(z.date()),
  dueDate: z.string().datetime().or(z.date()),
  notes: z.string().optional(),
  terms: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  lineItems: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().min(1, 'Product name required'),
    description: z.string().optional(),
    quantity: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid quantity'),
    unitPrice: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid price'),
    taxRate: z.string().optional(),
    discountPercent: z.string().optional(),
  })).min(1, 'At least one line item required'),
});

export const updateInvoiceSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  invoiceDate: z.string().datetime().or(z.date()).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(['DRAFT','SENT','VIEWED','PARTIAL_PAID','PAID','OVERDUE','CANCELLED','WRITTEN_OFF']).optional(),
  metadata: z.record(z.any()).optional(),
});

export const createRefundSchema = z.object({
  transactionId: z.string().min(1, 'Transaction required'),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid decimal'),
  currency: z.string().default('INR'),
  reason: z.string().min(1, 'Reason required'),
  reasonCode: z.string().optional(),
});

export const updateRefundSchema = z.object({
  status: z.enum(['REQUESTED','APPROVED','REJECTED','PROCESSING','COMPLETED','FAILED']).optional(),
  gatewayRef: z.string().optional(),
  gatewayResponse: z.record(z.any()).optional(),
});

export const createBankAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name required'),
  accountNumber: z.string().min(1, 'Account number required'),
  ifscCode: z.string().optional(),
  bankName: z.string().min(1, 'Bank name required'),
  branchName: z.string().optional(),
  accountType: z.enum(['CURRENT','SAVINGS','OVERDRAFT','ESCROW']).default('CURRENT'),
  openingBalance: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  description: z.string().optional(),
});

export const updateBankAccountSchema = z.object({
  accountName: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  accountType: z.enum(['CURRENT','SAVINGS','OVERDRAFT','ESCROW']).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  description: z.string().optional(),
});

export const createReconciliationSchema = z.object({
  bankAccountId: z.string().min(1, 'Bank account required'),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  statementFileUrl: z.string().optional(),
});

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.enum(['CASH','BANK_TRANSFER','CREDIT_CARD','DEBIT_CARD','UPI','WALLET','CHEQUE','NEFT','RTGS','IMPS','INTERNATIONAL_WIRE']),
  configJson: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().default(0),
  bankAccountId: z.string().optional(),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().optional(),
  configJson: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().optional(),
  bankAccountId: z.string().optional(),
});
