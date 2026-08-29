/**
 * M17 Reporting — Route Definitions
 * Owner: D4-DELTA
 */
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const SalesReportsPage = lazy(() => import('../pages/SalesReportsPage'));
const PurchaseReportsPage = lazy(() => import('../pages/PurchaseReportsPage'));
const InventoryReportsPage = lazy(() => import('../pages/InventoryReportsPage'));
const GSTReportsPage = lazy(() => import('../pages/GSTReportsPage'));
const AccountingReportsPage = lazy(() => import('../pages/AccountingReportsPage'));
const HRReportsPage = lazy(() => import('../pages/HRReportsPage'));

export const reportRoutes: RouteObject[] = [
  {
    path: 'reports/sales',
    element: SalesReportsPage,
    handle: { title: 'Sales Reports', module: 'M17' },
  },
  {
    path: 'reports/purchase',
    element: PurchaseReportsPage,
    handle: { title: 'Purchase Reports', module: 'M17' },
  },
  {
    path: 'reports/inventory',
    element: InventoryReportsPage,
    handle: { title: 'Inventory Reports', module: 'M17' },
  },
  {
    path: 'reports/gst',
    element: GSTReportsPage,
    handle: { title: 'GST Reports', module: 'M17' },
  },
  {
    path: 'reports/accounting',
    element: AccountingReportsPage,
    handle: { title: 'Accounting Reports', module: 'M17' },
  },
  {
    path: 'reports/hr',
    element: HRReportsPage,
    handle: { title: 'HR Reports', module: 'M17' },
  },
];
