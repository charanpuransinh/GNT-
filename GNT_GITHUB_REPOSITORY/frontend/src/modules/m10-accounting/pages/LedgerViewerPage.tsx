// ============================================================================
// M10 ACCOUNTING — LedgerViewerPage (बही/खाता देखना, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { type Account, type LedgerEntry, type ListResponse } from '../types/accounting.types';

export const LedgerViewerPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<Account>>('/accounting/accounts').then((r) => setAccounts(r.data.data ?? [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    apiClient
      .get<ListResponse<LedgerEntry>>(`/accounting/ledger?account_id=${accountId}`)
      .then((r) => setEntries(r.data.data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'गलती'))
      .finally(() => setLoading(false));
  }, [accountId]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">बही (Ledger)</h1>
      <label className="block text-sm font-medium text-slate-700 max-w-xl">
        खाता
        <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">चुनें…</option>
          {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} ({a.code})</option>))}
        </select>
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">लोड हो रहा है…</p> : null}
      <div className="space-y-2">
        {entries.map((e) => (
          <Card key={e.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{e.narration ?? '—'}</p>
              <p className="text-sm text-slate-500">{e.transaction_date ?? ''}</p>
            </div>
            <p className="text-sm">
              नाम ₹{e.debit_amount ?? 0} · जमा ₹{e.credit_amount ?? 0}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
