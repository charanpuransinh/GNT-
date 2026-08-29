/**
 * M18 — GatewayStatusCard
 * Owner: D4-DELTA
 */
import React from 'react';
import { GatewayStatusDto, GatewayStatus } from '../services/integration.types';

interface Props {
  status: GatewayStatusDto;
  onTest?: () => void;
}

const statusConfig: Record<GatewayStatus, { bg: string; text: string; dot: string; label: string }> = {
  [GatewayStatus.ACTIVE]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Active',
  },
  [GatewayStatus.INACTIVE]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    label: 'Inactive',
  },
  [GatewayStatus.ERROR]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Error',
  },
  [GatewayStatus.PENDING]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Pending',
  },
  [GatewayStatus.DEGRADED]: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    label: 'Degraded',
  },
};

export const GatewayStatusCard: React.FC<Props> = ({ status, onTest }) => {
  const cfg = statusConfig[status.status] ?? statusConfig[GatewayStatus.PENDING];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${cfg.dot} animate-pulse`} />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{status.provider}</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wide">{status.type}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-slate-400 text-xs">Latency</p>
          <p className={`font-medium ${status.latency_ms > 1000 ? 'text-red-600' : 'text-slate-700'}`}>
            {status.latency_ms}ms
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Last Checked</p>
          <p className="font-medium text-slate-700">
            {new Date(status.last_checked).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {status.message && (
        <p className="mt-3 text-xs text-slate-500 line-clamp-2">{status.message}</p>
      )}

      {onTest && (
        <button
          onClick={onTest}
          className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition"
        >
          Test Connection
        </button>
      )}
    </div>
  );
};
