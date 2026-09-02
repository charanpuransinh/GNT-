// ============================================================================
// M05 PARTY MANAGEMENT — PartyDetailHubPage (एक पार्टी का ब्यौरा, ROUGH)
// बकाया (outstanding/aging) की जगह बनी है — असला हिसाब M10 से आएगा (TODO #016)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { type Party, type PartyDetailResponse } from '../types/party.types';

const partyTypeLabel: Record<Party['party_type'], string> = {
  customer: 'ग्राहक',
  supplier: 'सप्लायर',
  both: 'दोनों',
};

export const PartyDetailHubPage: React.FC = () => {
  const id = window.location.pathname.split('/').filter(Boolean).pop() ?? '';
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<PartyDetailResponse>(`/parties/${id}`)
      .then((res) => {
        if (!cancelled) setParty(res.data.data ?? null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'पार्टी लाने में गलती');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="p-6"><p className="text-sm text-slate-500">लोड हो रहा है…</p></div>;
  if (error || !party) return <div className="p-6"><p className="text-sm text-red-600">{error || 'पार्टी नहीं मिली'}</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <a className="text-sm text-blue-600 underline" href="#/parties">← सूची पर वापस</a>
        <h1 className="text-2xl font-bold text-slate-900">{party.name}</h1>
        <Badge variant="info">{partyTypeLabel[party.party_type]}</Badge>
        {party.is_active ? <Badge variant="success">चालू</Badge> : <Badge variant="muted">बंद</Badge>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="font-semibold">पहचान</h2>
          <p className="text-sm text-slate-600">GSTIN: {party.gstin ?? '—'}</p>
          <p className="text-sm text-slate-600">PAN: {party.pan ?? '—'}</p>
          <p className="text-sm text-slate-600">GST किस्म: {party.gst_type ?? '—'}</p>
          <p className="text-sm text-slate-600">देश: {party.country}</p>
        </Card>
        <Card className="space-y-2">
          <h2 className="font-semibold">संपर्क</h2>
          <p className="text-sm text-slate-600">व्यक्ति: {party.contact_person ?? '—'}</p>
          <p className="text-sm text-slate-600">फ़ोन: {party.phone ?? '—'}</p>
          <p className="text-sm text-slate-600">ईमेल: {party.email ?? '—'}</p>
          <p className="text-sm text-slate-600">पता: {party.billing_address ?? '—'}</p>
        </Card>
        <Card className="space-y-2">
          <h2 className="font-semibold">उधार</h2>
          <p className="text-sm text-slate-600">सीमा: ₹{party.credit_limit.toFixed(2)}</p>
          <p className="text-sm text-slate-600">दिन: {party.credit_days}</p>
          <p className="text-sm text-slate-600">
            शुरुआती बकाया: ₹{party.opening_balance.toFixed(2)} ({party.opening_type.toUpperCase()})
          </p>
        </Card>
        <Card className="space-y-2">
          <h2 className="font-semibold">बकाया (outstanding)</h2>
          <p className="text-sm text-slate-500">TODO(#016): असला हिसाब M10 के खाते से आएगा — अभी खाली है (झूठे आँकड़े नहीं)</p>
        </Card>
      </div>
    </div>
  );
};
