// ============================================================================
// M06 INVENTORY — StockAdjustmentPage (माल घटाना/बढ़ाना, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type Product, type ProductListResponse } from '../types/inventory.types';

export const StockAdjustmentPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get<ProductListResponse>('/inventory/products')
      .then((res) => setProducts(res.data.data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'सूची लाने में गलती'));
  }, []);

  const submit = async () => {
    const qty = Number(quantity);
    if (!productId) return setError('माल चुनें');
    if (Number.isNaN(qty) || qty === 0) return setError('मात्रा 0 नहीं हो सकती');
    if (!reason.trim()) return setError('वजह ज़रूरी है');
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await apiClient.post('/inventory/stock/adjustment', {
        product_id: productId,
        quantity: qty,
        reason: reason.trim(),
      });
      setMessage('माल घटाया/बढ़ाया गया ✅');
      setQuantity('');
      setReason('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">माल घटाना/बढ़ाना (Adjustment)</h1>
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
        <Input label="मात्रा (+ बढ़ाना, − घटाना)" value={quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)} />
        <Input label="वजह (ज़रूरी)" value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} />
        <Button variant="primary" loading={saving} onClick={() => void submit()}>लागू करें</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};
