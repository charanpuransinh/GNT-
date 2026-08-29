/**
 * M08 SALES & BILLING — TypeScript DTOs
 * Module: m08-sales | Team: B4-BRAVO
 */

// ─── BASE INTERFACES ───

export interface CompanyContext {
  companyId: string;
  branchId: string;
  userId: string;
}

// ─── QUOTATION ───

export interface QuotationItemDTO {
  id?: string;
  productId: string;
  quantity: number;
  rate: number;
  discountPercent?: number;
  discountAmount?: number;
  amount?: number;
  taxRate?: number;
  taxAmount?: number;
  netAmount?: number;
  hsnCode?: string;
}

export interface QuotationDTO {
  id?: string;
  companyId: string;
  branchId: string;
  customerId: string;
  quotationNumber?: string;
  quotationDate: Date | string;
  expiryDate: Date | string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  totalAmount?: number;
  totalTax?: number;
  totalDiscount?: number;
  netAmount?: number;
  roundOff?: number;
  grandTotal?: number;
  notes?: string;
  items: QuotationItemDTO[];
  createdBy?: string;
}

// ─── SALES ORDER ───

export interface SalesOrderItemDTO {
  id?: string;
  productId: string;
  quantity: number;
  rate: number;
  discountPercent?: number;
  discountAmount?: number;
  amount?: number;
  taxRate?: number;
  taxAmount?: number;
  netAmount?: number;
  deliveredQty?: number;
}

export interface SalesOrderDTO {
  id?: string;
  companyId: string;
  branchId: string;
  customerId: string;
  quotationId?: string;
  orderNumber?: string;
  orderDate: Date | string;
  deliveryDate: Date | string;
  status?: 'draft' | 'confirmed' | 'partial' | 'delivered' | 'cancelled';
  totalAmount?: number;
  totalTax?: number;
  totalDiscount?: number;
  netAmount?: number;
  roundOff?: number;
  grandTotal?: number;
  notes?: string;
  items: SalesOrderItemDTO[];
  createdBy?: string;
}

// ─── SALES INVOICE ───

export interface SalesInvoiceItemDTO {
  id?: string;
  productId: string;
  batchId?: string;
  quantity: number;
  rate: number;
  discountPercent?: number;
  discountAmount?: number;
  amount?: number;
  taxRate?: number;
  taxAmount?: number;
  netAmount?: number;
  hsnCode?: string;
}

export interface SalesInvoiceDTO {
  id?: string;
  companyId: string;
  branchId: string;
  customerId: string;
  salesOrderId?: string;
  quotationId?: string;
  invoiceNumber?: string;
  invoiceDate: Date | string;
  dueDate: Date | string;
  status?: 'draft' | 'approved' | 'posted' | 'paid' | 'cancelled';
  totalAmount?: number;
  totalTax?: number;
  totalDiscount?: number;
  netAmount?: number;
  roundOff?: number;
  grandTotal?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  amountPaid?: number;
  notes?: string;
  termsConditions?: string;
  items: SalesInvoiceItemDTO[];
  createdBy?: string;
  approvedBy?: string;
  postedBy?: string;
}

export interface InvoicePaymentDTO {
  amount: number;
  paymentMode: 'cash' | 'bank' | 'upi' | 'card';
  referenceNumber?: string;
  paymentDate: Date | string;
  notes?: string;
}

// ─── SALES RETURN ───

export interface SalesReturnItemDTO {
  id?: string;
  productId: string;
  quantity: number;
  rate: number;
  taxRate?: number;
  hsnCode?: string;
  amount?: number;
  taxAmount?: number;
  netAmount?: number;
}

export interface SalesReturnDTO {
  id?: string;
  companyId: string;
  salesInvoiceId: string;
  customerId: string;
  returnNumber?: string;
  returnDate: Date | string;
  totalAmount?: number;
  taxAmount?: number;
  netAmount?: number;
  reason?: string;
  status?: 'draft' | 'approved' | 'posted';
  items: SalesReturnItemDTO[];
}

// ─── DELIVERY CHALLAN ───

export interface DeliveryChallanItemDTO {
  id?: string;
  productId: string;
  quantity: number;
}

export interface DeliveryChallanDTO {
  id?: string;
  companyId: string;
  salesOrderId: string;
  customerId: string;
  challanNumber?: string;
  challanDate: Date | string;
  status?: 'draft' | 'delivered' | 'returned';
  totalQuantity?: number;
  notes?: string;
  items: DeliveryChallanItemDTO[];
}

// ─── PRINT & SHARE ───

export type PrintTemplate = 'thermal-2inch' | 'thermal-3inch' | 'a4';

export interface PrintRequestDTO {
  template: PrintTemplate;
  invoiceId: string;
}

export interface ShareRequestDTO {
  invoiceId: string;
  method: 'whatsapp' | 'email';
  recipient: string;
  message?: string;
}

// ─── QUERY PARAMS ───

export interface InvoiceQueryParams {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
  companyId: string;
}

export interface QuotationQueryParams {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
  companyId: string;
}

export interface OrderQueryParams {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
  companyId: string;
}

export interface ReturnQueryParams {
  customerId?: string;
  status?: string;
  page?: number;
  limit?: number;
  companyId: string;
}

export interface ChallanQueryParams {
  salesOrderId?: string;
  status?: string;
  page?: number;
  limit?: number;
  companyId: string;
}

// ─── EVENT PAYLOADS ───

export interface SalesInvoiceCreatedEvent {
  invoiceId: string;
  customerId: string;
  totalAmount: number;
  taxAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    rate: number;
    netAmount: number;
  }>;
  grandTotal: number;
  companyId: string;
  branchId: string;
}

export interface SalesQuotationConvertedEvent {
  quotationId: string;
  orderId: string;
  customerId: string;
  companyId: string;
}

export interface SalesReturnCreatedEvent {
  returnId: string;
  invoiceId: string;
  customerId: string;
  netAmount: number;
  companyId: string;
}

export interface PaymentReceivedEvent {
  invoiceId: string;
  amount: number;
  paymentMode: string;
  companyId: string;
}
