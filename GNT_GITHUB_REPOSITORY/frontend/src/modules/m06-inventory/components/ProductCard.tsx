import React from 'react';
import { Product } from '../services/inventory.types';
import { StockBadge } from './StockBadge';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onEdit, onDelete }) => {
  const totalStock = product.stock?.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) || 0;
  const reorderLevel = product.reorder_level ? Number(product.reorder_level) : null;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onClick?.(product)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-[#0F172A] font-semibold text-base truncate" style={{ fontFamily: 'Inter' }}>{product.name}</h3>
          <p className="text-[#64748B] text-xs mt-0.5">
            {product.code && <span className="mr-2">Code: {product.code}</span>}
            {product.barcode && <span>Barcode: {product.barcode}</span>}
          </p>
        </div>
        <StockBadge quantity={totalStock} reorderLevel={reorderLevel} maxStock={product.max_stock ? Number(product.max_stock) : null} />
      </div>
      {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3 bg-[#F8FAFC]" />}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div><span className="text-[#64748B] text-xs">Sale Price</span><p className="text-[#0F172A] font-medium">₹{product.sale_price?.toFixed(2) || '0.00'}</p></div>
        <div><span className="text-[#64748B] text-xs">Purchase</span><p className="text-[#0F172A] font-medium">₹{product.purchase_price?.toFixed(2) || '0.00'}</p></div>
        <div><span className="text-[#64748B] text-xs">MRP</span><p className="text-[#0F172A] font-medium">₹{product.mrp?.toFixed(2) || '0.00'}</p></div>
        <div><span className="text-[#64748B] text-xs">GST</span><p className="text-[#0F172A] font-medium">{product.gst_rate || 0}%</p></div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
        <button onClick={(e) => { e.stopPropagation(); onEdit?.(product); }} className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete?.(product.id); }} className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#DC2626] rounded-lg hover:bg-red-700 transition">Delete</button>
      </div>
    </div>
  );
};
