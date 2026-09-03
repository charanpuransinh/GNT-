// ============================================================================
// M08 SALES — QuotationPage (भाव-पत्र बनाना + सूची, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { type Customer, type Branch, type SalesProduct, type Quotation, type ListResponse } from '../types/sales.types';

export const QuotationPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [quotationDate, setQuotationDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [rows, setRows] = useState<Array<{ productId: string; quantity: string; rate: string }>>([{ productId: '', quantity: '', rate: '' }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<Customer>>('/parties?party_type=customer').then((r) => setCustomers(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<Branch>>('/company/branches').then((r) => setBranches(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<SalesProduct>>('/inventory/products').then((r) => setProducts(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<Quotation>>('/sales/quotations').then((r) => setQuotations(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const setRow = (i: number, field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: e.target.value } : r)));

  const submit = async () => {
    if (!customerId || !branchId) return setError('ग्राहक और शाखा चुनें');
    if (!quotationDate || !expiryDate) return setError('तारीख़ें ज़रूरी हैं');
    const items = rows.filter((r) => r.productId).map((r) => ({ productId: r.productId, quantity: r.quantity, rate: r.rate }));
    if (items.length === 0) return setError('कम से कम एक माल जोड़ें');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/sales/quotations', {
        branchId,
        customerId,
        quotationDate: new Date(quotationDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
        items,
      });
      setMessage('भाव-पत्र बन गया ✅');
      apiClient.get<ListResponse<Quotation>>('/sales/quotations').then((r) => setQuotations(r.data.data ?? [])).catch(() => undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">भाव-पत्र (Quotation)</h1>
      <Card className="space-y-3 max-w-2xl">
        <label className="block text-sm font-medium text-slate-700">
          ग्राहक
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">चुनें…</option>
            {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          शाखा
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">चुनें…</option>
            {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
        </label>
        <Input label="भाव-पत्र की तारीख़" type="date" value={quotationDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuotationDate(e.target.value)} />
        <Input label="मान्यता की आख़िरी तारीख़" type="date" value={expiryDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiryDate(e.target.value)} />
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
            <Input label="दाम" value={row.rate} onChange={setRow(i, 'rate')} />
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setRows((rs) => [...rs, { productId: '', quantity: '', rate: '' }])}>+ पंक्ति</Button>
        <Button variant="primary" loading={saving} onClick={() => void submit()}>भाव-पत्र बनाएँ</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {quotations.map((q) => (
          <Card key={q.id} className="flex items-center justify-between">
            <p className="font-medium">{q.quotationNumber ?? q.id}</p>
            <Badge variant="info">{q.status ?? 'draft'}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};
