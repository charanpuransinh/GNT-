// ============================================================================
// M12 HR — EmployeeListPage (कर्मचारी सूची + नया, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface Employee {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  is_active?: boolean;
}

export const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<{ success: boolean; data: Employee[] }>('/hr/employees').then((r) => setEmployees(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const submit = async () => {
    if (!name.trim()) return setError('नाम ज़रूरी है');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/hr/employees', {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        designation: designation.trim() || undefined,
      });
      setMessage('कर्मचारी जुड़ गया ✅');
      setName('');
      apiClient.get<{ success: boolean; data: Employee[] }>('/hr/employees').then((r) => setEmployees(r.data.data ?? [])).catch(() => undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">कर्मचारी</h1>
      <Card className="space-y-3 max-w-xl">
        <Input label="नाम (ज़रूरी)" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
        <Input label="ईमेल" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
        <Input label="फ़ोन" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
        <Input label="पद" value={designation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesignation(e.target.value)} />
        <Button variant="primary" loading={saving} onClick={() => void submit()}>नया कर्मचारी</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {employees.map((e) => (
          <Card key={e.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{e.name ?? e.id}</p>
              <p className="text-sm text-slate-500">{e.designation ?? ''} · {e.phone ?? ''}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
