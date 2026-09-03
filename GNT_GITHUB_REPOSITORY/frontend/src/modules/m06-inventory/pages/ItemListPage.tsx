// ============================================================================
// M06 INVENTORY — ItemListPage (माल की सूची + खोज + नई/बदलाव, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ItemEntryDrawer } from './ItemEntryDrawer';
import { type Product, type ProductListResponse } from '../types/inventory.types';

export const ItemListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    apiClient
      .get<ProductListResponse>(`/inventory/products?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setProducts(res.data.data ?? []);
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
  }, [search, drawerOpen]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">माल (Items)</h1>
        <Button variant="primary" onClick={() => { setEditing(null); setDrawerOpen(true); }}>+ नई चीज़</Button>
      </div>

      <Input
        label="खोजें"
        placeholder="नाम / कोड / barcode"
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">लोड हो रहा है…</p> : null}

      <div className="space-y-2">
        {products.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-slate-500">
                {p.code ?? 'कोड नहीं'} · HSN {p.hsn_code ?? '—'} · बिक्री ₹{p.sale_price ?? 0} · GST {p.gst_rate ?? 0}%
              </p>
            </div>
            <div className="flex items-center gap-2">
              {p.is_active ? <Badge variant="success">चालू</Badge> : <Badge variant="muted">बंद</Badge>}
              <Button size="sm" variant="secondary" onClick={() => { setEditing(p); setDrawerOpen(true); }}>बदलें</Button>
            </div>
          </Card>
        ))}
        {!loading && products.length === 0 ? <p className="text-sm text-slate-500">कोई माल नहीं</p> : null}
      </div>

      <ItemEntryDrawer
        isOpen={drawerOpen}
        product={editing}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => setDrawerOpen(false)}
      />
    </div>
  );
};
