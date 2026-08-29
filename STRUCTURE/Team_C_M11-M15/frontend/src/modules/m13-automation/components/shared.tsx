/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — SHARED COMPONENTS                          ║
 * ║  Lock Artifact #13 — Reusable UI Components                  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { ReactNode } from 'react';

// ── StatusBadge ──
interface StatusBadgeProps {
  status: string;
  children?: ReactNode;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ status, children, size = 'sm' }: StatusBadgeProps) => {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    paused: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    draft: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
    archived: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
    success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    running: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    scheduled: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    disabled: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
  };
  const c = config[status] || config.draft;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${c.bg} ${c.text} ${c.border} ${sizeClass}`}>
      {children}
      {status}
    </span>
  );
};

// ── EmptyState ──
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="text-center py-12">
    <div className="text-slate-300 mb-3">{icon}</div>
    <p className="text-sm font-medium text-slate-600">{title}</p>
    <p className="text-xs text-slate-400 mt-1">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ── Card ──
interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ children, className = '', padding = 'md' }: CardProps) => {
  const padClass = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }[padding];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${padClass} ${className}`}>
      {children}
    </div>
  );
};

// ── PageHeader ──
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ── LoadingSpinner ──
export const LoadingSpinner = ({ size = 32 }: { size?: number }) => (
  <div className="flex items-center justify-center py-12">
    <div
      className="animate-spin border-2 border-indigo-600 border-t-transparent rounded-full"
      style={{ width: size, height: size }}
    />
  </div>
);

// ── ConfirmDialog ──
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-2">{message}</p>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
