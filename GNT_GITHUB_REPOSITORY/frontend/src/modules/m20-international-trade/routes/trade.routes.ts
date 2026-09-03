// GNT M20 — International Trade Routes
// Owner: D4-DELTA

import { createElement, lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const TradeDashboardPage = lazy(() => import('../pages/TradeDashboardPage'));
const BillOfEntryPage = lazy(() => import('../pages/BillOfEntryPage'));

export const internationalTradeRoutes: RouteObject[] = [
  {
    path: 'trade',
    element: createElement(TradeDashboardPage),
    handle: { title: 'International Trade', module: 'M20' },
  },
  {
    path: 'trade/bill-of-entry',
    element: createElement(BillOfEntryPage),
    handle: { title: 'Bill of Entry', module: 'M20' },
  },
];
