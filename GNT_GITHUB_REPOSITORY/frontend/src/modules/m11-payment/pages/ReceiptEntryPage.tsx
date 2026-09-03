// ============================================================================
// M11 PAYMENT — ReceiptEntryPage (ग्राहक से रसीद, ROUGH)
// ============================================================================

import React, { useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const ReceiptEntryPage: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [methodId, setMethodId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!/^\d+(\.\d{1,4})?$/.test(amount.trim())) return setError('रकम सही संख्या में हो');
    if (!payerName.trim()) return setError('ग्राहक का नाम ज़रूरी है');
    if (!methodId.trim()) return setError('तरीक़ा ज़रूरी है');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/payments', {
        amount: amount.trim(),
        paymentMethodId: methodId.trim(),
        payerName: payerName.trim(),
        payerType: 'customer',
        description: description.trim() || undefined,
      });
      setMessage('रसीद दर्ज हुई ✅');
      setAmount('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">ग्राहक से रसीद</h1>
      <Card className="space-y-3 max-w-xl">
        <Input label="रकम (₹)" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
        <Input label="ग्राहक का नाम" value={payerName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayerName(e.target.value)} />
        <Input label="तरीक़ा (जैसे UPI/NEFT/नकद)" value={methodId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMethodId(e.target.value)} />
        <Input label="विवरण" value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
        <Button variant="primary" loading={saving} onClick={() => void submit()}>रसीद दर्ज करें</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};
