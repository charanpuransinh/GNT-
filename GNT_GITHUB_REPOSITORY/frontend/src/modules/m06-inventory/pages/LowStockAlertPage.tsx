import React, { useEffect } from 'react';
import { useInventoryStore } from '../state/inventory.store';
import { inventoryActions } from '../state/inventory.actions';
import { StockBadge } from '../components/StockBadge';

export const LowStockAlertPage: React.FC = () => {
  const { products, loading } = useInventoryStore();
  useEffect(() => { inventoryActions.fetchLowStock(); }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6" style={{ fontFamily: 'Inter' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-[#0F172A]">Low Stock Alerts</h1><p className="text-[#64748B] text-sm mt-1">Items at or below reorder level</p></div>
          <button onClick={() => alert('Auto-PO trigger would initiate purchase order draft')} className="px-5 py-2.5 bg-[#DC2626] text-white rounded-lg font-medium text-sm hover:bg-red-700 transition">🚨 Auto-Generate PO</button>
        </div>
        {loading && <div className="text-center py-12 text-[#64748B]">Loading alerts...</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => {
            const totalStock = product.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0;
            return (
              <div key={product.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[#0F172A] font-semibold text-base truncate">{product.name}</h3>
                  <StockBadge quantity={totalStock} reorderLevel={Number(product.reorder_level)} />
                </div>
                <div className="text-sm text-[#64748B] space-y-1">
                  <p>Current Stock: <span className="font-medium text-[#0F172A]">{totalStock}</span></p>
                  <p>Reorder Level: <span className="font-medium text-[#DC2626]">{product.reorder_level}</span></p>
                  <p>Code: {product.code || 'N/A'}</p>
                </div>
              </div>
            );
          })}
        </div>
        {!loading && products.length === 0 && <div className="text-center py-12 text-[#16A34A] font-medium">✅ All stock levels are healthy!</div>}
      </div>
    </div>
  );
};
