export interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  type: string;
  paymentMethodId: string;
  invoiceId?: string;
  payerName?: string;
  payerEmail?: string;
  description?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  totalAmount: string;
  paidAmount: string;
  dueAmount: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
}

export interface Refund {
  id: string;
  transactionId: string;
  amount: string;
  status: string;
  reason: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  currentBalance: string;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
