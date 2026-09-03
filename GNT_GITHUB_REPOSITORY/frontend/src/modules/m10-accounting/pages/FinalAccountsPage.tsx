// ============================================================================
// M10 ACCOUNTING — FinalAccountsPage (तुलन-पत्र/नफ़ा-नुक़सान/बैलेंस-शीट, ROUGH)
// ============================================================================

import React, { useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type ReportKind = 'trial-balance' | 'profit-loss' | 'balance-sheet';

export const FinalAccountsPage: React.FC = () => {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kind, setKind] = useState<ReportKind>('trial-balance');

  const fetchReport = async (k: ReportKind) => {
    setKind(k);
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<{ success: boolean; data: unknown }>(`/accounting/${k}`);
      setData(res.data.data ?? res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const label: Record<ReportKind, string> = {
    'trial-balance': 'तुलन-पत्र (Trial Balance)',
    'profit-loss': 'नफ़ा-नुक़सान (P&L)',
    'balance-sheet': 'बैलेंस-शीट',
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{label[kind]}</h1>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => void fetchReport('trial-balance')}>तुलन-पत्र</Button>
        <Button variant="secondary" onClick={() => void fetchReport('profit-loss')}>नफ़ा-नुक़सान</Button>
        <Button variant="secondary" onClick={() => void fetchReport('balance-sheet')}>बैलेंस-शीट</Button>
      </div>
      {loading ? <p className="text-sm text-slate-500">लोड हो रहा है…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {data !== null ? (
        <Card>
          <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </Card>
      ) : null}
    </div>
  );
};
