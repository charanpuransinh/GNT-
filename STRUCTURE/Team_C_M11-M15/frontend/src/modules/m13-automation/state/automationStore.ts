/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — ZUSTAND STORE                              ║
 * ║  Lock Artifact #3 — State Management                         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  AutomationWorkflow,
  ScheduledJob,
  ExecutionLog,
  AutomationTemplate,
  AutomationRule,
  AutomationFilters,
} from '../types/automation.types';

interface AutomationState {
  // Workflows
  workflows: AutomationWorkflow[];
  selectedWorkflow: AutomationWorkflow | null;
  workflowLoading: boolean;
  workflowError: string | null;

  // Scheduled Jobs
  scheduledJobs: ScheduledJob[];
  jobsLoading: boolean;

  // Execution Logs
  executionLogs: ExecutionLog[];
  logsLoading: boolean;
  logsPagination: { page: number; limit: number; total: number };

  // Templates
  templates: AutomationTemplate[];
  templatesLoading: boolean;

  // Rules
  rules: AutomationRule[];
  rulesLoading: boolean;

  // Filters
  filters: AutomationFilters;

  // UI State
  sidebarOpen: boolean;
  activeTab: 'workflows' | 'schedules' | 'logs' | 'templates' | 'rules';
  builderOpen: boolean;

  // Actions — Workflows
  setWorkflows: (workflows: AutomationWorkflow[]) => void;
  setSelectedWorkflow: (workflow: AutomationWorkflow | null) => void;
  addWorkflow: (workflow: AutomationWorkflow) => void;
  updateWorkflow: (id: string, updates: Partial<AutomationWorkflow>) => void;
  removeWorkflow: (id: string) => void;
  setWorkflowLoading: (loading: boolean) => void;
  setWorkflowError: (error: string | null) => void;

  // Actions — Jobs
  setScheduledJobs: (jobs: ScheduledJob[]) => void;
  setJobsLoading: (loading: boolean) => void;

  // Actions — Logs
  setExecutionLogs: (logs: ExecutionLog[]) => void;
  setLogsLoading: (loading: boolean) => void;
  setLogsPagination: (pagination: Partial<AutomationState['logsPagination']>) => void;

  // Actions — Templates
  setTemplates: (templates: AutomationTemplate[]) => void;
  setTemplatesLoading: (loading: boolean) => void;

  // Actions — Rules
  setRules: (rules: AutomationRule[]) => void;
  setRulesLoading: (loading: boolean) => void;
  addRule: (rule: AutomationRule) => void;
  updateRule: (id: string, updates: Partial<AutomationRule>) => void;

  // Actions — Filters & UI
  setFilters: (filters: Partial<AutomationFilters>) => void;
  resetFilters: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: AutomationState['activeTab']) => void;
  setBuilderOpen: (open: boolean) => void;
}

const initialFilters: AutomationFilters = {
  status: undefined,
  search: '',
  triggerType: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

export const useAutomationStore = create<AutomationState>()(
  devtools(
    persist(
      (set) => ({
        // Initial State
        workflows: [],
        selectedWorkflow: null,
        workflowLoading: false,
        workflowError: null,

        scheduledJobs: [],
        jobsLoading: false,

        executionLogs: [],
        logsLoading: false,
        logsPagination: { page: 1, limit: 20, total: 0 },

        templates: [],
        templatesLoading: false,

        rules: [],
        rulesLoading: false,

        filters: initialFilters,

        sidebarOpen: true,
        activeTab: 'workflows',
        builderOpen: false,

        // Workflow Actions
        setWorkflows: (workflows) => set({ workflows }),
        setSelectedWorkflow: (workflow) => set({ selectedWorkflow: workflow }),
        addWorkflow: (workflow) =>
          set((state) => ({ workflows: [workflow, ...state.workflows] })),
        updateWorkflow: (id, updates) =>
          set((state) => ({
            workflows: state.workflows.map((w) =>
              w.id === id ? { ...w, ...updates } : w
            ),
          })),
        removeWorkflow: (id) =>
          set((state) => ({
            workflows: state.workflows.filter((w) => w.id !== id),
          })),
        setWorkflowLoading: (loading) => set({ workflowLoading: loading }),
        setWorkflowError: (error) => set({ workflowError: error }),

        // Job Actions
        setScheduledJobs: (jobs) => set({ scheduledJobs: jobs }),
        setJobsLoading: (loading) => set({ jobsLoading: loading }),

        // Log Actions
        setExecutionLogs: (logs) => set({ executionLogs: logs }),
        setLogsLoading: (loading) => set({ logsLoading: loading }),
        setLogsPagination: (pagination) =>
          set((state) => ({
            logsPagination: { ...state.logsPagination, ...pagination },
          })),

        // Template Actions
        setTemplates: (templates) => set({ templates }),
        setTemplatesLoading: (loading) => set({ templatesLoading: loading }),

        // Rule Actions
        setRules: (rules) => set({ rules }),
        setRulesLoading: (loading) => set({ rulesLoading: loading }),
        addRule: (rule) => set((state) => ({ rules: [rule, ...state.rules] })),
        updateRule: (id, updates) =>
          set((state) => ({
            rules: state.rules.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          })),

        // Filter & UI Actions
        setFilters: (filters) =>
          set((state) => ({ filters: { ...state.filters, ...filters } })),
        resetFilters: () => set({ filters: initialFilters }),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setActiveTab: (tab) => set({ activeTab: tab }),
        setBuilderOpen: (open) => set({ builderOpen: open }),
      }),
      {
        name: 'm13-automation-store',
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          activeTab: state.activeTab,
          filters: state.filters,
        }),
      }
    ),
    { name: 'AutomationStore' }
  )
);
