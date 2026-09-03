// ============================================================================
// M08 SALES — Frontend Types (ROUGH, टास्क #024 अनुवर्ती)
// ⚠️ backend के decimalString fields — numbers string रूप में भेजे जाते हैं
// ============================================================================

export interface Customer {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
}

export interface SalesProduct {
  id: string;
  name: string;
}

export interface SalesItemInput {
  productId: string;
  quantity: string;
  rate: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  status?: string;
  grandTotal?: string;
  paymentStatus?: string;
}

export interface Quotation {
  id: string;
  quotationNumber?: string;
  status?: string;
  grandTotal?: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta?: { total?: number };
}
