import React from 'react';
import { StockStatus } from '../services/inventory.types';
import { STOCK_STATUS_COLORS } from '../services/inventory.constants';

interface StockBadgeProps {
  quantity: number;
  reorderLevel?: number | null;
  maxStock?: number | null;
}

export const StockBadge: React.FC<StockBadgeProps> = ({ quantity, reorderLevel, maxStock }) => {
  let status: StockStatus = 'in_stock';
  let label = 'In Stock';
  if (quantity <= 0) { status = 'out_of_stock'; label = 'Out of Stock'; }
  else if (reorderLevel !== null && quantity <= reorderLevel) { status = 'low_stock'; label = 'Low Stock'; }
  else if (maxStock !== null && quantity > maxStock) { status = 'overstock'; label = 'Overstock'; }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: STOCK_STATUS_COLORS[status] }}>
      {label} • {quantity}
    </span>
  );
};
