// GNT M06 — Frontend Inventory Service (ALL API calls)
// पहले raw axios था — कहीं कोई interceptor Authorization/tenant header नहीं जोड़ता
// था (सिर्फ़ apiClient जोड़ता है), यानी हर call backend से 401 पाता। अब apiClient से।
import { apiClient } from '@/core/api-client';
import {
  Product, ProductFormData, Category, Stock, StockMovement,
  Batch, Serial, StockAdjustmentForm, StockTransferForm,
  PaginatedResponse,
} from './inventory.types';

const API_BASE = '/api/v1/inventory';

export const inventoryService = {
  async getProducts(params?: Record<string, any>): Promise<PaginatedResponse<Product>> {
    const r = await apiClient.get<PaginatedResponse<Product>>(`${API_BASE}/products`, { params });
    return r.data;
  },
  async getProductById(id: string): Promise<Product> {
    const r = await apiClient.get<{ data: Product }>(`${API_BASE}/products/${id}`);
    return r.data.data;
  },
  async createProduct(payload: ProductFormData): Promise<Product> {
    const r = await apiClient.post<{ data: Product }>(`${API_BASE}/products`, payload);
    return r.data.data;
  },
  async updateProduct(id: string, payload: Partial<ProductFormData>): Promise<Product> {
    const r = await apiClient.put<{ data: Product }>(`${API_BASE}/products/${id}`, payload);
    return r.data.data;
  },
  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE}/products/${id}`);
  },
  async getProductStock(id: string, branch_id?: string): Promise<Stock[]> {
    const r = await apiClient.get<{ data: Stock[] }>(`${API_BASE}/products/${id}/stock`, { params: { branch_id } });
    return r.data.data;
  },
  async bulkImportProducts(products: ProductFormData[]): Promise<{ created: number; errors: string[] }> {
    const r = await apiClient.post<{ data: { created: number; errors: string[] } }>(`${API_BASE}/products/bulk-import`, { products });
    return r.data.data;
  },
  async getStock(params?: { branch_id?: string; product_id?: string; batch_id?: string }): Promise<Stock[]> {
    const r = await apiClient.get<{ data: Stock[] }>(`${API_BASE}/stock`, { params });
    return r.data.data;
  },
  async adjustStock(payload: StockAdjustmentForm): Promise<Stock> {
    const r = await apiClient.post<{ data: Stock }>(`${API_BASE}/stock/adjustment`, payload);
    return r.data.data;
  },
  async transferStock(payload: StockTransferForm): Promise<{ from: Stock; to: Stock }> {
    const r = await apiClient.post<{ data: { from: Stock; to: Stock } }>(`${API_BASE}/stock/transfer`, payload);
    return r.data.data;
  },
  async getStockMovements(params?: Record<string, any>): Promise<PaginatedResponse<StockMovement>> {
    const r = await apiClient.get<PaginatedResponse<StockMovement>>(`${API_BASE}/stock/movements`, { params });
    return r.data;
  },
  async getLowStock(branch_id?: string): Promise<Product[]> {
    const r = await apiClient.get<{ data: Product[] }>(`${API_BASE}/stock/low`, { params: { branch_id } });
    return r.data.data;
  },
  async checkAvailability(product_id: string, requested_qty: number, branch_id?: string): Promise<{ available: boolean; current_qty: number }> {
    const r = await apiClient.post<{ data: { available: boolean; current_qty: number } }>(`${API_BASE}/stock/check`, { product_id, requested_qty, branch_id });
    return r.data.data;
  },
  async getCategories(): Promise<Category[]> {
    const r = await apiClient.get<{ data: Category[] }>(`${API_BASE}/categories`);
    return r.data.data;
  },
  async getCategoryTree(): Promise<Category[]> {
    const r = await apiClient.get<{ data: Category[] }>(`${API_BASE}/categories/tree`);
    return r.data.data;
  },
  async createCategory(payload: { name: string; parent_id?: string; code?: string; description?: string }): Promise<Category> {
    const r = await apiClient.post<{ data: Category }>(`${API_BASE}/categories`, payload);
    return r.data.data;
  },
  async updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
    const r = await apiClient.put<{ data: Category }>(`${API_BASE}/categories/${id}`, payload);
    return r.data.data;
  },
  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE}/categories/${id}`);
  },
  async getBatches(product_id?: string, expiry_before?: string): Promise<Batch[]> {
    const r = await apiClient.get<{ data: Batch[] }>(`${API_BASE}/batches`, { params: { product_id, expiry_before } });
    return r.data.data;
  },
  async getSerials(product_id?: string, status?: string): Promise<Serial[]> {
    const r = await apiClient.get<{ data: Serial[] }>(`${API_BASE}/serials`, { params: { product_id, status } });
    return r.data.data;
  },
};
