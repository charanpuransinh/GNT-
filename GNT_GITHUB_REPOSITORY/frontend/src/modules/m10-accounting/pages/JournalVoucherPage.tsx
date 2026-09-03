// ============================================================================
// M10 ACCOUNTING — JournalVoucherPage (जर्नल/भुगतान वाउचर, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { type Account, type Voucher, type ListResponse } from '../types/accounting.types';

export const JournalVoucherPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [date, setDate] = useState('');
  const [narration, setNarration] = useState('');
  const [rows, setRows] = useState<Array<{ account_id: string; debit: string; credit: string }>>([
    { account_id: '', debit: '', credit: '' },
    { account_id: '', debit: '', credit: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<Account>>('/accounting/accounts').then((r) => setAccounts(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<ListResponse<Voucher>>('/accounting/vouchers').then((r) => setVouchers(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const setRow = (i: number, field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: e.target.value } : r)));

  const submit = async () => {
    if (!date) return setError('तारीख़ ज़रूरी है');
    const items = rows
      .filter((r) => r.account_id)
      .map((r) => ({ account_id: r.account_id, debit_amount: Number(r.debit) || 0, credit_amount: Number(r.credit) || 0 }));
    if (items.length < 2) return setError('कम से कम दो पंक्तियाँ (नाम/जमा) ज़रूरी हैं');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/accounting/vouchers', {
        voucher_date: date,
        narration: narration.trim() || undefined,
        items,
      });
      setMessage('वाउचर बन गया ✅');
      apiClient.get<ListResponse<Voucher>>('/accounting/vouchers').then((r) => setVouchers(r.data.data ?? [])).catch(() => undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती (नाम/जमा बराबर होने चाहिए)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">वाउचर (Journal)</h1>
      <Card className="space-y-3 max-w-2xl">
        <Input label="तारीख़" type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} />
        <Input label="विवरण" value={narration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNarration(e.target.value)} />
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-end">
            <label className="flex-1 text-sm">
              खाता
              <select className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm" value={row.account_id} onChange={setRow(i, 'account_id')}>
                <option value="">चुनें…</option>
                {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name} ({a.code})</option>))}
              </select>
            </label>
            <Input label="नाम (₹)" value={row.debit} onChange={setRow(i, 'debit')} />
            <Input label="जमा (₹)" value={row.credit} onChange={setRow(i, 'credit')} />
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setRows((rs) => [...rs, { account_id: '', debit: '', credit: '' }])}>+ पंक्ति</Button>
        <Button variant="primary" loading={saving} onClick={() => void submit()}>वाउचर बनाएँ</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {vouchers.map((v) => (
          <Card key={v.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{v.voucher_no ?? v.id}</p>
              <p className="text-sm text-slate-500">नाम ₹{v.total_debit ?? 0} · जमा ₹{v.total_credit ?? 0}</p>
            </div>
            <Badge variant="info">{v.status ?? 'draft'}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};
