// GNT M06 — Frontend Inventory Types

export interface Product {
  id: string;
  company_id: string;
  branch_id?: string | null;
  name: string;
  code?: string | null;
  barcode?: string | null;
  hsn_code?: string | null;
  category_id?: string | null;
  category?: Category | null;
  unit?: string | null;
  alternate_unit?: string | null;
  conversion_rate?: number | null;
  sale_price?: number | null;
  purchase_price?: number | null;
  mrp?: number | null;
  gst_rate?: number | null;
  cess_rate?: number | null;
  is_gst_inclusive?: boolean;
  min_stock?: number | null;
  max_stock?: number | null;
  reorder_level?: number | null;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  stock?: Stock[];
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  parent_id?: string | null;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
  children?: Category[];
}

export interface Stock {
  id: string;
  company_id: string;
  branch_id?: string | null;
  product_id: string;
  batch_id?: string | null;
  quantity: number;
  reserved_quantity?: number;
  avg_purchase_price?: number | null;
  last_purchase_price?: number | null;
  godown_location?: string | null;
  rack_number?: string | null;
  batch?: Batch | null;
}

export interface StockMovement {
  id: string;
  company_id: string;
  product_id: string;
  batch_id?: string | null;
  branch_id?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  rate?: number | null;
  amount?: number | null;
  before_qty?: number | null;
  after_qty?: number | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  product?: Product;
}

export interface Batch {
  id: string;
  company_id: string;
  product_id: string;
  batch_number: string;
  mfg_date?: string | null;
  expiry_date?: string | null;
  quantity: number;
  remaining_qty: number;
  purchase_rate?: number | null;
  mrp?: number | null;
}

export interface Serial {
  id: string;
  company_id: string;
  product_id: string;
  batch_id?: string | null;
  serial_number: string;
  status: 'in_stock' | 'sold' | 'returned' | 'damaged';
  reference_type?: string | null;
  reference_id?: string | null;
}

export interface ProductFormData {
  name: string;
  code?: string;
  barcode?: string;
  hsn_code?: string;
  category_id?: string;
  unit?: string;
  alternate_unit?: string;
  conversion_rate?: number;
  sale_price?: number;
  purchase_price?: number;
  mrp?: number;
  gst_rate?: number;
  cess_rate?: number;
  is_gst_inclusive?: boolean;
  min_stock?: number;
  max_stock?: number;
  reorder_level?: number;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface StockAdjustmentForm {
  product_id: string;
  branch_id?: string;
  batch_id?: string;
  quantity: number;
  reason: string;
  reference?: string;
  rate?: number;
}

export interface StockTransferForm {
  product_id: string;
  from_branch_id: string;
  to_branch_id: string;
  batch_id?: string;
  quantity: number;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
