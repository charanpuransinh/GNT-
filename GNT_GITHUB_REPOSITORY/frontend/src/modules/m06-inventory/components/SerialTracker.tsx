import React, { useState } from 'react';
import { Serial } from '../services/inventory.types';

interface SerialTrackerProps {
  serials: Serial[];
  productId: string;
  onAdd?: (serial: Partial<Serial>) => void;
  onStatusChange?: (id: string, status: Serial['status']) => void;
}

export const SerialTracker: React.FC<SerialTrackerProps> = ({ serials, productId, onAdd, onStatusChange }) => {
  const [input, setInput] = useState('');
  const statusColors = { in_stock: '#16A34A', sold: '#2563EB', returned: '#F59E0B', damaged: '#DC2626' };
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[#0F172A]">Serial Number Tracking</h4>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Scan or enter serial number" className="flex-1 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm" />
        <button onClick={() => { onAdd?.({ serial_number: input, product_id: productId, status: 'in_stock' }); setInput(''); }} className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-xs font-medium">Add</button>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto">
        {serials.map(s => (
          <div key={s.id} className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-mono text-[#0F172A] truncate max-w-[120px]">{s.serial_number}</span>
            <select value={s.status} onChange={e => onStatusChange?.(s.id, e.target.value as Serial['status'])} className="text-xs border border-[#E2E8F0] rounded px-2 py-1" style={{ color: statusColors[s.status] }}>
              <option value="in_stock">In Stock</option><option value="sold">Sold</option><option value="returned">Returned</option><option value="damaged">Damaged</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
