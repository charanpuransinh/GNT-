// ============================================================================
// M07 PURCHASE — PurchaseOrderPage (खरीद आदेश बनाना + सूची, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  type Supplier,
  type Branch,
  type PurchaseProduct,
  type PurchaseOrder,
  type ListResponse,
  type DetailResponse,
} from '../types/purchase.types';

export const PurchaseOrderPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [items, setItems] = useState<Array<{ product_id: string; quantity: string; rate: string }>>([{ product_id: '', quantity: '', rate: '' }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<Supplier>>('/parties?party_type=supplier').then((r) => setSuppliers(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<Branch>>('/company/branches').then((r) => setBranches(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<PurchaseProduct>>('/inventory/products').then((r) => setProducts(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<PurchaseOrder>>('/purchase/orders').then((r) => setOrders(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const setItem = (i: number, field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setItems((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: e.target.value } : r)));

  const submit = async () => {
    if (!supplierId || !branchId) return setError('सप्लायर और शाखा चुनें');
    const validItems = items.filter((i) => i.product_id).map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity), rate: Number(i.rate) }));
    if (validItems.length === 0) return setError('कम से कम एक माल जोड़ें');
    setSaving(true);
    setError('');
    try {
      await apiClient.post<DetailResponse<PurchaseOrder>>('/purchase/orders', {
        branch_id: branchId,
        supplier_id: supplierId,
        items: validItems,
      });
      setMessage('खरीद आदेश बन गया ✅');
      apiClient.get<ListResponse<PurchaseOrder>>('/purchase/orders').then((r) => setOrders(r.data.data ?? [])).catch(() => undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">खरीद आदेश (Purchase Orders)</h1>
      <Card className="space-y-3 max-w-2xl">
        <label className="block text-sm font-medium text-slate-700">
          सप्लायर
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">चुनें…</option>
            {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          शाखा
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">चुनें…</option>
            {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
        </label>
        {items.map((row, i) => (
          <div key={i} className="flex gap-2 items-end">
            <label className="flex-1 text-sm">
              माल
              <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={row.product_id} onChange={setItem(i, 'product_id')}>
                <option value="">चुनें…</option>
                {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </label>
            <Input label="मात्रा" value={row.quantity} onChange={setItem(i, 'quantity')} />
            <Input label="दाम" value={row.rate} onChange={setItem(i, 'rate')} />
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setItems((rs) => [...rs, { product_id: '', quantity: '', rate: '' }])}>+ पंक्ति</Button>
        <Button variant="primary" loading={saving} onClick={() => void submit()}>आदेश बनाएँ</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-2">
        {orders.map((o) => (
          <Card key={o.id} className="flex items-center justify-between">
            <p className="font-medium">{o.po_number ?? o.order_number ?? o.id}</p>
            <Badge variant="info">{o.status ?? 'draft'}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};
