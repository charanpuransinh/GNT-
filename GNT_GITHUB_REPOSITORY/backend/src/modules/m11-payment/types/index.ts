// M11 Payment Module - TypeScript Types
// GNT MASTER BLUEPRINT V2 - Team C Module M11

import { Decimal } from '@prisma/client/runtime/library';

// ==================== BASE INTERFACES ====================
export interface TenantScoped {
  tenantId: string;
}

export interface Auditable {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

// ==================== PAYMENT METHOD ====================
export interface PaymentMethod extends TenantScoped, Auditable {
  id: string;
  name: string;
  type: PaymentMethodType;
  configJson: Record<string, unknown> | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  bankAccountId: string | null;
}

export type PaymentMethodType = 
  | 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' 
  | 'UPI' | 'WALLET' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'IMPS' 
  | 'INTERNATIONAL_WIRE';

export interface CreatePaymentMethodDto {
  name: string;
  type: PaymentMethodType;
  configJson?: Record<string, unknown>;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
  bankAccountId?: string;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  configJson?: Record<string, unknown>;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
  bankAccountId?: string;
}

// ==================== PAYMENT TRANSACTION ====================
export interface PaymentTransaction extends TenantScoped, Auditable {
  id: string;
  amount: Decimal;
  currency: string;
  status: PaymentStatus;
  type: TransactionType;
  paymentMethodId: string;
  invoiceId: string | null;
  bankAccountId: string | null;
  payerName: string | null;
  payerEmail: string | null;
  payerPhone: string | null;
  payerId: string | null;
  payerType: string | null;
  gatewayRef: string | null;
  gatewayResponse: Record<string, unknown> | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  scheduleId: string | null;
}

export type PaymentStatus = 
  'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' 
  | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export type TransactionType = 
  'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'FEE' 
  | 'CHARGEBACK' | 'TRANSFER';

export interface CreatePaymentDto {
  amount: string; // Decimal as string
  currency?: string;
  paymentMethodId: string;
  invoiceId?: string;
  bankAccountId?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  payerId?: string;
  payerType?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePaymentDto {
  status?: PaymentStatus;
  gatewayRef?: string;
  gatewayResponse?: Record<string, unknown>;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentFilter extends PaginatedQuery {
  status?: PaymentStatus;
  type?: TransactionType;
  paymentMethodId?: string;
  invoiceId?: string;
  payerId?: string;
  minAmount?: string;
  maxAmount?: string;
}

// ==================== PAYMENT SCHEDULE ====================
export interface PaymentSchedule extends TenantScoped, Auditable {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  interval: number;
  startDate: Date;
  endDate: Date | null;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  amount: Decimal;
  currency: string;
  payerId: string | null;
  payerType: string | null;
  paymentMethodId: string | null;
  bankAccountId: string | null;
  isActive: boolean;
  runCount: number;
  maxRuns: number | null;
}

export interface CreateScheduleDto {
  name: string;
  description?: string;
  frequency: string;
  interval?: number;
  startDate: Date;
  endDate?: Date;
  amount: string;
  currency?: string;
  payerId?: string;
  payerType?: string;
  paymentMethodId?: string;
  bankAccountId?: string;
  isActive?: boolean;
  maxRuns?: number;
}

// ==================== INVOICE ====================
export interface Invoice extends TenantScoped, Auditable {
  id: string;
  invoiceNumber: string;
  series: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerGstin: string | null;
  subTotal: Decimal;
  taxAmount: Decimal;
  discountAmount: Decimal;
  totalAmount: Decimal;
  paidAmount: Decimal;
  dueAmount: Decimal;
  currency: string;
  taxRate: Decimal | null;
  invoiceDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  status: InvoiceStatus;
  notes: string | null;
  terms: string | null;
  metadata: Record<string, unknown> | null;
  lineItems: InvoiceLineItem[];
}

export type InvoiceStatus = 
  'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIAL_PAID' 
  | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'WRITTEN_OFF';

export interface InvoiceLineItem {
  id: string;
  tenantId: string;
  invoiceId: string;
  productId: string | null;
  productName: string;
  description: string | null;
  quantity: Decimal;
  unitPrice: Decimal;
  taxRate: Decimal | null;
  taxAmount: Decimal;
  discountPercent: Decimal | null;
  discountAmount: Decimal;
  totalAmount: Decimal;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateInvoiceDto {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerGstin?: string;
  invoiceDate: Date;
  dueDate: Date;
  notes?: string;
  terms?: string;
  metadata?: Record<string, unknown>;
  lineItems: CreateLineItemDto[];
}

export interface CreateLineItemDto {
  productId?: string;
  productName: string;
  description?: string;
  quantity: string;
  unitPrice: string;
  taxRate?: string;
  discountPercent?: string;
}

export interface UpdateInvoiceDto {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  notes?: string;
  terms?: string;
  status?: InvoiceStatus;
  metadata?: Record<string, unknown>;
}

export interface InvoiceFilter extends PaginatedQuery {
  status?: InvoiceStatus;
  customerId?: string;
  minAmount?: string;
  maxAmount?: string;
  isOverdue?: boolean;
}

// ==================== REFUND ====================
export interface Refund extends TenantScoped, Auditable {
  id: string;
  transactionId: string;
  amount: Decimal;
  currency: string;
  status: RefundStatus;
  reason: string;
  reasonCode: string | null;
  gatewayRef: string | null;
  gatewayResponse: Record<string, unknown> | null;
  approvedBy: string | null;
  approvedAt: Date | null;
}

export type RefundStatus = 
  'REQUESTED' | 'APPROVED' | 'REJECTED' 
  | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CreateRefundDto {
  transactionId: string;
  amount: string;
  currency?: string;
  reason: string;
  reasonCode?: string;
}

export interface UpdateRefundDto {
  status?: RefundStatus;
  gatewayRef?: string;
  gatewayResponse?: Record<string, unknown>;
}

export interface RefundFilter extends PaginatedQuery {
  status?: RefundStatus;
  transactionId?: string;
}

// ==================== BANK ACCOUNT ====================
export interface BankAccount extends TenantScoped, Auditable {
  id: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string | null;
  bankName: string;
  branchName: string | null;
  accountType: BankAccountType;
  openingBalance: Decimal;
  currentBalance: Decimal;
  isActive: boolean;
  isDefault: boolean;
  description: string | null;
}

export type BankAccountType = 'CURRENT' | 'SAVINGS' | 'OVERDRAFT' | 'ESCROW';

export interface CreateBankAccountDto {
  accountName: string;
  accountNumber: string;
  ifscCode?: string;
  bankName: string;
  branchName?: string;
  accountType?: BankAccountType;
  openingBalance?: string;
  isActive?: boolean;
  isDefault?: boolean;
  description?: string;
}

export interface UpdateBankAccountDto {
  accountName?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  accountType?: BankAccountType;
  isActive?: boolean;
  isDefault?: boolean;
  description?: string;
}

// ==================== RECONCILIATION ====================
export interface Reconciliation extends TenantScoped, Auditable {
  id: string;
  bankAccountId: string;
  startDate: Date;
  endDate: Date;
  systemCredits: Decimal;
  systemDebits: Decimal;
  systemBalance: Decimal;
  statementCredits: Decimal;
  statementDebits: Decimal;
  statementBalance: Decimal;
  variance: Decimal;
  status: ReconciliationStatus;
  statementFileUrl: string | null;
  items: ReconciliationItem[];
}

export type ReconciliationStatus = 
  'PENDING' | 'MATCHED' | 'PARTIAL_MATCH' 
  | 'UNMATCHED' | 'RESOLVED';

export interface ReconciliationItem {
  id: string;
  tenantId: string;
  reconciliationId: string;
  transactionId: string | null;
  statementDate: Date;
  statementDesc: string;
  statementAmount: Decimal;
  statementType: string;
  isMatched: boolean;
  matchConfidence: Decimal | null;
  varianceAmount: Decimal | null;
  resolutionNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateReconciliationDto {
  bankAccountId: string;
  startDate: Date;
  endDate: Date;
  statementFileUrl?: string;
}

export interface UpdateReconciliationItemDto {
  transactionId?: string;
  isMatched?: boolean;
  matchConfidence?: string;
  varianceAmount?: string;
  resolutionNotes?: string;
}

// ==================== LEDGER ====================
export interface LedgerEntry extends TenantScoped, Auditable {
  id: string;
  transactionId: string;
  accountCode: string;
  debitAmount: Decimal;
  creditAmount: Decimal;
  narration: string;
  entryDate: Date;
  fiscalYearId: string | null;
}

// ==================== DASHBOARD / REPORTS ====================
export interface PaymentDashboardStats {
  totalRevenue: Decimal;
  totalPending: Decimal;
  totalOverdue: Decimal;
  totalRefunded: Decimal;
  transactionCount: number;
  successRate: number;
  methodBreakdown: { method: string; amount: Decimal; count: number }[];
  dailyTrend: { date: string; amount: Decimal }[];
}

export interface InvoiceDashboardStats {
  totalInvoiced: Decimal;
  totalPaid: Decimal;
  totalOverdue: Decimal;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
  agingReport: { bucket: string; amount: Decimal; count: number }[];
}

// ==================== EVENT PAYLOADS ====================
export interface PaymentCompletedEvent {
  transactionId: string;
  tenantId: string;
  amount: string;
  currency: string;
  paymentMethodId: string;
  invoiceId?: string;
  payerId?: string;
  payerType?: string;
  timestamp: Date;
}

export interface InvoiceCreatedEvent {
  invoiceId: string;
  tenantId: string;
  invoiceNumber: string;
  customerId: string;
  totalAmount: string;
  dueDate: Date;
  timestamp: Date;
}

export interface RefundRequestedEvent {
  refundId: string;
  tenantId: string;
  transactionId: string;
  amount: string;
  reason: string;
  timestamp: Date;
}
