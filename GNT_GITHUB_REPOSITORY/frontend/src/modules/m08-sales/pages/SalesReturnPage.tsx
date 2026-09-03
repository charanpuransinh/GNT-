// ============================================================================
// M08 SALES — SalesReturnPage (बिक्री वापसी, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type Customer, type SalesProduct, type SalesInvoice, type ListResponse } from '../types/sales.types';

export const SalesReturnPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [returns, setReturns] = useState<SalesInvoice[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState<Array<{ productId: string; quantity: string }>>([{ productId: '', quantity: '' }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<Customer>>('/parties?party_type=customer').then((r) => setCustomers(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<SalesProduct>>('/inventory/products').then((r) => setProducts(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<SalesInvoice>>('/sales/invoices').then((r) => setInvoices(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<SalesInvoice>>('/sales/returns').then((r) => setReturns(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const setRow = (i: number, field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: e.target.value } : r)));

  const submit = async () => {
    if (!invoiceId || !customerId) return setError('बिल और ग्राहक चुनें');
    const items = rows.filter((r) => r.productId).map((r) => ({ productId: r.productId, quantity: r.quantity }));
    if (items.length === 0) return setError('कम से कम एक माल जोड़ें');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/sales/returns', {
        invoiceId,
        customerId,
        returnDate: new Date().toISOString(),
        reason: reason.trim() || undefined,
        items,
      });
      setMessage('वापसी बन गई ✅');
      apiClient.get<ListResponse<SalesInvoice>>('/sales/returns').then((r) => setReturns(r.data.data ?? [])).catch(() => undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">बिक्री वापसी (Sales Return)</h1>
      <Card className="space-y-3 max-w-2xl">
        <label className="block text-sm font-medium text-slate-700">
          असली बिल
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
            <option value="">चुनें…</option>
            {invoices.map((inv) => (<option key={inv.id} value={inv.id}>{inv.invoiceNumber ?? inv.id}</option>))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          ग्राहक
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">चुनें…</option>
            {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </label>
        <Input label="वजह" value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} />
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-end">
            <label className="flex-1 text-sm">
              माल
              <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={row.productId} onChange={setRow(i, 'productId')}>
                <option value="">चुनें…</option>
                {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </label>
            <Input label="मात्रा" value={row.quantity} onChange={setRow(i, 'quantity')} />
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setRows((rs) => [...rs, { productId: '', quantity: '' }])}>+ पंक्ति</Button>
        <Button variant="primary" loading={saving} onClick={() => void submit()}>वापसी बनाएँ</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {returns.map((r) => (
          <Card key={r.id}><p className="font-medium">{r.invoiceNumber ?? r.id}</p></Card>
        ))}
      </div>
    </div>
  );
};
