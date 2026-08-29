import React, { useState } from 'react';
import { inventoryService } from '../services/inventory.service';
import { StockTransferForm } from '../services/inventory.types';

export const StockTransferPage: React.FC = () => {
  const [form, setForm] = useState<StockTransferForm>({ product_id: '', from_branch_id: '', to_branch_id: '', quantity: 0, notes: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await inventoryService.transferStock(form); setResult('Stock transferred successfully!'); setForm({ product_id: '', from_branch_id: '', to_branch_id: '', quantity: 0, notes: '' }); }
    catch (err: any) { setResult(err.message || 'Transfer failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6" style={{ fontFamily: 'Inter' }}>
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h1 className="text-xl font-bold text-[#0F172A] mb-6">Stock Transfer</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Product ID</label><input value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">From Branch</label><input value={form.from_branch_id} onChange={e => setForm({ ...form, from_branch_id: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" required /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">To Branch</label><input value={form.to_branch_id} onChange={e => setForm({ ...form, to_branch_id: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" required /></div>
          </div>
          <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Quantity</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" required min={1} /></div>
          <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm resize-none" /></div>
          <button type="submit" disabled={loading} className="w-full px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? 'Transferring...' : 'Transfer Stock'}</button>
          {result && <p className={`text-sm text-center mt-2 ${result.includes('success') ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{result}</p>}
        </form>
      </div>
    </div>
  );
};
