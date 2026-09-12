// ============================================================================
// M11 PAYMENT — DueTrackerPage (बकाया ट्रैकर, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { type DueInvoice, type ListResponse } from '../types/payment.types';

export const DueTrackerPage: React.FC = () => {
  const [due, setDue] = useState<DueInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // M11 के पास कभी invoice routes नहीं थे (owner फ़ैसला — invoice M07/M08 की चीज़
    // है) — यह पेज /payments/invoices/overdue बुलाता था, जो कहीं मौजूद ही नहीं
    // (हमेशा 404)। असली बकाया M08 sales invoices से — unpaid + partial दोनों।
    setLoading(true);
    Promise.all([
      apiClient.get<ListResponse<DueInvoice>>('/sales/invoices', { params: { paymentStatus: 'unpaid' } }),
      apiClient.get<ListResponse<DueInvoice>>('/sales/invoices', { params: { paymentStatus: 'partial' } }),
    ])
      .then(([unpaid, partial]) => {
        // M08 का असली invoice आकार camelCase है (invoiceNumber/dueDate/grandTotal/
        // amountPaid) — DueInvoice के snake_case फ़ील्ड से मेल नहीं खाता, इसलिए मैप किया।
        const map = (rows: any[]): DueInvoice[] => rows.map((r) => ({
          id: r.id,
          invoice_number: r.invoiceNumber,
          due_date: r.dueDate,
          outstanding: Number(r.grandTotal ?? 0) - Number(r.amountPaid ?? 0),
        }));
        setDue([...map(unpaid.data.data ?? []), ...map(partial.data.data ?? [])]);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'सूची लाने में गलती'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">बकाया ट्रैकर</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">लोड हो रहा है…</p> : null}
      <div className="space-y-2">
        {due.map((inv) => (
          <Card key={inv.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{inv.invoice_number ?? inv.number ?? inv.id}</p>
              <p className="text-sm text-slate-500">
                {inv.customer_name ?? ''} · आख़िरी तारीख़ {inv.due_date ?? '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">₹{inv.outstanding ?? inv.amount_due ?? inv.total_amount ?? 0}</p>
              <Badge variant="warning">बकाया</Badge>
            </div>
          </Card>
        ))}
        {!loading && due.length === 0 ? <p className="text-sm text-slate-500">कोई बकाया नहीं ✅</p> : null}
      </div>
    </div>
  );
};
