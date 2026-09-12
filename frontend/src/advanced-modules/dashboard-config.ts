export interface DashboardCard {
  moduleId: string;
  title: string;
  route: string;
  permission: string;
  priority: number;
}

export const ADVANCED_DASHBOARD_CARDS: DashboardCard[] = [
  { moduleId:'M23', title:'Security', route:'/security', permission:'security:read', priority:1 },
  { moduleId:'M24', title:'Performance', route:'/performance', permission:'performance:read', priority:2 },
  { moduleId:'M25', title:'Notifications', route:'/notifications', permission:'notification:read', priority:3 },
  { moduleId:'M26', title:'Global Search', route:'/search', permission:'search:use', priority:4 },
  { moduleId:'M27', title:'Analytics', route:'/analytics', permission:'analytics:read', priority:5 },
  { moduleId:'M28', title:'Reports', route:'/reports', permission:'report:read', priority:6 },
  { moduleId:'M29', title:'Mobile & Sync', route:'/mobile', permission:'mobile:use', priority:7 },
  { moduleId:'M30', title:'AI Intelligence', route:'/ai', permission:'ai:use', priority:8 },
  { moduleId:'M31', title:'Workforce', route:'/workforce', permission:'workforce:read', priority:9 },
  { moduleId:'M32', title:'Workflows', route:'/workflows', permission:'workflow:read', priority:10 },
  { moduleId:'M33', title:'Integrations', route:'/connectors', permission:'integration:read', priority:11 },
  { moduleId:'M34', title:'Subscriptions', route:'/subscriptions', permission:'subscription:read', priority:12 },
];
