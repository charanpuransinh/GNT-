// GNT M20 — International Trade Dashboard
// Owner: D4-DELTA
// Overview of shipments, quick access to FX rates and HSN lookup

import React, { useEffect, useState } from 'react';
import { listTradeJobs, getFXRates } from '../services/internationalTrade.service';
import { TradeJob, FXRate, TradeStatus } from '../services/internationalTrade.types';
import { FXRateCard } from '../components/FXRateCard';

const statusColor: Record<TradeStatus, string> = {
  draft: '#94a3b8',
  submitted: '#3b82f6',
  under_review: '#f59e0b',
  customs_cleared: '#10b981',
  completed: '#059669',
  cancelled: '#ef4444',
};

export const TradeDashboardPage: React.FC = () => {
  const [jobs, setJobs] = useState<TradeJob[]>([]);
  const [rates, setRates] = useState<FXRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'import' | 'export'>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [jobsRes, ratesRes] = await Promise.all([
          listTradeJobs(filterType === 'all' ? undefined : { type: filterType }),
          getFXRates('INR'),
        ]);
        setJobs(Array.isArray(jobsRes) ? jobsRes : (jobsRes as any).data ?? []);
        setRates(ratesRes);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterType]);

  const counts = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.status] = (acc[j.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>International Trade</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            Import/export shipments, HSN, customs duty & FX
          </p>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
        >
          <option value="all">All Shipments</option>
          <option value="import">Imports</option>
          <option value="export">Exports</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 20 }}>
        {(['draft', 'submitted', 'under_review', 'customs_cleared', 'completed'] as TradeStatus[]).map((s) => (
          <div key={s} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: statusColor[s], marginBottom: 8 }} />
            <div style={{ fontSize: 22, fontWeight: 700 }}>{counts[s] ?? 0}</div>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{s.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 24 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Shipments</h3>
          {loading ? (
            <p style={{ color: '#94a3b8' }}>Loading...</p>
          ) : jobs.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No shipments yet.</p>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              {jobs.slice(0, 10).map((j) => (
                <div
                  key={j.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{j.reference_no}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{j.type} · HSN {j.hsn_code}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: `${statusColor[j.status]}20`,
                      color: statusColor[j.status],
                      alignSelf: 'center',
                    }}
                  >
                    {j.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>FX Rates (Base: INR)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rates.slice(0, 4).map((r) => (
              <FXRateCard key={`${r.base_currency}-${r.target_currency}`} rate={r} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDashboardPage;
