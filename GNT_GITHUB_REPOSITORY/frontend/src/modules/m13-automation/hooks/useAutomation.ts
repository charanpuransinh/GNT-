/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — CUSTOM HOOKS                               ║
 * ║  Lock Artifact #14 — React Hooks for Automation Module       ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useCallback } from 'react';
import { useAutomationStore } from '../store/automationStore';
import { WorkflowAPI, ExecutionLogAPI } from '../services/automationApi';

// ── useWorkflows — Fetch & Cache Workflows ──
export const useWorkflows = (autoFetch = true) => {
  const { workflows, workflowLoading, workflowError, setWorkflows, setWorkflowLoading, setWorkflowError } = useAutomationStore();

  const fetch = useCallback(async () => {
    setWorkflowLoading(true);
    setWorkflowError(null);
    try {
      const res = await WorkflowAPI.getAll();
      setWorkflows(res.data.data);
    } catch (err: any) {
      setWorkflowError(err.message);
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [autoFetch, fetch]);

  return { workflows, loading: workflowLoading, error: workflowError, refetch: fetch };
};

// ── useWorkflow — Single Workflow with Cache ──
export const useWorkflow = (id: string | undefined) => {
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await WorkflowAPI.getById(id);
        setWorkflow(res.data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  return { workflow, loading, error };
};

// ── useExecutionLogs — Paginated Logs ──
export const useExecutionLogs = (page = 1, limit = 20) => {
  const { executionLogs, logsLoading, logsPagination, setExecutionLogs, setLogsLoading, setLogsPagination } = useAutomationStore();

  const fetch = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await ExecutionLogAPI.getAll({ page, limit });
      setExecutionLogs(res.data.data);
      setLogsPagination(res.data.meta || { page, limit, total: 0 });
    } catch (err: any) {
      console.error('[useExecutionLogs]', err);
    } finally {
      setLogsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { logs: executionLogs, loading: logsLoading, pagination: logsPagination, refetch: fetch };
};

// ── useDebounce — Debounced Value ──
export const useDebounce = <T,>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

// ── useToggle — Boolean Toggle ──
export const useToggle = (initial = false) => {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, toggle, setTrue, setFalse, setValue };
};

// ── useLocalStorage — Persist to localStorage ──
export const useLocalStorage = <T,>(key: string, initialValue: T): [T, (val: T) => void] => {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStored(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [stored, setValue];
};
