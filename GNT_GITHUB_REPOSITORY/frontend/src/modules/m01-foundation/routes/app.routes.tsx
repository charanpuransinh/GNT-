import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const AppShellPage = lazy(() => import('../pages/AppShellPage').then((m) => ({ default: m.AppShellPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ErrorPage = lazy(() => import('../pages/ErrorPage').then((m) => ({ default: m.ErrorPage })));
const MaintenancePage = lazy(() => import('../pages/MaintenancePage').then((m) => ({ default: m.MaintenancePage })));

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppShellPage />,
    errorElement: <ErrorPage />,
    children: [
      // Child routes from other modules will be injected here via route composition
    ],
  },
  {
    path: '/maintenance',
    element: <MaintenancePage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
