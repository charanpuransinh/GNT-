// GNT M06 — Frontend Inventory Service (ALL API calls)
import axios from 'axios';
import {
  Product, ProductFormData, Category, Stock, StockMovement,
  Batch, Serial, StockAdjustmentForm, StockTransferForm,
  PaginatedResponse,
} from './inventory.types';

const API_BASE = '/api/v1/inventory';

export const inventoryService = {
  async getProducts(params?: Record<string, any>): Promise<PaginatedResponse<Product>> {
    const { data } = await axios.get(`${API_BASE}/products`, { params });
    return data;
  },
  async getProductById(id: string): Promise<Product> {
    const { data } = await axios.get(`${API_BASE}/products/${id}`);
    return data.data;
  },
  async createProduct(payload: ProductFormData): Promise<Product> {
    const { data } = await axios.post(`${API_BASE}/products`, payload);
    return data.data;
  },
  async updateProduct(id: string, payload: Partial<ProductFormData>): Promise<Product> {
    const { data } = await axios.put(`${API_BASE}/products/${id}`, payload);
    return data.data;
  },
  async deleteProduct(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/products/${id}`);
  },
  async getProductStock(id: string, branch_id?: string): Promise<Stock[]> {
    const { data } = await axios.get(`${API_BASE}/products/${id}/stock`, { params: { branch_id } });
    return data.data;
  },
  async bulkImportProducts(products: ProductFormData[]): Promise<{ created: number; errors: string[] }> {
    const { data } = await axios.post(`${API_BASE}/products/bulk-import`, { products });
    return data.data;
  },
  async getStock(params?: { branch_id?: string; product_id?: string; batch_id?: string }): Promise<Stock[]> {
    const { data } = await axios.get(`${API_BASE}/stock`, { params });
    return data.data;
  },
  async adjustStock(payload: StockAdjustmentForm): Promise<Stock> {
    const { data } = await axios.post(`${API_BASE}/stock/adjustment`, payload);
    return data.data;
  },
  async transferStock(payload: StockTransferForm): Promise<{ from: Stock; to: Stock }> {
    const { data } = await axios.post(`${API_BASE}/stock/transfer`, payload);
    return data.data;
  },
  async getStockMovements(params?: Record<string, any>): Promise<PaginatedResponse<StockMovement>> {
    const { data } = await axios.get(`${API_BASE}/stock/movements`, { params });
    return data;
  },
  async getLowStock(branch_id?: string): Promise<Product[]> {
    const { data } = await axios.get(`${API_BASE}/stock/low`, { params: { branch_id } });
    return data.data;
  },
  async checkAvailability(product_id: string, requested_qty: number, branch_id?: string): Promise<{ available: boolean; current_qty: number }> {
    const { data } = await axios.post(`${API_BASE}/stock/check`, { product_id, requested_qty, branch_id });
    return data.data;
  },
  async getCategories(): Promise<Category[]> {
    const { data } = await axios.get(`${API_BASE}/categories`);
    return data.data;
  },
  async getCategoryTree(): Promise<Category[]> {
    const { data } = await axios.get(`${API_BASE}/categories/tree`);
    return data.data;
  },
  async createCategory(payload: { name: string; parent_id?: string; code?: string; description?: string }): Promise<Category> {
    const { data } = await axios.post(`${API_BASE}/categories`, payload);
    return data.data;
  },
  async updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
    const { data } = await axios.put(`${API_BASE}/categories/${id}`, payload);
    return data.data;
  },
  async deleteCategory(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/categories/${id}`);
  },
  async getBatches(product_id?: string, expiry_before?: string): Promise<Batch[]> {
    const { data } = await axios.get(`${API_BASE}/batches`, { params: { product_id, expiry_before } });
    return data.data;
  },
  async getSerials(product_id?: string, status?: string): Promise<Serial[]> {
    const { data } = await axios.get(`${API_BASE}/serials`, { params: { product_id, status } });
    return data.data;
  },
};
