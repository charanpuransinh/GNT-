// ============================================================================
// M05 PARTY MANAGEMENT — PartyListPage (सूची + खोज + ग्राहक/सप्लायर छाँटना, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PartyEntryDrawer } from './PartyEntryDrawer';
import { type Party, type PartyType, type PartyListResponse } from '../types/party.types';

const partyTypeLabel: Record<PartyType, string> = {
  customer: 'ग्राहक',
  supplier: 'सप्लायर',
  both: 'दोनों',
};

const partyTypeBadge: Record<PartyType, 'info' | 'warning' | 'muted'> = {
  customer: 'info',
  supplier: 'warning',
  both: 'muted',
};

export const PartyListPage: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | PartyType>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filter !== 'all') params.set('party_type', filter);
    apiClient
      .get<PartyListResponse>(`/parties?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setParties(res.data.data ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'सूची लाने में गलती');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, filter, drawerOpen]);

  const openNew = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (party: Party) => {
    setEditing(party);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">पार्टी (ग्राहक / सप्लायर)</h1>
        <Button variant="primary" onClick={openNew}>+ नई पार्टी</Button>
      </div>

      <div className="flex items-center gap-3">
        <Input
          label="खोजें"
          placeholder="नाम / GSTIN / फ़ोन"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />
        <label className="block text-sm font-medium text-slate-700">
          किस्म
          <select
            className="mt-1 block rounded border border-slate-300 p-2 text-sm"
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as 'all' | PartyType)}
          >
            <option value="all">सब</option>
            <option value="customer">ग्राहक</option>
            <option value="supplier">सप्लायर</option>
            <option value="both">दोनों</option>
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">लोड हो रहा है…</p> : null}

      <div className="space-y-2">
        {parties.map((party) => (
          <Card key={party.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {party.name}
                {party.display_name ? <span className="text-slate-500"> ({party.display_name})</span> : null}
              </p>
              <p className="text-sm text-slate-500">
                {party.gstin ?? 'GSTIN नहीं'} · {party.phone ?? 'फ़ोन नहीं'} · राज्य {party.state_code ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={partyTypeBadge[party.party_type]}>{partyTypeLabel[party.party_type]}</Badge>
              {party.is_active ? <Badge variant="success">चालू</Badge> : <Badge variant="muted">बंद</Badge>}
              <Button size="sm" variant="secondary" onClick={() => openEdit(party)}>बदलें</Button>
              <a className="text-sm text-blue-600 underline" href={`#/parties/${party.id}`}>खोलो</a>
            </div>
          </Card>
        ))}
        {!loading && parties.length === 0 ? <p className="text-sm text-slate-500">कोई पार्टी नहीं</p> : null}
      </div>

      <PartyEntryDrawer
        isOpen={drawerOpen}
        party={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => setDrawerOpen(false)}
      />
    </div>
  );
};
