// ============================================================================
// M11 PAYMENT — PaymentEntryPage (भुगतान प्रविष्टि, ROUGH)
// amount string रूप में जाता है (backend decimal regex)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { type Payment, type ListResponse } from '../types/payment.types';

export const PaymentEntryPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerType, setPayerType] = useState<'customer' | 'supplier'>('customer');
  const [methodId, setMethodId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<Payment>>('/payments').then((r) => setPayments(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const submit = async () => {
    if (!/^\d+(\.\d{1,4})?$/.test(amount.trim())) return setError('रकम सही संख्या में हो (जैसे 1500.50)');
    if (!payerName.trim()) return setError('भुगतानकर्ता का नाम ज़रूरी है');
    if (!methodId.trim()) return setError('भुगतान का तरीक़ा ज़रूरी है');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/payments', {
        amount: amount.trim(),
        paymentMethodId: methodId.trim(),
        payerName: payerName.trim(),
        payerType,
        description: description.trim() || undefined,
      });
      setMessage('भुगतान दर्ज हुआ ✅');
      setAmount('');
      apiClient.get<ListResponse<Payment>>('/payments').then((r) => setPayments(r.data.data ?? [])).catch(() => undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">भुगतान प्रविष्टि</h1>
      <Card className="space-y-3 max-w-xl">
        <Input label="रकम (₹)" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
        <Input label="भुगतानकर्ता का नाम" value={payerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayerName(e.target.value)} />
        <label className="block text-sm font-medium text-slate-700">
          कौन
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={payerType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPayerType(e.target.value as 'customer' | 'supplier')}>
            <option value="customer">ग्राहक</option>
            <option value="supplier">सप्लायर</option>
          </select>
        </label>
        <Input label="तरीक़ा (जैसे UPI/NEFT/नकद)" value={methodId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMethodId(e.target.value)} />
        <Input label="विवरण" value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
        <Button variant="primary" loading={saving} onClick={() => void submit()}>भुगतान दर्ज करें</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {payments.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{p.payerName ?? p.payer_name ?? p.id}</p>
              <p className="text-sm text-slate-500">₹{p.amount ?? 0}</p>
            </div>
            <Badge variant="info">{p.status ?? '—'}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};
