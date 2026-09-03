// ============================================================================
// M06 INVENTORY — StockTransferPage (शाखा-से-शाखा माल भेजना, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type Product, type ProductListResponse, type Branch } from '../types/inventory.types';

interface BranchListResponse {
  success: boolean;
  data: Branch[];
}

export const StockTransferPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [productId, setProductId] = useState('');
  const [fromBranch, setFromBranch] = useState('');
  const [toBranch, setToBranch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ProductListResponse>('/inventory/products').then((res) => setProducts(res.data.data ?? [])).catch(() => undefined);
    apiClient.get<BranchListResponse>('/company/branches').then((res) => setBranches(res.data.data ?? [])).catch(() => undefined);
  }, []);

  const submit = async () => {
    const qty = Number(quantity);
    if (!productId) return setError('माल चुनें');
    if (!fromBranch || !toBranch) return setError('दोनों शाखाएँ चुनें');
    if (fromBranch === toBranch) return setError('दोनों शाखाएँ अलग हों');
    if (Number.isNaN(qty) || qty <= 0) return setError('मात्रा 0 से ज़्यादा हो');
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await apiClient.post('/inventory/stock/transfer', {
        product_id: productId,
        from_branch_id: fromBranch,
        to_branch_id: toBranch,
        quantity: qty,
      });
      setMessage('माल भेज दिया गया ✅');
      setQuantity('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">शाखा-से-शाखा माल (Transfer)</h1>
      <Card className="space-y-3 max-w-xl">
        <label className="block text-sm font-medium text-slate-700">
          माल
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={productId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProductId(e.target.value)}>
            <option value="">चुनें…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          किस शाखा से
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={fromBranch} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFromBranch(e.target.value)}>
            <option value="">चुनें…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          किस शाखा को
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={toBranch} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setToBranch(e.target.value)}>
            <option value="">चुनें…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        <Input label="मात्रा" value={quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)} />
        <Button variant="primary" loading={saving} onClick={() => void submit()}>भेजें</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};
