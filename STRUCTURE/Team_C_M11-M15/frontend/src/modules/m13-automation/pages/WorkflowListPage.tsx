/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — WORKFLOW LIST PAGE                         ║
 * ║  Lock Artifact #7 — CRUD List View with Filters & Actions    ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutomationStore } from '../store/automationStore';
import { WorkflowAPI } from '../services/automationApi';
import {
  Search,
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit3,
  MoreHorizontal,
  Filter,
  Clock,
  Zap,
  Activity,
  ChevronDown,
} from 'lucide-react';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    archived: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  return map[status] || map.draft;
};

const triggerIcon = (type: string) => {
  switch (type) {
    case 'schedule': return <Clock size={14} className="text-blue-500" />;
    case 'event': return <Activity size={14} className="text-purple-500" />;
    case 'webhook': return <Zap size={14} className="text-orange-500" />;
    default: return <Zap size={14} className="text-slate-400" />;
  }
};

const WorkflowListPage = () => {
  const navigate = useNavigate();
  const {
    workflows,
    workflowLoading,
    workflowError,
    filters,
    setWorkflows,
    setWorkflowLoading,
    setWorkflowError,
    setFilters,
    updateWorkflow,
    removeWorkflow,
  } = useAutomationStore();

  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, [filters]);

  const fetchWorkflows = async () => {
    setWorkflowLoading(true);
    setWorkflowError(null);
    try {
      const res = await WorkflowAPI.getAll(filters);
      setWorkflows(res.data.data);
    } catch (err: any) {
      setWorkflowError(err.message || 'Failed to load workflows');
      // TEMP MOCK: Seed data for demo
      setWorkflows([
        {
          id: 'wf-001',
          tenantId: 't-001',
          name: 'New Lead Auto-Response',
          description: 'Send welcome email when a new lead is created',
          status: 'active',
          trigger: { type: 'event', config: { event: 'lead.created' } },
          actions: [{ id: 'a1', type: 'email', name: 'Send Welcome Email', config: {} }],
          executionCount: 1247,
          lastExecutedAt: '2026-08-22T14:30:00Z',
          createdAt: '2026-01-15T10:00:00Z',
          updatedAt: '2026-08-20T09:00:00Z',
          createdBy: 'admin',
        },
        {
          id: 'wf-002',
          tenantId: 't-001',
          name: 'Daily Sales Report',
          description: 'Generate and email daily sales summary at 9 AM',
          status: 'active',
          trigger: { type: 'schedule', config: { cron: '0 9 * * *' } },
          actions: [{ id: 'a1', type: 'email', name: 'Send Report', config: {} }],
          executionCount: 215,
          lastExecutedAt: '2026-08-22T09:00:00Z',
          createdAt: '2026-03-01T08:00:00Z',
          updatedAt: '2026-08-21T10:00:00Z',
          createdBy: 'admin',
        },
        {
          id: 'wf-003',
          tenantId: 't-001',
          name: 'Invoice Reminder',
          description: 'Send payment reminder 3 days before due date',
          status: 'paused',
          trigger: { type: 'schedule', config: { cron: '0 10 * * *' } },
          actions: [
            { id: 'a1', type: 'email', name: 'Reminder Email', config: {} },
            { id: 'a2', type: 'notification', name: 'In-App Alert', config: {} },
          ],
          executionCount: 89,
          lastExecutedAt: '2026-08-18T10:00:00Z',
          createdAt: '2026-05-10T11:00:00Z',
          updatedAt: '2026-08-19T16:00:00Z',
          createdBy: 'admin',
        },
      ]);
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const next = current === 'active' ? 'paused' : 'active';
    try {
      await WorkflowAPI.toggleStatus(id, next as any);
      updateWorkflow(id, { status: next as any });
    } catch {
      updateWorkflow(id, { status: next as any });
    }
    setDropdownOpen(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await WorkflowAPI.delete(id);
      removeWorkflow(id);
    } catch {
      removeWorkflow(id);
    }
    setDropdownOpen(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await WorkflowAPI.duplicate(id);
      fetchWorkflows();
    } catch {
      fetchWorkflows();
    }
    setDropdownOpen(null);
  };

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch = !filters.search ||
      w.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      w.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || w.status === filters.status;
    const matchesTrigger = !filters.triggerType || w.trigger.type === filters.triggerType;
    return matchesSearch && matchesStatus && matchesTrigger;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage automation workflows</p>
        </div>
        <button
          onClick={() => navigate('/automation/workflows/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Workflow
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Workflows', value: workflows.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Active', value: workflows.filter(w => w.status === 'active').length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Paused', value: workflows.filter(w => w.status === 'paused').length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Total Executions', value: workflows.reduce((sum, w) => sum + w.executionCount, 0).toLocaleString(), color: 'bg-blue-50 text-blue-700' },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-xl border ${stat.color} border-opacity-20`}>
            <p className="text-xs font-medium opacity-70">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ status: e.target.value as any || undefined })}
            className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filters.triggerType || ''}
            onChange={(e) => setFilters({ triggerType: e.target.value as any || undefined })}
            className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
          >
            <option value="">All Triggers</option>
            <option value="schedule">Schedule</option>
            <option value="event">Event</option>
            <option value="webhook">Webhook</option>
            <option value="manual">Manual</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        {(filters.search || filters.status || filters.triggerType) && (
          <button
            onClick={() => setFilters({ status: undefined, search: '', triggerType: undefined })}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Workflow List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {workflowLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
            Loading workflows...
          </div>
        ) : workflowError ? (
          <div className="p-12 text-center text-red-500">
            <p className="font-medium">Error loading workflows</p>
            <p className="text-sm mt-1">{workflowError}</p>
            <button
              onClick={fetchWorkflows}
              className="mt-3 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Zap size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No workflows found</p>
            <p className="text-sm mt-1">Create your first automation workflow</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Workflow</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Trigger</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Executions</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Last Run</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkflows.map((workflow) => (
                <tr
                  key={workflow.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Workflow size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-indigo-600"
                          onClick={() => navigate(`/automation/workflows/${workflow.id}`)}
                        >
                          {workflow.name}
                        </p>
                        <p className="text-xs text-slate-500">{workflow.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {triggerIcon(workflow.trigger.type)}
                      <span className="text-sm text-slate-700 capitalize">{workflow.trigger.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(workflow.status)}`}>
                      {workflow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700 font-mono">{workflow.executionCount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">
                      {workflow.lastExecutedAt
                        ? new Date(workflow.lastExecutedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Never'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(workflow.id, workflow.status)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title={workflow.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {workflow.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                      <button
                        onClick={() => navigate(`/automation/workflows/${workflow.id}/edit`)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === workflow.id ? null : workflow.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {dropdownOpen === workflow.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                            <button
                              onClick={() => handleDuplicate(workflow.id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Copy size={14} /> Duplicate
                            </button>
                            <button
                              onClick={() => handleDelete(workflow.id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WorkflowListPage;
