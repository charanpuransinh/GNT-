// ============================================================================
// M10 ACCOUNTING — IncomeExpenseVoucherPage (आमदनी/ख़र्च वाउचर, ROUGH)
// JournalVoucherPage वाला ही रास्ता — type के साथ
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type Account, type ListResponse } from '../types/accounting.types';

export const IncomeExpenseVoucherPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [kind, setKind] = useState<'income' | 'expense'>('income');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<Account>>('/accounting/accounts').then((r) => setAccounts(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const submit = async () => {
    if (!date) return setError('तारीख़ ज़रूरी है');
    const amt = Number(amount);
    if (!(amt > 0)) return setError('रकम 0 से ज़्यादा हो');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/accounting/vouchers', {
        voucher_date: date,
        type: kind,
        narration: narration.trim() || undefined,
        items: [
          { account_id: accounts[0]?.id, debit_amount: kind === 'expense' ? amt : 0, credit_amount: kind === 'income' ? amt : 0 },
        ],
      });
      setMessage('वाउचर बन गया ✅');
      setAmount('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">आमदनी/ख़र्च वाउचर</h1>
      <Card className="space-y-3 max-w-xl">
        <label className="block text-sm font-medium text-slate-700">
          किस्म
          <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={kind} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setKind(e.target.value as 'income' | 'expense')}>
            <option value="income">आमदनी</option>
            <option value="expense">ख़र्च</option>
          </select>
        </label>
        <Input label="तारीख़" type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} />
        <Input label="रकम (₹)" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />
        <Input label="विवरण" value={narration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNarration(e.target.value)} />
        <Button variant="primary" loading={saving} onClick={() => void submit()}>वाउचर बनाएँ</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};
