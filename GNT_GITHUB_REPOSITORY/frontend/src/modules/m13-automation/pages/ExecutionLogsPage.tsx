/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — EXECUTION LOGS PAGE                        ║
 * ║  Lock Artifact #10 — Audit Trail & Debugging                 ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState } from 'react';
import { useAutomationStore } from '../store/automationStore';
import { ExecutionLogAPI } from '../services/automationApi';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  SkipForward,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Terminal,
} from 'lucide-react';

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  running: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  skipped: { icon: SkipForward, color: 'text-slate-500', bg: 'bg-slate-50' },
};

const ExecutionLogsPage = () => {
  const {
    executionLogs,
    logsLoading,
    logsPagination,
    setExecutionLogs,
    setLogsLoading,
    setLogsPagination,
  } = useAutomationStore();

  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [logsPagination.page, statusFilter]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await ExecutionLogAPI.getAll({
        page: logsPagination.page,
        limit: logsPagination.limit,
        status: statusFilter || undefined,
      });
      setExecutionLogs(res.data.data);
      setLogsPagination(res.data.meta || { page: 1, limit: 20, total: 0 });
    } catch {
      setExecutionLogs([
        {
          id: 'log-001',
          tenantId: 't-001',
          workflowId: 'wf-001',
          workflowName: 'New Lead Auto-Response',
          status: 'success',
          startedAt: '2026-08-23T14:30:00Z',
          completedAt: '2026-08-23T14:30:02Z',
          durationMs: 2340,
          triggerData: { leadId: 'L-4521', name: 'Rahul Sharma', email: 'rahul@example.com' },
          actionResults: [
            { actionId: 'a1', actionName: 'Send Welcome Email', status: 'success', output: { messageId: 'msg-123' }, error: null, durationMs: 1800 },
            { actionId: 'a2', actionName: 'Notify Sales Team', status: 'success', output: { notified: true }, error: null, durationMs: 540 },
          ],
          errorMessage: null,
        },
        {
          id: 'log-002',
          tenantId: 't-001',
          workflowId: 'wf-002',
          workflowName: 'Daily Sales Report',
          status: 'success',
          startedAt: '2026-08-23T09:00:00Z',
          completedAt: '2026-08-23T09:00:05Z',
          durationMs: 5120,
          triggerData: { scheduled: true },
          actionResults: [
            { actionId: 'a1', actionName: 'Send Report', status: 'success', output: { reportId: 'rpt-456' }, error: null, durationMs: 4800 },
          ],
          errorMessage: null,
        },
        {
          id: 'log-003',
          tenantId: 't-001',
          workflowId: 'wf-003',
          workflowName: 'Invoice Reminder',
          status: 'failed',
          startedAt: '2026-08-22T10:00:00Z',
          completedAt: '2026-08-22T10:00:01Z',
          durationMs: 890,
          triggerData: { invoiceId: 'INV-789' },
          actionResults: [
            { actionId: 'a1', actionName: 'Reminder Email', status: 'failed', output: {}, error: 'SMTP connection timeout', durationMs: 890 },
          ],
          errorMessage: 'SMTP connection timeout after 3 retries',
        },
      ]);
      setLogsPagination({ page: 1, limit: 20, total: 3 });
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRetry = async (logId: string) => {
    try {
      await ExecutionLogAPI.retry(logId);
      alert('Retry initiated');
    } catch {
      alert('Retry initiated (mock)');
    }
  };

  const selectedLogData = executionLogs.find(l => l.id === selectedLog);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Execution Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Track and debug automation executions</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setLogsPagination({ page: 1 }); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
          </select>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: logsPagination.total, color: 'bg-slate-50 text-slate-700' },
          { label: 'Success', value: executionLogs.filter(l => l.status === 'success').length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Failed', value: executionLogs.filter(l => l.status === 'failed').length, color: 'bg-red-50 text-red-700' },
          { label: 'Pending', value: executionLogs.filter(l => l.status === 'pending').length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Avg Duration', value: executionLogs.length > 0 ? `${Math.round(executionLogs.reduce((s, l) => s + (l.durationMs || 0), 0) / executionLogs.length)}ms` : '0ms', color: 'bg-blue-50 text-blue-700' },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-xl border ${stat.color} border-opacity-20`}>
            <p className="text-xs font-medium opacity-70">{stat.label}</p>
            <p className="text-xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {logsLoading ? (
          <div className="p-12 text-center text-slate-400">Loading logs...</div>
        ) : executionLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Terminal size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No execution logs</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Workflow</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Started</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Duration</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {executionLogs.map((log) => {
                  const config = statusConfig[log.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{log.workflowName}</p>
                        <p className="text-xs text-slate-500 font-mono">{log.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} border-opacity-30`}>
                          <StatusIcon size={13} />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">
                          {new Date(log.startedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-700">{log.durationMs}ms</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {log.status === 'failed' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRetry(log.id); }}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                              title="Retry"
                            >
                              <RefreshCw size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Showing {executionLogs.length} of {logsPagination.total} logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogsPagination({ page: Math.max(1, logsPagination.page - 1) })}
                  disabled={logsPagination.page <= 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-medium text-slate-600">Page {logsPagination.page}</span>
                <button
                  onClick={() => setLogsPagination({ page: logsPagination.page + 1 })}
                  disabled={logsPagination.page * logsPagination.limit >= logsPagination.total}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Log Detail Panel */}
      {selectedLogData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Execution Details — {selectedLogData.id}</h3>
            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
              <XCircle size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Trigger Data</p>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-auto max-h-48">
                {JSON.stringify(selectedLogData.triggerData, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Action Results</p>
              <div className="space-y-2">
                {selectedLogData.actionResults.map((result) => (
                  <div key={result.actionId} className={`p-3 rounded-lg border ${result.status === 'success' ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">{result.actionName}</span>
                      <span className={`text-xs font-medium ${result.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {result.status} · {result.durationMs}ms
                      </span>
                    </div>
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
              {selectedLogData.errorMessage && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs font-medium text-red-700">Error: {selectedLogData.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionLogsPage;
