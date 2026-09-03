// ============================================================================
// M06 INVENTORY — CategoryUnitPage (वर्ग/इकाई, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type Category, type CategoryListResponse } from '../types/inventory.types';

export const CategoryUnitPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = () => {
    setLoading(true);
    setError('');
    apiClient
      .get<CategoryListResponse>('/inventory/categories')
      .then((res) => setCategories(res.data.data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'सूची लाने में गलती'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const submit = async () => {
    if (!name.trim()) {
      setError('नाम ज़रूरी है');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/inventory/categories', { name: name.trim(), code: code.trim() || null });
      setName('');
      setCode('');
      fetchCategories();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'सहेजने में गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">वर्ग (Categories)</h1>
      <Card className="space-y-3 max-w-xl">
        <Input label="वर्ग का नाम (ज़रूरी)" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
        <Input label="कोड" value={code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)} />
        <Button variant="primary" loading={saving} onClick={() => void submit()}>नया वर्ग बनाएँ</Button>
      </Card>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">लोड हो रहा है…</p> : null}
      <div className="space-y-2">
        {categories.map((c) => (
          <Card key={c.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-slate-500">{c.code ?? 'कोड नहीं'}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
