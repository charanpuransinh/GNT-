/**
 * GNT M16 — Notification Routes
 * Frontend route definitions
 */
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const NotificationCenterPage = lazy(() => import('../pages/NotificationCenterPage'));
const NotificationSettingsPage = lazy(() => import('../pages/NotificationSettingsPage'));

export const notificationRoutes: RouteObject[] = [
  {
    path: 'notifications',
    element: NotificationCenterPage,
    handle: { title: 'Notifications', module: 'M16' },
  },
  {
    path: 'notifications/settings',
    element: NotificationSettingsPage,
    handle: { title: 'Notification Settings', module: 'M16' },
  },
];
