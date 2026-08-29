import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const DeviceSessionsPage = lazy(() =>
  import('../pages/DeviceSessionsPage').then((m) => ({ default: m.DeviceSessionsPage }))
);
const AppUpdatePage = lazy(() =>
  import('../pages/AppUpdatePage').then((m) => ({ default: m.AppUpdatePage }))
);
const DeploymentSettingsPage = lazy(() =>
  import('../pages/DeploymentSettingsPage').then((m) => ({ default: m.DeploymentSettingsPage }))
);

export const deviceRoutes: RouteObject[] = [
  {
    path: '/device-sessions',
    element: <DeviceSessionsPage />,
  },
  {
    path: '/app-update',
    element: <AppUpdatePage />,
  },
  {
    path: '/deployment-settings',
    element: <DeploymentSettingsPage />,
  },
];
