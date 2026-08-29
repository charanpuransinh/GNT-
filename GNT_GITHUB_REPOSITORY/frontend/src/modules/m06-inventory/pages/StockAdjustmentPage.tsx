import React, { useState } from 'react';
import { inventoryService } from '../services/inventory.service';
import { StockAdjustmentForm } from '../services/inventory.types';

export const StockAdjustmentPage: React.FC = () => {
  const [form, setForm] = useState<StockAdjustmentForm>({ product_id: '', branch_id: '', batch_id: '', quantity: 0, reason: '', reference: '', rate: 0 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) { setResult('Reason is required'); return; }
    setLoading(true);
    try { await inventoryService.adjustStock(form); setResult('Stock adjusted successfully!'); setForm({ product_id: '', branch_id: '', batch_id: '', quantity: 0, reason: '', reference: '', rate: 0 }); }
    catch (err: any) { setResult(err.message || 'Adjustment failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6" style={{ fontFamily: 'Inter' }}>
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h1 className="text-xl font-bold text-[#0F172A] mb-2">Stock Adjustment</h1>
        <p className="text-[#64748B] text-sm mb-6">Use positive quantity to add, negative to reduce</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Product ID</label><input value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Branch ID</label><input value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Batch ID</label><input value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Quantity (+/-)</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" required /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Rate</label><input type="number" value={form.rate || ''} onChange={e => setForm({ ...form, rate: Number(e.target.value) })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Reason *</label><input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" required /></div>
          <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Reference</label><input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
          <button type="submit" disabled={loading} className="w-full px-4 py-2.5 bg-[#F59E0B] text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? 'Adjusting...' : 'Adjust Stock'}</button>
          {result && <p className={`text-sm text-center mt-2 ${result.includes('success') ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{result}</p>}
        </form>
      </div>
    </div>
  );
};
