// GNT M06 — Zustand Inventory Store
import { create } from 'zustand';
import { Product, Category, Stock, StockMovement, Batch, Serial } from '../services/inventory.types';

interface InventoryState {
  products: Product[];
  categories: Category[];
  selectedProduct: Product | null;
  stock: Stock[];
  movements: StockMovement[];
  batches: Batch[];
  serials: Serial[];
  filters: { search: string; category_id: string; branch_id: string; low_stock: boolean; page: number; limit: number; };
  loading: boolean;
  error: string | null;
  totalProducts: number;
  totalPages: number;
  setProducts: (products: Product[], total: number, totalPages: number) => void;
  setCategories: (categories: Category[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setStock: (stock: Stock[]) => void;
  setMovements: (movements: StockMovement[]) => void;
  setBatches: (batches: Batch[]) => void;
  setSerials: (serials: Serial[]) => void;
  setFilters: (filters: Partial<InventoryState['filters']>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateProductInList: (product: Product) => void;
  removeProductFromList: (id: string) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  products: [], categories: [], selectedProduct: null, stock: [], movements: [], batches: [], serials: [],
  filters: { search: '', category_id: '', branch_id: '', low_stock: false, page: 1, limit: 20 },
  loading: false, error: null, totalProducts: 0, totalPages: 0,
  setProducts: (products, total, totalPages) => set({ products, totalProducts: total, totalPages }),
  setCategories: (categories) => set({ categories }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  setStock: (stock) => set({ stock }),
  setMovements: (movements) => set({ movements }),
  setBatches: (batches) => set({ batches }),
  setSerials: (serials) => set({ serials }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  updateProductInList: (product) => set((state) => ({ products: state.products.map((p) => (p.id === product.id ? product : p)) })),
  removeProductFromList: (id) => set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
}));
