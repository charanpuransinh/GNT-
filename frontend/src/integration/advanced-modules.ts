export interface AdvancedModule {
  id: string;
  name: string;
  route: string;
  permission: string;
  description: string;
}

export const ADVANCED_MODULES: AdvancedModule[] = [
  { id:'M23', name:'Security & Governance', route:'/security', permission:'security:read', description:'Security, tenant isolation, governance and audit.' },
  { id:'M24', name:'Performance & Cache', route:'/performance', permission:'performance:read', description:'Performance, cache and database optimization.' },
  { id:'M25', name:'Real-Time & Notifications', route:'/notifications', permission:'notification:read', description:'Live events and notifications.' },
  { id:'M26', name:'Search & Indexing', route:'/search', permission:'search:use', description:'Global intelligent search.' },
  { id:'M27', name:'Analytics & Dashboards', route:'/analytics', permission:'analytics:read', description:'KPI, analytics and dashboards.' },
  { id:'M28', name:'Reports & Communication', route:'/reports', permission:'report:read', description:'Reports, exports and communication.' },
  { id:'M29', name:'Mobile & Sync', route:'/mobile', permission:'mobile:use', description:'Mobile access and offline synchronization.' },
  { id:'M30', name:'AI & Integrations', route:'/ai', permission:'ai:use', description:'AI intelligence and approved integrations.' },
  { id:'M31', name:'Workforce Intelligence', route:'/workforce', permission:'workforce:read', description:'Talent, recruitment and workforce intelligence.' },
  { id:'M32', name:'Workflow & Agents', route:'/workflows', permission:'workflow:read', description:'Workflow, approvals and controlled AI agents.' },
  { id:'M33', name:'Integration Hub', route:'/connectors', permission:'integration:read', description:'External connectors, webhooks and reliability.' },
  { id:'M34', name:'Subscription & Entitlement', route:'/subscriptions', permission:'subscription:read', description:'Plans, subscriptions, entitlements and usage.' },
];
