// ============================================================================
// M11 PAYMENT — CommunicationHubPage (बिल भेजना/याद दिलाना, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { type DueInvoice, type ListResponse } from '../types/payment.types';

export const CommunicationHubPage: React.FC = () => {
  const [invoices, setInvoices] = useState<DueInvoice[]>([]);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<DueInvoice>>('/payments/invoices').then((r) => setInvoices(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const send = async (id: string) => {
    setBusyId(id);
    setError('');
    setMessage('');
    try {
      await apiClient.post(`/payments/invoices/${id}/send`, {});
      setMessage('बिल भेजने की कोशिश शुरू हुई ✅');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">बिल भेजना (Communication)</h1>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {invoices.map((inv) => (
          <Card key={inv.id} className="flex items-center justify-between">
            <p className="font-medium">{inv.invoice_number ?? inv.number ?? inv.id}</p>
            <Button size="sm" variant="secondary" loading={busyId === inv.id} onClick={() => void send(inv.id)}>भेजें</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
