// ============================================================================
// M06 INVENTORY — Frontend Types (टास्क #024-अनुवर्ती, ROUGH)
// backend के असली response shapes के हिसाब से (controllers देखकर)
// ============================================================================

export interface Product {
  id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  hsn_code: string | null;
  category_id: string | null;
  unit: string | null;
  sale_price: number | null;
  purchase_price: number | null;
  mrp: number | null;
  gst_rate: number | null;
  min_stock: number | null;
  max_stock: number | null;
  reorder_level: number | null;
  is_active: boolean;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  meta?: { total?: number };
}

export interface ProductDetailResponse {
  success: boolean;
  data: Product;
}

export interface Category {
  id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
  children?: Category[];
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
}

export interface StockItem {
  id?: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  quantity: number;
  branch_id?: string | null;
  branch_name?: string | null;
}

export interface LowStockItem {
  id: string;
  product_id?: string;
  name?: string;
  product_name?: string;
  quantity: number;
  reorder_level?: number;
  min_stock?: number;
}

export interface LowStockResponse {
  success: boolean;
  data: LowStockItem[];
}

export interface Branch {
  id: string;
  name: string;
}
