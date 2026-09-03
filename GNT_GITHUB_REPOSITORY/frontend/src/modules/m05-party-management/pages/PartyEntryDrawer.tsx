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

// backend के Zod से मिलते हुए client-side जाँच (टास्क #024 — A4)
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PHONE_RE = /^[0-9+\-\s]{6,20}$/;
const STATE_RE = /^[0-9]{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(form: PartyForm): string | null {
  if (!form.name.trim()) return 'नाम ज़रूरी है';
  const gstin = form.gstin.trim();
  if (gstin && !GSTIN_RE.test(gstin)) return 'GSTIN 15 अक्षर का होना चाहिए (जैसे 27ABCDE1234F1Z5)';
  const phone = form.phone.trim();
  if (phone && !PHONE_RE.test(phone)) return 'फ़ोन नंबर सही नहीं है';
  const email = form.email.trim();
  if (email && !EMAIL_RE.test(email)) return 'ईमेल सही नहीं है';
  const state = form.state_code.trim();
  if (state && !STATE_RE.test(state)) return 'राज्य कोड 2 अंकों का होना चाहिए (जैसे 27)';
  const limit = Number(form.credit_limit);
  if (form.credit_limit.trim() && (Number.isNaN(limit) || limit < 0)) return 'उधार-सीमा 0 या उससे ज़्यादा की संख्या हो';
  const days = Number(form.credit_days);
  if (form.credit_days.trim() && (Number.isNaN(days) || days < 0)) return 'उधार के दिन 0 या उससे ज़्यादा हों';
  return null;
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
    const problem = validateForm(form);
    if (problem) {
      setError(problem);
      return;
    }
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
