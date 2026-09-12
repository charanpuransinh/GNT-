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
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  is_active?: boolean;
}

export const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  // backend (CreateEmployeeDto) को ज़रूरी माँगता है — पहले फ़ॉर्म में यह फ़ील्ड ही
  // नहीं थे (सिर्फ़ एक "नाम" बॉक्स था, firstName/lastName अलग नहीं, joinDate/salary
  // सिरे से ग़ायब) — हर "नया कर्मचारी" 400 पर फेल होता।
  const [joinDate, setJoinDate] = useState('');
  const [salary, setSalary] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<{ success: boolean; data: Employee[] }>('/hr/employees').then((r) => setEmployees(r.data.data ?? [])).catch(() => undefined);
  }, []);

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim()) return setError('पहला और आख़िरी नाम ज़रूरी है');
    if (!email.trim()) return setError('ईमेल ज़रूरी है');
    if (!designation.trim()) return setError('पद ज़रूरी है');
    if (!joinDate) return setError('शामिल होने की तारीख़ ज़रूरी है');
    if (!salary.trim() || Number(salary) <= 0) return setError('वेतन 0 से बड़ा होना चाहिए');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/hr/employees', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        designation: designation.trim(),
        joinDate: new Date(joinDate).toISOString(),
        salary: Number(salary),
      });
      setMessage('कर्मचारी जुड़ गया ✅');
      setFirstName('');
      setLastName('');
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
        <Input label="पहला नाम (ज़रूरी)" value={firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} />
        <Input label="आख़िरी नाम (ज़रूरी)" value={lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} />
        <Input label="ईमेल (ज़रूरी)" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
        <Input label="फ़ोन" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} />
        <Input label="पद (ज़रूरी)" value={designation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesignation(e.target.value)} />
        <Input label="शामिल होने की तारीख़ (ज़रूरी)" type="date" value={joinDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJoinDate(e.target.value)} />
        <Input label="वेतन (ज़रूरी)" value={salary} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalary(e.target.value)} />
        <Button variant="primary" loading={saving} onClick={() => void submit()}>नया कर्मचारी</Button>
      </Card>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {employees.map((e) => (
          <Card key={e.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{e.name || [e.firstName, e.lastName].filter(Boolean).join(' ') || e.id}</p>
              <p className="text-sm text-slate-500">{e.designation ?? ''} · {e.phone ?? ''}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
