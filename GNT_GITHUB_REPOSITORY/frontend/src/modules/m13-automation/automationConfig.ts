/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — CONSTANTS & CONFIG                         ║
 * ║  Lock Artifact #15 — Module Configuration & Lock File        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

// ── Module Metadata ──
export const M13_MODULE = {
  id: 'M13',
  name: 'Automation',
  version: '2.0.0',
  team: 'TEAM-C',
  session: 'Session-8',
  artifacts: 15,
  status: 'LOCKED',
  lockedAt: '2026-08-23T00:23:00+05:30',
  blueprint: 'GNT MASTER BLUEPRINT V2',
} as const;

// ── API Endpoints ──
export const API_ENDPOINTS = {
  workflows: '/automation/workflows',
  jobs: '/automation/jobs',
  logs: '/automation/logs',
  templates: '/automation/templates',
  rules: '/automation/rules',
  webhooks: '/automation/webhooks',
} as const;

// ── Trigger Type Config ──
export const TRIGGER_CONFIG = {
  schedule: {
    label: 'Schedule',
    description: 'Run on a cron schedule',
    icon: 'Clock',
    fields: ['cronExpression', 'timezone'],
  },
  event: {
    label: 'Event',
    description: 'Trigger when an event occurs',
    icon: 'Zap',
    fields: ['event', 'filters'],
  },
  webhook: {
    label: 'Webhook',
    description: 'Receive HTTP webhook',
    icon: 'Globe',
    fields: ['url', 'secret', 'method'],
  },
  manual: {
    label: 'Manual',
    description: 'Run manually only',
    icon: 'Play',
    fields: [],
  },
} as const;

// ── Action Type Config ──
export const ACTION_CONFIG = {
  email: {
    label: 'Send Email',
    icon: 'Mail',
    color: 'blue',
    fields: ['to', 'subject', 'template', 'cc', 'bcc'],
  },
  notification: {
    label: 'Notification',
    icon: 'Bell',
    color: 'amber',
    fields: ['channel', 'message', 'recipients'],
  },
  webhook: {
    label: 'Webhook Call',
    icon: 'Webhook',
    color: 'purple',
    fields: ['url', 'method', 'headers', 'body'],
  },
  update_field: {
    label: 'Update Field',
    icon: 'Database',
    color: 'emerald',
    fields: ['entity', 'field', 'value'],
  },
  create_record: {
    label: 'Create Record',
    icon: 'Plus',
    color: 'indigo',
    fields: ['entity', 'data'],
  },
  api_call: {
    label: 'API Call',
    icon: 'Globe',
    color: 'slate',
    fields: ['endpoint', 'method', 'payload'],
  },
} as const;

// ── Status Colors ──
export const STATUS_COLORS = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  paused: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  draft: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  archived: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  scheduled: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  disabled: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' },
} as const;

// ── Pagination Defaults ──
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  limitOptions: [10, 20, 50, 100],
} as const;

// ── Lock Verification ──
export const LOCK_CHECKSUM = 'm13-automation-frontend-v2-locked';
export const LOCK_ARTIFACTS = [
  'index.ts',
  'types/automation.types.ts',
  'store/automationStore.ts',
  'services/automationApi.ts',
  'routes/AutomationRoutes.tsx',
  'components/AutomationLayout.tsx',
  'pages/WorkflowListPage.tsx',
  'pages/WorkflowBuilderPage.tsx',
  'pages/ScheduledJobsPage.tsx',
  'pages/ExecutionLogsPage.tsx',
  'pages/TemplatesPage.tsx',
  'pages/RulesPage.tsx',
  'components/shared.tsx',
  'hooks/useAutomation.ts',
  'constants/automationConfig.ts',
] as const;

// ── Feature Flags ──
export const FEATURES = {
  workflowBuilder: true,
  scheduledJobs: true,
  executionLogs: true,
  templates: true,
  rulesEngine: true,
  realTimeLogs: false, // Requires WebSocket
  advancedConditions: false, // Coming in V2.1
} as const;
