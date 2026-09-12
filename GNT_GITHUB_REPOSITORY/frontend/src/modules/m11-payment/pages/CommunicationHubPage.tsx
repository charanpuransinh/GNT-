// ============================================================================
// M11 PAYMENT — CommunicationHubPage (बिल भेजना/याद दिलाना, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type DueInvoice, type ListResponse } from '../types/payment.types';

// M11 के पास कभी invoice routes नहीं थे — यह पेज /payments/invoices और
// /payments/invoices/:id/send बुलाता था (कहीं मौजूद नहीं, हमेशा 404)। असली बिल
// M08 sales invoice की /share endpoint से जाता है, जिसे method + recipient चाहिए।
export const CommunicationHubPage: React.FC = () => {
  const [invoices, setInvoices] = useState<DueInvoice[]>([]);
  const [recipients, setRecipients] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<ListResponse<any>>('/sales/invoices').then((r) =>
      setInvoices((r.data.data ?? []).map((inv: any) => ({ id: inv.id, invoice_number: inv.invoiceNumber })))
    ).catch(() => undefined);
  }, []);

  const send = async (id: string) => {
    const recipient = (recipients[id] ?? '').trim();
    if (!recipient) return setError('WhatsApp नंबर/ईमेल भरें');
    setBusyId(id);
    setError('');
    setMessage('');
    try {
      await apiClient.post(`/sales/invoices/${id}/share`, {
        method: recipient.includes('@') ? 'email' : 'whatsapp',
        recipient,
      });
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
          <Card key={inv.id} className="flex items-center justify-between gap-3">
            <p className="font-medium">{inv.invoice_number ?? inv.number ?? inv.id}</p>
            <Input
              label="WhatsApp/Email"
              value={recipients[inv.id] ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipients((r) => ({ ...r, [inv.id]: e.target.value }))}
            />
            <Button size="sm" variant="secondary" loading={busyId === inv.id} onClick={() => void send(inv.id)}>भेजें</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
