/**
 * M18 — IntegrationStatusPage
 * Owner: D4-DELTA
 * Purpose: Live connection status dashboard
 */
import React, { useEffect, useState } from 'react';
import { useIntegrationStore } from '../state/integration.store';
import { IntegrationApi } from '../services/integration.service';
import { GatewayStatusCard } from '../components/GatewayStatusCard';
import { GatewayType } from '../services/integration.types';

export const IntegrationStatusPage: React.FC = () => {
  const store = useIntegrationStore();
  const [filter, setFilter] = useState<GatewayType | 'all'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const companyId = 'current-company-id'; // Inject from auth context

  useEffect(() => {
    loadStatus();
  }, [filter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadStatus();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, filter]);

  const loadStatus = async () => {
    store.setLoading(true);
    try {
      const type = filter === 'all' ? undefined : filter;
      const res = await IntegrationApi.status(companyId, type);
      store.setStatusMap(res.data);
      setLastRefresh(new Date());
    } catch (e: any) {
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  };

  const handleTest = async (provider: string) => {
    const integration = store.integrations.find((i) => i.provider === provider);
    if (!integration) return;
    try {
      await IntegrationApi.test(integration.id);
      loadStatus();
    } catch (e: any) {
      store.setError(e.message);
    }
  };

  const filtered = filter === 'all' 
    ? store.statusMap 
    : store.statusMap.filter((s) => s.type === filter);

  const stats = {
    total: filtered.length,
    active: filtered.filter((s) => s.status === 'active').length,
    error: filtered.filter((s) => s.status === 'error').length,
    degraded: filtered.filter((s) => s.status === 'degraded').length,
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integration Status</h1>
          <p className="mt-1 text-sm text-slate-500">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={loadStatus}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900' },
          { label: 'Active', value: stats.active, color: 'text-emerald-600' },
          { label: 'Error', value: stats.error, color: 'text-red-600' },
          { label: 'Degraded', value: stats.degraded, color: 'text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {['all', ...Object.values(GatewayType)].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === t
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t === 'all' ? 'All' : t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {store.isLoading ? (
          <p className="col-span-full text-sm text-slate-500">Loading status...</p>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm text-slate-500">No gateways found for selected filter.</p>
          </div>
        ) : (
          filtered.map((s) => (
            <GatewayStatusCard
              key={`${s.type}-${s.provider}`}
              status={s}
              onTest={() => handleTest(s.provider)}
            />
          ))
        )}
      </div>
    </div>
  );
};
