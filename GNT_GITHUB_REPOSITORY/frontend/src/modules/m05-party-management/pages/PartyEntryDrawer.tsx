// ============================================================================
// M05 PARTY MANAGEMENT — PartyEntryDrawer (नया/बदलाव का फ़ॉर्म, ROUGH)
// Modal में चलता है — सुंदर बाद में, चलना पहले
// ============================================================================

import React, { useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type Party, type PartyType, type PartyDetailResponse } from '../types/party.types';

export interface PartyEntryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** बदलाव के लिए मौजूदा party; नया बनाने के लिए null */
  party?: Party | null;
  onSaved: () => void;
}

interface PartyForm {
  party_type: PartyType;
  name: string;
  gstin: string;
  phone: string;
  email: string;
  state_code: string;
  credit_limit: string;
  credit_days: string;
}

export const PartyEntryDrawer: React.FC<PartyEntryDrawerProps> = ({ isOpen, onClose, party, onSaved }) => {
  const [form, setForm] = useState<PartyForm>({
    party_type: party?.party_type ?? 'customer',
    name: party?.name ?? '',
    gstin: party?.gstin ?? '',
    phone: party?.phone ?? '',
    email: party?.email ?? '',
    state_code: party?.state_code ?? '',
    credit_limit: party ? String(party.credit_limit) : '',
    credit_days: party ? String(party.credit_days) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof PartyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const body = {
        party_type: form.party_type,
        name: form.name,
        gstin: form.gstin.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        state_code: form.state_code.trim() || null,
        credit_limit: Number(form.credit_limit) || 0,
        credit_days: Number(form.credit_days) || 0,
      };
      if (party) {
        await apiClient.put<PartyDetailResponse>(`/parties/${party.id}`, body);
      } else {
        await apiClient.post<PartyDetailResponse>('/parties', body);
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'सहेजने में गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title={party ? 'पार्टी बदलें' : 'नई पार्टी'} onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          किस्म
          <select
            className="mt-1 block w-full rounded border border-slate-300 p-2 text-sm"
            value={form.party_type}
            onChange={set('party_type')}
          >
            <option value="customer">ग्राहक</option>
            <option value="supplier">सप्लायर</option>
            <option value="both">दोनों</option>
          </select>
        </label>
        <Input label="नाम (ज़रूरी)" value={form.name} onChange={set('name')} />
        <Input label="GSTIN (15 अक्षर)" value={form.gstin} onChange={set('gstin')} />
        <Input label="फ़ोन" value={form.phone} onChange={set('phone')} />
        <Input label="ईमेल" value={form.email} onChange={set('email')} />
        <Input label="राज्य कोड (2 अंक, GST)" value={form.state_code} onChange={set('state_code')} />
        <Input label="उधार-सीमा (₹)" value={form.credit_limit} onChange={set('credit_limit')} />
        <Input label="उधार के दिन" value={form.credit_days} onChange={set('credit_days')} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>रद्द</Button>
          <Button variant="primary" loading={saving} onClick={() => void submit()}>सहेजें</Button>
        </div>
      </div>
    </Modal>
  );
};
