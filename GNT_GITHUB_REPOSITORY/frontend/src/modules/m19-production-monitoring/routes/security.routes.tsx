import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

const ActivityLogPage = lazy(() => import('../pages/ActivityLogPage'));
const LoginHistoryPage = lazy(() => import('../pages/LoginHistoryPage'));
const PermissionTrackerPage = lazy(() => import('../pages/PermissionTrackerPage'));
const SystemHealthPage = lazy(() => import('../pages/SystemHealthPage'));

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
    <Component />
  </Suspense>
);

export const securityRoutes: RouteObject[] = [
  { path: 'monitoring/activity-log', element: wrap(ActivityLogPage) },
  { path: 'monitoring/login-history', element: wrap(LoginHistoryPage) },
  { path: 'monitoring/permissions', element: wrap(PermissionTrackerPage) },
  { path: 'monitoring/system-health', element: wrap(SystemHealthPage) },
];
