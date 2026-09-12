// ============================================================================
// M07 PURCHASE — PurchaseReturnPage (खरीद वापसी + सूची, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type PurchaseInvoice, type PurchaseProduct, type ListResponse, type DetailResponse } from '../types/purchase.types';

export const PurchaseReturnPage: React.FC = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [returns, setReturns] = useState<PurchaseInvoice[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  // backend `return_number`/`return_date` ज़रूरी मांगता है (createPurchaseReturnSchema)
  // — पहले फ़ॉर्म में यह फ़ील्ड ही नहीं थे, हर "वापसी बनाएँ" 400 पर फेल होता।
  const [returnNumber, setReturnNumber] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [items, setItems] = useState<Array<{ product_id: string; quantity: string; rate: string }>>([{ product_id: '', quantity: '', rate: '' }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<PurchaseInvoice>>('/purchase/invoices').then((r) => setInvoices(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<PurchaseProduct>>('/inventory/products').then((r) => setProducts(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<PurchaseInvoice>>('/purchase/returns').then((r) => setReturns(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const setItem = (i: number, field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setItems((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: e.target.value } : r)));

  const refreshReturns = () =>
    apiClient.get<ListResponse<PurchaseInvoice>>('/purchase/returns').then((r) => setReturns(r.data.data ?? [])).catch(() => undefined);

  const approveReturn = async (id: string) => {
    try { await apiClient.post(`/purchase/returns/${id}/approve`); await refreshReturns(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'approve नाकाम'); }
  };

  const postReturn = async (id: string) => {
    try { await apiClient.post(`/purchase/returns/${id}/post`); await refreshReturns(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'post नाकाम'); }
  };

  const submit = async () => {
    if (!invoiceId) return setError('असली बिल चुनें');
    if (!returnNumber.trim()) return setError('वापसी नंबर ज़रूरी है');
    if (!returnDate) return setError('वापसी की तारीख़ ज़रूरी है');
    const validItems = items.filter((i) => i.product_id).map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity), rate: Number(i.rate) }));
    if (validItems.length === 0) return setError('कम से कम एक माल जोड़ें');
    setSaving(true);
    setError('');
    try {
      await apiClient.post<DetailResponse<PurchaseInvoice>>('/purchase/returns', {
        purchase_invoice_id: invoiceId,
        supplier_id: invoices.find((i) => i.id === invoiceId)?.supplier_id ?? '',
        return_number: returnNumber.trim(),
        return_date: returnDate,
        items: validItems,
      });
      setMessage('वापसी बन गई ✅');
      setReturnNumber('');
      apiClient.get<ListResponse<PurchaseInvoice>>('/purchase/returns').then((r) => setReturns(r.data.data ?? [])).catch(() => undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">खरीद वापसी (Returns)</h1>
      <Card className="space-y-3 max-w-2xl">
        <label className="block text-sm font-medium text-slate-700">
          असली खरीद बिल
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
            <option value="">चुनें…</option>
            {invoices.map((inv) => (<option key={inv.id} value={inv.id}>{inv.invoice_number}</option>))}
          </select>
        </label>
        <Input label="वापसी नंबर" value={returnNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnNumber(e.target.value)} />
        <Input label="वापसी की तारीख़" type="date" value={returnDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnDate(e.target.value)} />
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
        <Button variant="primary" loading={saving} onClick={() => void submit()}>वापसी बनाएँ</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-2">
        {returns.map((r) => (
          <Card key={r.id} className="flex items-center justify-between">
            <p className="font-medium">{r.invoice_number ?? r.id} — {r.status ?? 'draft'}</p>
            <div className="flex gap-2">
              {r.status === 'draft' ? <Button size="sm" variant="secondary" onClick={() => approveReturn(r.id)}>Approve</Button> : null}
              {r.status === 'approved' ? <Button size="sm" variant="primary" onClick={() => postReturn(r.id)}>Post</Button> : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
