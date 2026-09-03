// ============================================================================
// M06 INVENTORY — LowStockAlertPage (कम माल की चेतावनी, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { type LowStockItem, type LowStockResponse } from '../types/inventory.types';

export const LowStockAlertPage: React.FC = () => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<LowStockResponse>('/inventory/stock/low')
      .then((res) => setItems(res.data.data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'सूची लाने में गलती'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">कम माल की चेतावनी</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">लोड हो रहा है…</p> : null}
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.name ?? item.product_name ?? item.id}</p>
              <p className="text-sm text-slate-500">
                बचा: {item.quantity} · सीमा: {item.reorder_level ?? item.min_stock ?? '—'}
              </p>
            </div>
            <Badge variant="warning">कम है</Badge>
          </Card>
        ))}
        {!loading && items.length === 0 ? <p className="text-sm text-slate-500">कोई कम माल नहीं ✅</p> : null}
      </div>
    </div>
  );
};
