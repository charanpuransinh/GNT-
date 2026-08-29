// GNT M06 — Zustand Async Actions (Thunks)
import { useInventoryStore } from './inventory.store';
import { inventoryService } from '../services/inventory.service';
import { ProductFormData, StockAdjustmentForm, StockTransferForm } from '../services/inventory.types';

const store = useInventoryStore.getState();

export const inventoryActions = {
  async fetchProducts() {
    store.setLoading(true); store.setError(null);
    try {
      const { filters } = useInventoryStore.getState();
      const result = await inventoryService.getProducts(filters);
      store.setProducts(result.data, result.total, result.totalPages);
    } catch (err: any) { store.setError(err.message || 'Failed to fetch products'); }
    finally { store.setLoading(false); }
  },
  async fetchProductById(id: string) {
    store.setLoading(true);
    try {
      const product = await inventoryService.getProductById(id);
      store.setSelectedProduct(product);
      const stock = await inventoryService.getProductStock(id);
      store.setStock(stock);
    } catch (err: any) { store.setError(err.message); }
    finally { store.setLoading(false); }
  },
  async createProduct(payload: ProductFormData) {
    store.setLoading(true);
    try { const product = await inventoryService.createProduct(payload); store.updateProductInList(product); return product; }
    catch (err: any) { store.setError(err.message); throw err; }
    finally { store.setLoading(false); }
  },
  async updateProduct(id: string, payload: Partial<ProductFormData>) {
    store.setLoading(true);
    try { const product = await inventoryService.updateProduct(id, payload); store.updateProductInList(product); return product; }
    catch (err: any) { store.setError(err.message); throw err; }
    finally { store.setLoading(false); }
  },
  async deleteProduct(id: string) {
    store.setLoading(true);
    try { await inventoryService.deleteProduct(id); store.removeProductFromList(id); }
    catch (err: any) { store.setError(err.message); throw err; }
    finally { store.setLoading(false); }
  },
  async fetchCategories() {
    try { const categories = await inventoryService.getCategories(); store.setCategories(categories); }
    catch (err: any) { store.setError(err.message); }
  },
  async fetchCategoryTree() {
    try { const tree = await inventoryService.getCategoryTree(); store.setCategories(tree); }
    catch (err: any) { store.setError(err.message); }
  },
  async adjustStock(payload: StockAdjustmentForm) {
    store.setLoading(true);
    try {
      const stock = await inventoryService.adjustStock(payload);
      const updatedStock = await inventoryService.getProductStock(payload.product_id, payload.branch_id);
      store.setStock(updatedStock); return stock;
    } catch (err: any) { store.setError(err.message); throw err; }
    finally { store.setLoading(false); }
  },
  async transferStock(payload: StockTransferForm) {
    store.setLoading(true);
    try { const result = await inventoryService.transferStock(payload); return result; }
    catch (err: any) { store.setError(err.message); throw err; }
    finally { store.setLoading(false); }
  },
  async fetchMovements(params?: Record<string, any>) {
    try { const result = await inventoryService.getStockMovements(params); store.setMovements(result.data); }
    catch (err: any) { store.setError(err.message); }
  },
  async fetchLowStock() {
    store.setLoading(true);
    try { const { filters } = useInventoryStore.getState(); const items = await inventoryService.getLowStock(filters.branch_id); store.setProducts(items, items.length, 1); }
    catch (err: any) { store.setError(err.message); }
    finally { store.setLoading(false); }
  },
};
