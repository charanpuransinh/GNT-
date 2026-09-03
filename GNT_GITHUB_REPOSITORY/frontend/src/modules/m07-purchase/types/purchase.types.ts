// ============================================================================
// M07 PURCHASE — Frontend Types (ROUGH, टास्क #024 अनुवर्ती)
// ============================================================================

export interface Supplier {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
}

export interface PurchaseProduct {
  id: string;
  name: string;
}

export interface PurchaseItemInput {
  product_id: string;
  quantity: number;
  rate: number;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  invoice_date?: string;
  supplier_id: string;
  total_amount?: number;
  status?: string;
  created_at?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number?: string;
  order_number?: string;
  supplier_id: string;
  total_amount?: number;
  status?: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta?: { total?: number };
}

export interface DetailResponse<T> {
  success: boolean;
  data: T;
}
