// ============================================================================
// M07 PURCHASE — PurchaseEntryPage (नई खरीद प्रविष्टि, ROUGH)
// company_id backend खुद token से लेता है — body में नहीं भेजते (#009)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  type Supplier,
  type Branch,
  type PurchaseProduct,
  type ListResponse,
  type DetailResponse,
  type PurchaseInvoice,
} from '../types/purchase.types';

interface Row {
  product_id: string;
  quantity: string;
  rate: string;
}

export const PurchaseEntryPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [rows, setRows] = useState<Row[]>([{ product_id: '', quantity: '', rate: '' }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<Supplier>>('/parties?party_type=supplier').then((r) => setSuppliers(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<Branch>>('/company/branches').then((r) => setBranches(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<PurchaseProduct>>('/inventory/products').then((r) => setProducts(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const setRow = (i: number, field: keyof Row) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: e.target.value } : r)));

  const submit = async () => {
    if (!supplierId) return setError('सप्लायर चुनें');
    if (!branchId) return setError('शाखा चुनें');
    if (!invoiceNumber.trim()) return setError('बिल नंबर ज़रूरी है');
    const items = rows
      .filter((r) => r.product_id)
      .map((r) => ({ product_id: r.product_id, quantity: Number(r.quantity), rate: Number(r.rate) }));
    if (items.length === 0) return setError('कम से कम एक माल जोड़ें');
    if (items.some((i) => !(i.quantity > 0) || i.rate < 0)) return setError('मात्रा/दाम गलत है');
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await apiClient.post<DetailResponse<PurchaseInvoice>>('/purchase/invoices', {
        branch_id: branchId,
        supplier_id: supplierId,
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate || undefined,
        items,
      });
      setMessage('खरीद बिल बन गया ✅');
      setRows([{ product_id: '', quantity: '', rate: '' }]);
      setInvoiceNumber('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">नई खरीद (Purchase Entry)</h1>
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
        <Input label="बिल नंबर" value={invoiceNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceNumber(e.target.value)} />
        <Input label="बिल की तारीख़" type="date" value={invoiceDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceDate(e.target.value)} />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">माल की पंक्तियाँ</p>
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-end">
              <label className="flex-1 text-sm">
                माल
                <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={row.product_id} onChange={setRow(i, 'product_id')}>
                  <option value="">चुनें…</option>
                  {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </label>
              <Input label="मात्रा" value={row.quantity} onChange={setRow(i, 'quantity')} />
              <Input label="दाम" value={row.rate} onChange={setRow(i, 'rate')} />
              <Button size="sm" variant="secondary" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>−</Button>
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => setRows((rs) => [...rs, { product_id: '', quantity: '', rate: '' }])}>+ पंक्ति</Button>
        </div>

        <Button variant="primary" loading={saving} onClick={() => void submit()}>बिल बनाएँ</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};
