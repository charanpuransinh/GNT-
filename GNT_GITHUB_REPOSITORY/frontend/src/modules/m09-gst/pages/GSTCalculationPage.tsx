// ============================================================================
// M09 GST — GSTCalculationPage (टैक्स गणना, ROUGH)
// M09 mount होते ही (cess_rate फैसला) चलेगा — body में state codes के साथ
// ============================================================================

import React, { useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const GSTCalculationPage: React.FC = () => {
  const [hsn, setHsn] = useState('');
  const [amount, setAmount] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [companyStateCode, setCompanyStateCode] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const amt = Number(amount);
    if (!hsn.trim() || !(amt > 0)) return setError('HSN और रकम ज़रूरी हैं');
    if (!stateCode.trim() || !companyStateCode.trim()) return setError('दोनों राज्य कोड ज़रूरी हैं');
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post<{ success?: boolean; data?: unknown }>('/gst/calculate', {
        items: [{ hsn_code: hsn.trim(), taxable_amount: amt }],
        state_code: stateCode.trim(),
        company_state_code: companyStateCode.trim(),
        company_id: 'pending-m09-mount',
      });
      setResult(res.data.data ?? res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'M09 अभी चालू नहीं (cess_rate फैसला बाकी)');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">GST गणना</h1>
      <Card className="space-y-3 max-w-xl">
        <Input label="HSN कोड" value={hsn} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHsn(e.target.value)} />
        <Input label="रकम (₹)" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
        <Input label="खरीदार का राज्य कोड (2 अंक)" value={stateCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStateCode(e.target.value)} />
        <Input label="अपना राज्य कोड (2 अंक)" value={companyStateCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyStateCode(e.target.value)} />
        <Button variant="primary" loading={loading} onClick={() => void submit()}>गणना करें</Button>
      </Card>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result !== null ? (
        <Card>
          <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </Card>
      ) : null}
    </div>
  );
};
