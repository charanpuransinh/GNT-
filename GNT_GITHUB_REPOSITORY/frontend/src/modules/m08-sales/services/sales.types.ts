/**
 * M08 SALES & BILLING — Frontend DTOs
 * Module: m08-sales | Team: B4-BRAVO
 */

// ─── SHARED ───
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── QUOTATION ───
export interface QuotationItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  discountAmount?: number;
  amount?: number;
  taxRate: number;
  taxAmount?: number;
  netAmount?: number;
  hsnCode?: string;
}

export interface Quotation {
  id?: string;
  companyId: string;
  branchId: string;
  customerId: string;
  customerName?: string;
  quotationNumber?: string;
  quotationDate: string;
  expiryDate: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  totalAmount?: number;
  totalTax?: number;
  totalDiscount?: number;
  netAmount?: number;
  roundOff?: number;
  grandTotal?: number;
  notes?: string;
  items: QuotationItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── SALES ORDER ───
export interface SalesOrderItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  discountAmount?: number;
  amount?: number;
  taxRate: number;
  taxAmount?: number;
  netAmount?: number;
  deliveredQty?: number;
}

export interface SalesOrder {
  id?: string;
  companyId: string;
  branchId: string;
  customerId: string;
  customerName?: string;
  quotationId?: string;
  orderNumber?: string;
  orderDate: string;
  deliveryDate: string;
  status: 'draft' | 'confirmed' | 'partial' | 'delivered' | 'cancelled';
  totalAmount?: number;
  totalTax?: number;
  totalDiscount?: number;
  netAmount?: number;
  roundOff?: number;
  grandTotal?: number;
  notes?: string;
  items: SalesOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── SALES INVOICE ───
export interface SalesInvoiceItem {
  id?: string;
  productId: string;
  productName?: string;
  batchId?: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  discountAmount?: number;
  amount?: number;
  taxRate: number;
  taxAmount?: number;
  netAmount?: number;
  hsnCode?: string;
}

export interface SalesInvoice {
  id?: string;
  companyId: string;
  branchId: string;
  customerId: string;
  customerName?: string;
  salesOrderId?: string;
  quotationId?: string;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'approved' | 'posted' | 'paid' | 'cancelled';
  totalAmount?: number;
  totalTax?: number;
  totalDiscount?: number;
  netAmount?: number;
  roundOff?: number;
  grandTotal?: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  amountPaid?: number;
  notes?: string;
  termsConditions?: string;
  items: SalesInvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoicePayment {
  amount: number;
  paymentMode: 'cash' | 'bank' | 'upi' | 'card';
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
}

// ─── SALES RETURN ───
export interface SalesReturnItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  rate: number;
  amount?: number;
  taxAmount?: number;
  netAmount?: number;
}

export interface SalesReturn {
  id?: string;
  companyId: string;
  salesInvoiceId: string;
  customerId: string;
  customerName?: string;
  returnNumber?: string;
  returnDate: string;
  totalAmount?: number;
  taxAmount?: number;
  netAmount?: number;
  reason?: string;
  status: 'draft' | 'approved' | 'posted';
  items: SalesReturnItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── DELIVERY CHALLAN ───
export interface DeliveryChallanItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
}

export interface DeliveryChallan {
  id?: string;
  companyId: string;
  salesOrderId: string;
  customerId: string;
  customerName?: string;
  challanNumber?: string;
  challanDate: string;
  status: 'draft' | 'delivered' | 'returned';
  totalQuantity?: number;
  notes?: string;
  items: DeliveryChallanItem[];
  createdAt?: string;
}

// ─── PRINT & SHARE ───
export type PrintTemplate = 'thermal-2inch' | 'thermal-3inch' | 'a4';

export interface PrintRequest {
  template: PrintTemplate;
  invoiceId: string;
}

export interface ShareRequest {
  invoiceId: string;
  method: 'whatsapp' | 'email';
  recipient: string;
  message?: string;
}

// ─── CUSTOMER ───
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  creditLimit?: number;
  outstandingAmount?: number;
}

// ─── QUERY PARAMS ───
export interface InvoiceQuery {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

export interface QuotationQuery {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface OrderQuery {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ReturnQuery {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
}
