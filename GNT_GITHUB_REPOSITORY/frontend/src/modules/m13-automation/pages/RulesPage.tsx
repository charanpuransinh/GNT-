/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — RULES PAGE                                 ║
 * ║  Lock Artifact #12 — Condition-Action Rule Engine            ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState } from 'react';
import { useAutomationStore } from '../store/automationStore';
import { RuleAPI } from '../services/automationApi';
import {
  ShieldCheck,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  ArrowRight,
  Filter,
  GitBranch,
} from 'lucide-react';

const operatorLabels: Record<string, string> = {
  eq: '=', ne: '≠', gt: '>', lt: '<', gte: '≥', lte: '≤',
  contains: 'contains', starts_with: 'starts with', ends_with: 'ends with',
  in: 'in', not_in: 'not in',
};

const RulesPage = () => {
  const { rules, rulesLoading, setRules, setRulesLoading, addRule, updateRule } = useAutomationStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const res = await RuleAPI.getAll();
      setRules(res.data.data);
    } catch {
      setRules([
        {
          id: 'rule-001',
          tenantId: 't-001',
          name: 'High Value Lead Alert',
          description: 'Notify sales team when lead value exceeds ₹1,00,000',
          condition: { field: 'lead.value', operator: 'gt', value: 100000, logic: 'AND' },
          actions: [{ id: 'a1', type: 'notification', name: 'High Value Alert', config: { channel: 'slack' } }],
          priority: 1,
          status: 'active',
        },
        {
          id: 'rule-002',
          tenantId: 't-001',
          name: 'VIP Customer Tagging',
          description: 'Auto-tag customers with lifetime value > ₹5,00,000',
          condition: { field: 'customer.ltv', operator: 'gt', value: 500000, logic: 'AND' },
          actions: [{ id: 'a1', type: 'update_field', name: 'Tag VIP', config: { field: 'tags', value: 'VIP' } }],
          priority: 2,
          status: 'active',
        },
        {
          id: 'rule-003',
          tenantId: 't-001',
          name: 'Overdue Invoice Escalation',
          description: 'Escalate invoices overdue by more than 30 days',
          condition: { field: 'invoice.daysOverdue', operator: 'gt', value: 30, logic: 'AND' },
          actions: [
            { id: 'a1', type: 'email', name: 'Escalation Email', config: {} },
            { id: 'a2', type: 'notification', name: 'Notify Manager', config: {} },
          ],
          priority: 3,
          status: 'paused',
        },
      ]);
    } finally {
      setRulesLoading(false);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'active' ? 'paused' : 'active';
    try {
      await RuleAPI.toggleStatus(id, next as any);
      updateRule(id, { status: next as any });
    } catch {
      updateRule(id, { status: next as any });
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await RuleAPI.delete(id);
      fetchRules();
    } catch {
      fetchRules();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automation Rules</h1>
          <p className="text-sm text-slate-500 mt-1">Condition-based rule engine for real-time automation</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> New Rule
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {rulesLoading ? (
          <div className="p-12 text-center text-slate-400">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShieldCheck size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No rules configured</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Rule</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Condition</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Priority</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                        <GitBranch size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                        <p className="text-xs text-slate-500">{rule.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono">{rule.condition.field}</code>
                      <span className="text-slate-400 text-xs">{operatorLabels[rule.condition.operator] || rule.condition.operator}</span>
                      <code className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-mono">{String(rule.condition.value)}</code>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-700">#{rule.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      rule.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {rule.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleStatus(rule.id, rule.status)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title={rule.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {rule.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
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

export default RulesPage;
