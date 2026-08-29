// GNT M06 — Inventory Types & DTOs
// Module: मा आदिशक्ति | Brand: RAKSHA

export interface ProductDTO {
  id?: string;
  company_id: string;
  branch_id?: string | null;
  name: string;
  code?: string | null;
  barcode?: string | null;
  hsn_code?: string | null;
  category_id?: string | null;
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
  created_at?: Date;
  updated_at?: Date;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CategoryDTO {
  id?: string;
  company_id: string;
  name: string;
  parent_id?: string | null;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  children?: CategoryDTO[];
}

export interface StockDTO {
  id?: string;
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
  created_at?: Date;
  updated_at?: Date;
}

export interface StockMovementDTO {
  id?: string;
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
  created_at?: Date;
}

export interface BatchDTO {
  id?: string;
  company_id: string;
  product_id: string;
  batch_number: string;
  mfg_date?: Date | null;
  expiry_date?: Date | null;
  quantity: number;
  remaining_qty: number;
  purchase_rate?: number | null;
  mrp?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface SerialDTO {
  id?: string;
  company_id: string;
  product_id: string;
  batch_id?: string | null;
  serial_number: string;
  status?: 'in_stock' | 'sold' | 'returned' | 'damaged';
  reference_type?: string | null;
  reference_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface StockAdjustmentInput {
  product_id: string;
  branch_id?: string | null;
  batch_id?: string | null;
  quantity: number;
  reason: string;
  reference?: string | null;
  rate?: number | null;
}

export interface StockTransferInput {
  product_id: string;
  from_branch_id: string;
  to_branch_id: string;
  batch_id?: string | null;
  quantity: number;
  notes?: string | null;
}

export interface AvailabilityCheckInput {
  product_id: string;
  branch_id?: string | null;
  requested_qty: number;
}

export interface AvailabilityResult {
  available: boolean;
  current_qty: number;
  requested_qty: number;
  product_id: string;
  branch_id?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilter {
  search?: string;
  category_id?: string;
  branch_id?: string;
  page?: number;
  limit?: number;
  low_stock?: boolean;
  status?: string;
}

export interface StockFilter {
  branch_id?: string;
  product_id?: string;
  batch_id?: string;
}

export interface MovementFilter {
  product_id?: string;
  branch_id?: string;
  from_date?: Date;
  to_date?: Date;
  reference_type?: string;
  page?: number;
  limit?: number;
}
