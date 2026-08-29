import React, { useState } from 'react';
import { Batch } from '../services/inventory.types';

interface BatchManagerProps {
  batches: Batch[];
  productId: string;
  onAdd?: (batch: Partial<Batch>) => void;
  onUpdate?: (id: string, batch: Partial<Batch>) => void;
}

export const BatchManager: React.FC<BatchManagerProps> = ({ batches, productId, onAdd }) => {
  const [form, setForm] = useState({ batch_number: '', mfg_date: '', expiry_date: '', quantity: 0, purchase_rate: 0, mrp: 0 });
  const getDaysRemaining = (expiry?: string | null) => {
    if (!expiry) return null;
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
    return days;
  };
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[#0F172A]">Batch Management</h4>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <input placeholder="Batch No" className="border border-[#E2E8F0] rounded-lg px-3 py-2" value={form.batch_number} onChange={e => setForm({...form, batch_number: e.target.value})} />
        <input type="date" className="border border-[#E2E8F0] rounded-lg px-3 py-2" value={form.mfg_date} onChange={e => setForm({...form, mfg_date: e.target.value})} />
        <input type="date" className="border border-[#E2E8F0] rounded-lg px-3 py-2" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} />
        <input type="number" placeholder="Qty" className="border border-[#E2E8F0] rounded-lg px-3 py-2" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} />
        <input type="number" placeholder="Rate" className="border border-[#E2E8F0] rounded-lg px-3 py-2" value={form.purchase_rate} onChange={e => setForm({...form, purchase_rate: Number(e.target.value)})} />
        <input type="number" placeholder="MRP" className="border border-[#E2E8F0] rounded-lg px-3 py-2" value={form.mrp} onChange={e => setForm({...form, mrp: Number(e.target.value)})} />
      </div>
      <button onClick={() => onAdd?.({ ...form, product_id: productId, remaining_qty: form.quantity })} className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-xs font-medium">Add Batch</button>
      <div className="space-y-2 max-h-48 overflow-auto">
        {batches.map(batch => {
          const days = getDaysRemaining(batch.expiry_date);
          return (
            <div key={batch.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div><p className="text-sm font-medium text-[#0F172A]">{batch.batch_number}</p><p className="text-xs text-[#64748B]">Qty: {batch.remaining_qty} / {batch.quantity}</p></div>
              <div className="text-right">
                {days !== null && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${days <= 30 ? 'bg-red-100 text-[#DC2626]' : 'bg-green-100 text-[#16A34A]'}`}>{days > 0 ? `${days} days left` : 'Expired'}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
