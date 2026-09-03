// ============================================================================
// M15 SYNC — SyncDashboardPage (मिलान डैशबोर्ड, ROUGH)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface SyncJob {
  id: string;
  status?: string;
  entity_type?: string;
  entityType?: string;
  created_at?: string;
}

interface Conflict {
  id: string;
  status?: string;
  entity_type?: string;
  entityType?: string;
}

export const SyncDashboardPage: React.FC = () => {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<{ success: boolean; data: SyncJob[] }>('/sync/jobs').then((r) => setJobs(r.data.data ?? [])).catch(() => undefined);
    apiClient.get<{ success: boolean; data: Conflict[] }>('/sync/conflicts').then((r) => setConflicts(r.data.data ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'मिलान-सूची लाने में गलती'));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">मिलान (Sync)</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <h2 className="font-semibold">चालू काम (jobs)</h2>
      <div className="space-y-2">
        {jobs.map((j) => (
          <Card key={j.id} className="flex items-center justify-between">
            <p className="font-medium">{j.entity_type ?? j.entityType ?? j.id}</p>
            <Badge variant="info">{j.status ?? '—'}</Badge>
          </Card>
        ))}
      </div>
      <h2 className="font-semibold">टकराव (conflicts)</h2>
      <div className="space-y-2">
        {conflicts.map((c) => (
          <Card key={c.id} className="flex items-center justify-between">
            <p className="font-medium">{c.entity_type ?? c.entityType ?? c.id}</p>
            <Badge variant="warning">{c.status ?? '—'}</Badge>
          </Card>
        ))}
        {conflicts.length === 0 ? <p className="text-sm text-slate-500">कोई टकराव नहीं ✅</p> : null}
      </div>
    </div>
  );
};
