/**
 * M17 Reporting — Route Definitions
 * Owner: D4-DELTA
 */
import { createElement, lazy } from 'react';
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
    element: createElement(SalesReportsPage),
    handle: { title: 'Sales Reports', module: 'M17' },
  },
  {
    path: 'reports/purchase',
    element: createElement(PurchaseReportsPage),
    handle: { title: 'Purchase Reports', module: 'M17' },
  },
  {
    path: 'reports/inventory',
    element: createElement(InventoryReportsPage),
    handle: { title: 'Inventory Reports', module: 'M17' },
  },
  {
    path: 'reports/gst',
    element: createElement(GSTReportsPage),
    handle: { title: 'GST Reports', module: 'M17' },
  },
  {
    path: 'reports/accounting',
    element: createElement(AccountingReportsPage),
    handle: { title: 'Accounting Reports', module: 'M17' },
  },
  {
    path: 'reports/hr',
    element: createElement(HRReportsPage),
    handle: { title: 'HR Reports', module: 'M17' },
  },
];
