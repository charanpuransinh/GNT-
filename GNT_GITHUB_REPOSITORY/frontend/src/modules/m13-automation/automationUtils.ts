/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — UTILITIES                                  ║
 * ║  Helper functions for Automation Module                        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { AutomationWorkflow, ExecutionLog, AutomationStatus } from '../types/automation.types';

// ── Format Date ──
export const formatDate = (date: string | null, opts?: Intl.DateTimeFormatOptions): string => {
  if (!date) return 'Never';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  });
};

// ── Format Duration ──
export const formatDuration = (ms: number | null): string => {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

// ── Format Number ──
export const formatNumber = (n: number): string => n.toLocaleString('en-IN');

// ── Cron Human Readable ──
export const cronToHuman = (cron: string): string => {
  const map: Record<string, string> = {
    '0 9 * * *': 'Daily at 9:00 AM',
    '0 0 * * *': 'Daily at midnight',
    '0 9 * * 1': 'Every Monday at 9:00 AM',
    '0 0 1 * *': 'First of every month',
    '*/15 * * * *': 'Every 15 minutes',
  };
  return map[cron] || cron;
};

// ── Workflow Status Helpers ──
export const isWorkflowActive = (status: AutomationStatus): boolean => status === 'active';
export const canEditWorkflow = (status: AutomationStatus): boolean => status !== 'archived';
export const canDeleteWorkflow = (status: AutomationStatus): boolean => true;

// ── Execution Summary ──
export const getExecutionSummary = (logs: ExecutionLog[]) => {
  const total = logs.length;
  const success = logs.filter((l) => l.status === 'success').length;
  const failed = logs.filter((l) => l.status === 'failed').length;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
  const avgDuration = total > 0
    ? Math.round(logs.reduce((s, l) => s + (l.durationMs || 0), 0) / total)
    : 0;

  return { total, success, failed, successRate, avgDuration };
};

// ── Deep Clone ──
export const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// ── Slugify ──
export const slugify = (str: string): string =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ── Generate ID ──
export const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
