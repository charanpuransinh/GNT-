export interface AdvancedModuleConfig {
  id: string;
  name: string;
  route: string;
  permission: string;
  icon: string;
  description: string;
  category: 'security' | 'operations' | 'analytics' | 'mobile' | 'ai' | 'hr' | 'automation' | 'billing';
}

export const ADVANCED_MODULE_CONFIG: AdvancedModuleConfig[] = [
  {
    id: 'M23',
    name: 'Security & Governance',
    route: '/security',
    permission: 'security:read',
    icon: 'security',
    description: 'Security, governance, tenant protection and audit.',
    category: 'security',
  },
  {
    id: 'M24',
    name: 'Performance & Cache',
    route: '/performance',
    permission: 'performance:read',
    icon: 'speed',
    description: 'Performance, cache and database optimization.',
    category: 'operations',
  },
  {
    id: 'M25',
    name: 'Real-Time & Notifications',
    route: '/notifications',
    permission: 'notification:read',
    icon: 'notifications',
    description: 'Real-time events and notifications.',
    category: 'operations',
  },
  {
    id: 'M26',
    name: 'Search & Indexing',
    route: '/search',
    permission: 'search:use',
    icon: 'search',
    description: 'Global intelligent search and indexing.',
    category: 'operations',
  },
  {
    id: 'M27',
    name: 'Analytics & Dashboards',
    route: '/analytics',
    permission: 'analytics:read',
    icon: 'analytics',
    description: 'Business analytics, KPI and dashboards.',
    category: 'analytics',
  },
  {
    id: 'M28',
    name: 'Reports & Communication',
    route: '/reports',
    permission: 'report:read',
    icon: 'reports',
    description: 'Reports, exports and communication.',
    category: 'analytics',
  },
  {
    id: 'M29',
    name: 'Mobile & Sync',
    route: '/mobile',
    permission: 'mobile:use',
    icon: 'mobile',
    description: 'Mobile access and offline synchronization.',
    category: 'mobile',
  },
  {
    id: 'M30',
    name: 'AI & Integrations',
    route: '/ai',
    permission: 'ai:use',
    icon: 'ai',
    description: 'AI intelligence and approved integrations.',
    category: 'ai',
  },
  {
    id: 'M31',
    name: 'Workforce & HR Intelligence',
    route: '/workforce',
    permission: 'workforce:read',
    icon: 'people',
    description: 'Talent, recruitment and workforce intelligence.',
    category: 'hr',
  },
  {
    id: 'M32',
    name: 'Workflow & Agents',
    route: '/workflows',
    permission: 'workflow:read',
    icon: 'workflow',
    description: 'Workflow, approvals and controlled agents.',
    category: 'automation',
  },
  {
    id: 'M33',
    name: 'Integration Hub',
    route: '/connectors',
    permission: 'integration:read',
    icon: 'integration',
    description: 'External connectors, webhooks and reliability.',
    category: 'operations',
  },
  {
    id: 'M34',
    name: 'Subscription & Entitlement',
    route: '/subscriptions',
    permission: 'subscription:read',
    icon: 'subscription',
    description: 'Plans, subscriptions, entitlements and usage.',
    category: 'billing',
  },
];

export function getAdvancedModule(
  moduleId: string,
): AdvancedModuleConfig | undefined {
  return ADVANCED_MODULE_CONFIG.find((module) => module.id === moduleId);
}
