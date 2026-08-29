/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — WORKFLOW BUILDER PAGE                      ║
 * ║  Lock Artifact #8 — Visual Workflow Editor (Create/Edit/View) ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAutomationStore } from '../store/automationStore';
import { WorkflowAPI } from '../services/automationApi';
import {
  ArrowLeft,
  Save,
  Play,
  Trash2,
  Plus,
  GripVertical,
  Mail,
  Bell,
  Webhook,
  Database,
  Globe,
  Clock,
  Zap,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

interface BuilderProps {
  mode: 'create' | 'edit' | 'view';
}

const triggerTypes = [
  { type: 'schedule', label: 'Schedule', icon: Clock, desc: 'Run on a cron schedule' },
  { type: 'event', label: 'Event', icon: Zap, desc: 'Trigger when an event occurs' },
  { type: 'webhook', label: 'Webhook', icon: Globe, desc: 'Receive HTTP webhook' },
  { type: 'manual', label: 'Manual', icon: Play, desc: 'Run manually only' },
];

const actionTypes = [
  { type: 'email', label: 'Send Email', icon: Mail, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { type: 'notification', label: 'Notification', icon: Bell, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { type: 'webhook', label: 'Webhook Call', icon: Webhook, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { type: 'update_field', label: 'Update Field', icon: Database, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { type: 'create_record', label: 'Create Record', icon: Plus, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { type: 'api_call', label: 'API Call', icon: Globe, color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

const WorkflowBuilderPage = ({ mode }: BuilderProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedWorkflow, setSelectedWorkflow, addWorkflow, updateWorkflow } = useAutomationStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('event');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({ event: 'lead.created' });
  const [actions, setActions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);

  const isView = mode === 'view';
  const isCreate = mode === 'create';

  useEffect(() => {
    if (!isCreate && id) {
      loadWorkflow(id);
    }
    return () => setSelectedWorkflow(null);
  }, [id, mode]);

  const loadWorkflow = async (workflowId: string) => {
    try {
      const res = await WorkflowAPI.getById(workflowId);
      const wf = res.data.data;
      setSelectedWorkflow(wf);
      setName(wf.name);
      setDescription(wf.description);
      setTriggerType(wf.trigger.type);
      setTriggerConfig(wf.trigger.config);
      setActions(wf.actions);
    } catch {
      // TEMP MOCK
      const mockWf = {
        id: workflowId,
        tenantId: 't-001',
        name: 'New Lead Auto-Response',
        description: 'Send welcome email when a new lead is created',
        status: 'active',
        trigger: { type: 'event', config: { event: 'lead.created' } },
        actions: [
          { id: 'a1', type: 'email', name: 'Send Welcome Email', config: { template: 'welcome', to: '{{lead.email}}' } },
          { id: 'a2', type: 'notification', name: 'Notify Sales Team', config: { channel: 'slack', message: 'New lead: {{lead.name}}' } },
        ],
        executionCount: 1247,
        lastExecutedAt: '2026-08-22T14:30:00Z',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-08-20T09:00:00Z',
        createdBy: 'admin',
      };
      setSelectedWorkflow(mockWf);
      setName(mockWf.name);
      setDescription(mockWf.description);
      setTriggerType(mockWf.trigger.type);
      setTriggerConfig(mockWf.trigger.config);
      setActions(mockWf.actions);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name,
      description,
      trigger: { type: triggerType, config: triggerConfig },
      actions,
    };
    try {
      if (isCreate) {
        const res = await WorkflowAPI.create(payload);
        addWorkflow(res.data.data);
        navigate(`/automation/workflows/${res.data.data.id}`);
      } else if (id) {
        const res = await WorkflowAPI.update(id, payload);
        updateWorkflow(id, res.data.data);
      }
    } catch {
      // TEMP MOCK
      const mockId = id || `wf-${Date.now()}`;
      const mockWf = { id: mockId, ...payload, tenantId: 't-001', status: 'draft', executionCount: 0, lastExecutedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin' } as any;
      if (isCreate) addWorkflow(mockWf);
      else updateWorkflow(mockId, mockWf);
      if (isCreate) navigate(`/automation/workflows/${mockId}`);
    } finally {
      setSaving(false);
    }
  };

  const addAction = (type: string) => {
    const actionDef = actionTypes.find(a => a.type === type);
    if (!actionDef) return;
    const newAction = {
      id: `a-${Date.now()}`,
      type,
      name: actionDef.label,
      config: {},
    };
    setActions([...actions, newAction]);
    setShowActionPicker(false);
  };

  const removeAction = (actionId: string) => {
    setActions(actions.filter(a => a.id !== actionId));
  };

  const updateActionConfig = (actionId: string, config: Record<string, any>) => {
    setActions(actions.map(a => a.id === actionId ? { ...a, config } : a));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/automation/workflows')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isCreate ? 'New Workflow' : isView ? name : `Edit: ${name}`}
            </h1>
            <p className="text-xs text-slate-500">
              {isView ? 'View workflow details' : isCreate ? 'Build a new automation' : 'Modify workflow configuration'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isView && (
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={15} />
              {saving ? 'Saving...' : isCreate ? 'Create Workflow' : 'Save Changes'}
            </button>
          )}
          {isView && (
            <button
              onClick={() => navigate(`/automation/workflows/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Edit3 size={15} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Workflow Name & Description */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Workflow Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isView}
            placeholder="e.g., New Lead Auto-Response"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isView}
            placeholder="What does this workflow do?"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
          />
        </div>
      </div>

      {/* Trigger Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Trigger</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {triggerTypes.map((t) => {
            const Icon = t.icon;
            const selected = triggerType === t.type;
            return (
              <button
                key={t.type}
                onClick={() => !isView && setTriggerType(t.type)}
                disabled={isView}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                } ${isView ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <Icon size={20} className={selected ? 'text-indigo-600' : 'text-slate-400'} />
                <p className="text-sm font-semibold mt-2 text-slate-900">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            );
          })}
        </div>
        {/* Trigger Config */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Trigger Configuration</p>
          {triggerType === 'event' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Event:</span>
              <select
                value={triggerConfig.event || ''}
                onChange={(e) => setTriggerConfig({ event: e.target.value })}
                disabled={isView}
                className="text-sm border border-slate-200 rounded px-2 py-1 bg-white disabled:bg-slate-100"
              >
                <option value="lead.created">lead.created</option>
                <option value="lead.updated">lead.updated</option>
                <option value="invoice.paid">invoice.paid</option>
                <option value="user.signup">user.signup</option>
              </select>
            </div>
          )}
          {triggerType === 'schedule' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Cron:</span>
              <input
                type="text"
                value={triggerConfig.cron || '0 9 * * *'}
                onChange={(e) => setTriggerConfig({ cron: e.target.value })}
                disabled={isView}
                className="text-sm border border-slate-200 rounded px-2 py-1 bg-white disabled:bg-slate-100 font-mono"
              />
              <span className="text-xs text-slate-400">Daily at 9:00 AM</span>
            </div>
          )}
          {triggerType === 'webhook' && (
            <div className="text-sm text-slate-600">
              Webhook URL: <code className="bg-white px-2 py-0.5 rounded border text-xs font-mono">/api/v1/automation/webhooks/{id || 'new'}</code>
            </div>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Actions</h2>
            <span className="text-xs text-slate-400">({actions.length})</span>
          </div>
          {!isView && (
            <button
              onClick={() => setShowActionPicker(!showActionPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus size={14} /> Add Action
            </button>
          )}
        </div>

        {/* Action Picker */}
        {showActionPicker && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700">Select an action</p>
              <button onClick={() => setShowActionPicker(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {actionTypes.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.type}
                    onClick={() => addAction(a.type)}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${a.color} hover:shadow-sm transition-all text-left`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action List */}
        <div className="space-y-3">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <Plus size={24} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No actions yet</p>
              <p className="text-xs mt-1">Add an action to define what happens when triggered</p>
            </div>
          ) : (
            actions.map((action, index) => {
              const actionDef = actionTypes.find(a => a.type === action.type);
              const Icon = actionDef?.icon || Plus;
              return (
                <div key={action.id} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <GripVertical size={16} className="text-slate-300 cursor-grab" />
                    <span className="text-[10px] font-bold text-slate-300">{index + 1}</span>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${actionDef?.color.split(' ')[0] || 'bg-slate-50'}`}>
                    <Icon size={18} className={actionDef?.color.split(' ')[1] || 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{action.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{action.type}</span>
                    </div>
                    {/* Action Config (simplified) */}
                    <div className="mt-2 flex items-center gap-2">
                      {action.type === 'email' && (
                        <>
                          <span className="text-xs text-slate-500">To:</span>
                          <input
                            type="text"
                            value={action.config.to || ''}
                            onChange={(e) => updateActionConfig(action.id, { ...action.config, to: e.target.value })}
                            disabled={isView}
                            placeholder="{{lead.email}}"
                            className="text-xs border border-slate-200 rounded px-2 py-1 w-48 disabled:bg-slate-50"
                          />
                        </>
                      )}
                      {action.type === 'notification' && (
                        <>
                          <span className="text-xs text-slate-500">Channel:</span>
                          <select
                            value={action.config.channel || 'slack'}
                            onChange={(e) => updateActionConfig(action.id, { ...action.config, channel: e.target.value })}
                            disabled={isView}
                            className="text-xs border border-slate-200 rounded px-2 py-1 disabled:bg-slate-50"
                          >
                            <option value="slack">Slack</option>
                            <option value="email">Email</option>
                            <option value="push">Push</option>
                          </select>
                        </>
                      )}
                    </div>
                  </div>
                  {!isView && (
                    <button
                      onClick={() => removeAction(action.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Execution Preview */}
      {isView && selectedWorkflow && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Execution History</h2>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-500">Total Executions</p>
              <p className="text-lg font-bold text-slate-900">{selectedWorkflow.executionCount.toLocaleString()}</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Last Run</p>
              <p className="text-lg font-bold text-slate-900">
                {selectedWorkflow.lastExecutedAt
                  ? new Date(selectedWorkflow.lastExecutedAt).toLocaleString('en-IN')
                  : 'Never'}
              </p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                selectedWorkflow.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {selectedWorkflow.status === 'active' ? <Check size={12} className="mr-1" /> : <Pause size={12} className="mr-1" />}
                {selectedWorkflow.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilderPage;
