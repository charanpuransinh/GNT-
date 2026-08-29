/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — LAYOUT COMPONENT                           ║
 * ║  Lock Artifact #6 — Module Shell with Sidebar + Header       ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAutomationStore } from '../store/automationStore';
import {
  Workflow,
  CalendarClock,
  ScrollText,
  LayoutTemplate,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  Bell,
  Settings,
} from 'lucide-react';

const navItems = [
  { key: 'workflows' as const, label: 'Workflows', icon: Workflow, path: '/automation/workflows' },
  { key: 'schedules' as const, label: 'Schedules', icon: CalendarClock, path: '/automation/schedules' },
  { key: 'logs' as const, label: 'Execution Logs', icon: ScrollText, path: '/automation/logs' },
  { key: 'templates' as const, label: 'Templates', icon: LayoutTemplate, path: '/automation/templates' },
  { key: 'rules' as const, label: 'Rules', icon: ShieldCheck, path: '/automation/rules' },
];

const AutomationLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, setActiveTab } = useAutomationStore();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleNavClick = (item: typeof navItems[0]) => {
    setActiveTab(item.key);
    navigate(item.path);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo Area */}
        <div className="flex items-center h-16 px-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white">
              <Zap size={18} />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">Automation</h1>
                <p className="text-[10px] text-slate-500 leading-tight">M13 Module</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item)}
                className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Toggle */}
        <div className="p-2 border-t border-slate-100">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-full gap-2 px-3 py-2 text-xs font-medium text-slate-500 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Live
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">Tenant: <span className="font-mono text-slate-700">gnt-prod</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <Settings size={18} />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AutomationLayout;
