import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '../state/inventory.store';
import { inventoryActions } from '../state/inventory.actions';
import { ProductCard } from '../components/ProductCard';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { ItemEntryDrawer } from './ItemEntryDrawer';
import { Product } from '../services/inventory.types';

export const ItemListPage: React.FC = () => {
  const { products, loading, error, filters, totalProducts, totalPages } = useInventoryStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  useEffect(() => { inventoryActions.fetchProducts(); }, [filters.page, filters.limit, filters.search, filters.category_id, filters.low_stock]);

  const handleSearch = (search: string) => { useInventoryStore.getState().setFilters({ search, page: 1 }); };
  const handleScan = (barcode: string) => { handleSearch(barcode); };
  const handleEdit = (product: Product) => { setEditProduct(product); setDrawerOpen(true); };
  const handleDelete = async (id: string) => { if (confirm('Are you sure you want to delete this product?')) { await inventoryActions.deleteProduct(id); } };
  const handleSave = async () => { setDrawerOpen(false); setEditProduct(null); inventoryActions.fetchProducts(); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6" style={{ fontFamily: 'Inter' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-[#0F172A]">Inventory Items</h1><p className="text-[#64748B] text-sm mt-1">{totalProducts} products found</p></div>
          <button onClick={() => { setEditProduct(null); setDrawerOpen(true); }} className="px-5 py-2.5 bg-[#2563EB] text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition">+ Add Product</button>
        </div>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <BarcodeScanner onScan={handleScan} placeholder="Search by barcode..." />
          <input type="text" placeholder="Search by name or code..." className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" value={filters.search} onChange={e => handleSearch(e.target.value)} />
          <select className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm bg-white" value={filters.category_id} onChange={e => useInventoryStore.getState().setFilters({ category_id: e.target.value, page: 1 })}>
            <option value="">All Categories</option>
            {useInventoryStore.getState().categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        {loading && <div className="text-center py-12 text-[#64748B]">Loading...</div>}
        {error && <div className="text-center py-12 text-[#DC2626]">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (<ProductCard key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} />))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => useInventoryStore.getState().setFilters({ page })} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filters.page === page ? 'bg-[#2563EB] text-white' : 'bg-white text-[#0F172A] border border-[#E2E8F0]'}`}>{page}</button>
            ))}
          </div>
        )}
      </div>
      <ItemEntryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} product={editProduct} onSave={handleSave} />
    </div>
  );
};
