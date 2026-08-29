/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — SHARED COMPONENTS                     ║
 * ║  Lock Artifact #13 — Reusable UI Components                  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { ReactNode } from 'react';

// ── ProgressBar ──
interface ProgressBarProps {
  percentage: number;
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ProgressBar = ({ percentage, status, size = 'md', showLabel = true }: ProgressBarProps) => {
  const heightClass = size === 'sm' ? 'h-1' : size === 'md' ? 'h-2' : 'h-3';
  const colorClass =
    status === 'completed' ? 'bg-emerald-500' :
    status === 'failed' ? 'bg-red-500' :
    status === 'partial' ? 'bg-orange-500' :
    'bg-indigo-500';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-600 font-medium">{percentage}%</span>
          <span className="text-slate-400 capitalize">{status}</span>
        </div>
      )}
      <div className={`w-full ${heightClass} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${heightClass} ${colorClass} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

// ── StatusBadge ──
interface StatusBadgeProps {
  status: string;
  children?: ReactNode;
}

export const StatusBadge = ({ status, children }: StatusBadgeProps) => {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    validating: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    processing: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    partial: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  };
  const c = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {children}
      {status}
    </span>
  );
};

// ── Card ──
interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

// ── EmptyState ──
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
  <div className="text-center py-12">
    <div className="text-slate-300 mb-3">{icon}</div>
    <p className="text-sm font-medium text-slate-600">{title}</p>
    <p className="text-xs text-slate-400 mt-1">{description}</p>
  </div>
);

// ── FileDropZone ──
interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  children?: ReactNode;
}

export const FileDropZone = ({ onFileSelect, accept = '.csv,.xlsx,.xls,.json', children }: FileDropZoneProps) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) onFileSelect(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-slate-300 transition-colors cursor-pointer"
    >
      <input
        type="file"
        accept={accept}
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        className="hidden"
        id="dropzone-input"
      />
      <label htmlFor="dropzone-input" className="cursor-pointer">
        {children}
      </label>
    </div>
  );
};
