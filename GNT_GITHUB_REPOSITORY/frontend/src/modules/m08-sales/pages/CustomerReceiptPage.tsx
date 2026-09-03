// ============================================================================
// M08 SALES — CustomerReceiptPage (ग्राहक से रसीद/भुगतान, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type SalesInvoice, type ListResponse } from '../types/sales.types';

export const CustomerReceiptPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<SalesInvoice>>('/sales/invoices').then((r) => setInvoices(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const submit = async () => {
    if (!invoiceId) return setError('बिल चुनें');
    if (!(Number(amount) > 0)) return setError('रकम 0 से ज़्यादा हो');
    if (!paymentDate) return setError('तारीख़ ज़रूरी है');
    setSaving(true);
    setError('');
    try {
      await apiClient.post(`/sales/invoices/${invoiceId}/payment`, {
        amount,
        paymentDate: new Date(paymentDate).toISOString(),
        referenceNumber: reference.trim() || undefined,
      });
      setMessage('रसीद दर्ज हुई ✅');
      setAmount('');
      setReference('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">ग्राहक से रसीद (Receipt)</h1>
      <Card className="space-y-3 max-w-xl">
        <label className="block text-sm font-medium text-slate-700">
          बिल
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
            <option value="">चुनें…</option>
            {invoices.map((inv) => (<option key={inv.id} value={inv.id}>{inv.invoiceNumber ?? inv.id} · ₹{inv.grandTotal ?? 0}</option>))}
          </select>
        </label>
        <Input label="रकम (₹)" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
        <Input label="तारीख़" type="date" value={paymentDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentDate(e.target.value)} />
        <Input label="संदर्भ (वैकल्पिक)" value={reference} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReference(e.target.value)} />
        <Button variant="primary" loading={saving} onClick={() => void submit()}>रसीद दर्ज करें</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};
