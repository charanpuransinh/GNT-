// ============================================================================
// M07 PURCHASE — PurchaseHistoryPage (खरीद का इतिहास, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { type PurchaseInvoice, type ListResponse } from '../types/purchase.types';

export const PurchaseHistoryPage: React.FC = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = () =>
    apiClient
      .get<ListResponse<PurchaseInvoice>>('/purchase/invoices')
      .then((r) => setInvoices(r.data.data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'सूची लाने में गलती'))
      .finally(() => setLoading(false));

  useEffect(() => { setLoading(true); refresh(); }, []);

  // backend draft → approved → posted workflow पहले frontend से कहीं पहुँचा ही
  // नहीं जा सकता था — कोई Approve/Post बटन नहीं था।
  const approve = async (id: string) => {
    try { await apiClient.post(`/purchase/invoices/${id}/approve`); await refresh(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'approve नाकाम'); }
  };
  const post = async (id: string) => {
    try { await apiClient.post(`/purchase/invoices/${id}/post`); await refresh(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'post नाकाम'); }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">खरीद का इतिहास</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">लोड हो रहा है…</p> : null}
      <div className="space-y-2">
        {invoices.map((inv) => (
          <Card key={inv.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{inv.invoice_number}</p>
              <p className="text-sm text-slate-500">
                {inv.invoice_date ?? 'तारीख़ नहीं'} · कुल ₹{inv.total_amount ?? 0}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">{inv.status ?? 'draft'}</Badge>
              {inv.status === 'draft' ? <Button size="sm" variant="secondary" onClick={() => approve(inv.id)}>Approve</Button> : null}
              {inv.status === 'approved' ? <Button size="sm" variant="primary" onClick={() => post(inv.id)}>Post</Button> : null}
            </div>
          </Card>
        ))}
        {!loading && invoices.length === 0 ? <p className="text-sm text-slate-500">कोई खरीद नहीं</p> : null}
      </div>
    </div>
  );
};
