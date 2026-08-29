/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — TEMPLATES PAGE                             ║
 * ║  Lock Artifact #11 — Pre-built Automation Templates          ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutomationStore } from '../store/automationStore';
import { TemplateAPI } from '../services/automationApi';
import {
  LayoutTemplate,
  Zap,
  Mail,
  Bell,
  ShoppingCart,
  UserPlus,
  FileText,
  ArrowRight,
  Search,
  Sparkles,
} from 'lucide-react';

const categories = ['All', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];

const mockTemplates = [
  {
    id: 'tmpl-001',
    name: 'Welcome New Customer',
    description: 'Send a personalized welcome email when a new customer signs up',
    category: 'Marketing',
    icon: 'Mail',
    trigger: { type: 'event', config: { event: 'customer.created' } },
    actions: [{ id: 'a1', type: 'email', name: 'Welcome Email', config: { template: 'welcome' } }],
    tags: ['onboarding', 'email'],
  },
  {
    id: 'tmpl-002',
    name: 'Abandoned Cart Recovery',
    description: 'Remind customers about items left in their cart after 1 hour',
    category: 'Sales',
    icon: 'ShoppingCart',
    trigger: { type: 'event', config: { event: 'cart.abandoned' } },
    actions: [
      { id: 'a1', type: 'email', name: 'Cart Reminder', config: {} },
      { id: 'a2', type: 'notification', name: 'Alert Sales', config: {} },
    ],
    tags: ['ecommerce', 'recovery'],
  },
  {
    id: 'tmpl-003',
    name: 'Employee Onboarding',
    description: 'Automate onboarding tasks when a new employee is added',
    category: 'HR',
    icon: 'UserPlus',
    trigger: { type: 'event', config: { event: 'employee.created' } },
    actions: [
      { id: 'a1', type: 'email', name: 'Welcome Kit', config: {} },
      { id: 'a2', type: 'create_record', name: 'Create IT Ticket', config: {} },
      { id: 'a3', type: 'notification', name: 'Notify Manager', config: {} },
    ],
    tags: ['hr', 'onboarding'],
  },
  {
    id: 'tmpl-004',
    name: 'Monthly Invoice Reminder',
    description: 'Send payment reminders for invoices due in 3 days',
    category: 'Finance',
    icon: 'FileText',
    trigger: { type: 'schedule', config: { cron: '0 9 * * *' } },
    actions: [{ id: 'a1', type: 'email', name: 'Payment Reminder', config: {} }],
    tags: ['finance', 'billing'],
  },
  {
    id: 'tmpl-005',
    name: 'Slack Alert on High Priority',
    description: 'Send Slack notification when a high-priority ticket is created',
    category: 'Operations',
    icon: 'Bell',
    trigger: { type: 'event', config: { event: 'ticket.created' } },
    actions: [{ id: 'a1', type: 'notification', name: 'Slack Alert', config: { channel: 'slack' } }],
    tags: ['support', 'alerts'],
  },
  {
    id: 'tmpl-006',
    name: 'Lead Scoring & Assignment',
    description: 'Score leads and auto-assign to sales reps based on criteria',
    category: 'Sales',
    icon: 'Sparkles',
    trigger: { type: 'event', config: { event: 'lead.created' } },
    actions: [
      { id: 'a1', type: 'update_field', name: 'Update Score', config: {} },
      { id: 'a2', type: 'notification', name: 'Assign Rep', config: {} },
    ],
    tags: ['sales', 'lead-management'],
  },
];

const iconMap: Record<string, any> = {
  Mail, ShoppingCart, UserPlus, FileText, Bell, Sparkles,
};

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { templates, templatesLoading, setTemplates, setTemplatesLoading } = useAutomationStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await TemplateAPI.getAll();
      setTemplates(res.data.data);
    } catch {
      setTemplates(mockTemplates as any);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const res = await TemplateAPI.createFromTemplate(templateId);
      navigate(`/automation/workflows/${res.data.data.id}/edit`);
    } catch {
      const mockId = `wf-${Date.now()}`;
      navigate(`/automation/workflows/${mockId}/edit`);
    }
  };

  const filtered = (templates.length ? templates : mockTemplates).filter((t: any) => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Start with a pre-built automation template</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      {templatesLoading ? (
        <div className="text-center py-12 text-slate-400">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((template: any) => {
            const Icon = iconMap[template.icon] || LayoutTemplate;
            return (
              <div
                key={template.id}
                className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Icon size={20} className="text-indigo-600" />
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {template.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{template.name}</h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{template.description}</p>
                <div className="flex items-center gap-1.5 mb-4">
                  {template.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{template.actions.length} action{template.actions.length > 1 ? 's' : ''}</span>
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Use Template <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;
