// ============================================================================
// M09 GST — GSTConfigPage (tax-slabs की सूची, ROUGH)
// ⚠️ M09 अभी mount नहीं (cess_rate schema गैप — समीक्षक का फैसला बाकी) —
// पेज तैयार है, चालू होते ही काम करेगा
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';

export interface TaxSlab {
  id: string;
  hsn_code?: string;
  name?: string;
  cgst_rate?: number | string | null;
  sgst_rate?: number | string | null;
  igst_rate?: number | string | null;
}

export const GSTConfigPage: React.FC = () => {
  const [slabs, setSlabs] = useState<TaxSlab[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get<{ success: boolean; data: TaxSlab[] }>('/gst/tax-slabs')
      .then((r) => setSlabs(r.data.data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'M09 अभी चालू नहीं (cess_rate फैसला बाकी)'));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">GST सेटिंग (Tax Slabs)</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {slabs.map((s) => (
          <Card key={s.id} className="flex items-center justify-between">
            <p className="font-medium">{s.name ?? s.hsn_code ?? s.id}</p>
            <p className="text-sm text-slate-600">
              CGST {String(s.cgst_rate ?? 0)}% · SGST {String(s.sgst_rate ?? 0)}% · IGST {String(s.igst_rate ?? 0)}%
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
