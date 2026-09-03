// ============================================================================
// M08 SALES — InvoicePrintSharePage (बिल छापना/भेजना, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { type SalesInvoice, type ListResponse } from '../types/sales.types';

export const InvoicePrintSharePage: React.FC = () => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<SalesInvoice>>('/sales/invoices').then((r) => setInvoices(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const act = async (id: string, action: 'print' | 'share') => {
    setBusyId(id);
    setError('');
    setMessage('');
    try {
      await apiClient.post(`/sales/invoices/${id}/${action}`, action === 'share' ? { method: 'whatsapp' } : {});
      setMessage(`${action === 'print' ? 'छपाई' : 'भेजना'} शुरू हुआ ✅`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">बिल छापना / भेजना</h1>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {invoices.map((inv) => (
          <Card key={inv.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{inv.invoiceNumber ?? inv.id}</p>
              <p className="text-sm text-slate-500">कुल ₹{inv.grandTotal ?? 0} · {inv.status ?? 'draft'}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" loading={busyId === inv.id} onClick={() => void act(inv.id, 'print')}>छापें</Button>
              <Button size="sm" variant="secondary" loading={busyId === inv.id} onClick={() => void act(inv.id, 'share')}>भेजें</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
