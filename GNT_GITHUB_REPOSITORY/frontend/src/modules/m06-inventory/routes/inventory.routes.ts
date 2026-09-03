// GNT M06 — Frontend Route Definitions
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { ItemListPage } from '../pages/ItemListPage';
import { CategoryUnitPage } from '../pages/CategoryUnitPage';
import { StockTransferPage } from '../pages/StockTransferPage';
import { StockAdjustmentPage } from '../pages/StockAdjustmentPage';
import { LowStockAlertPage } from '../pages/LowStockAlertPage';

export const inventoryRoutes: RouteObject[] = [
  { path: 'inventory/items', element: React.createElement(ItemListPage) },
  { path: 'inventory/categories', element: React.createElement(CategoryUnitPage) },
  { path: 'inventory/stock-transfer', element: React.createElement(StockTransferPage) },
  { path: 'inventory/stock-adjustment', element: React.createElement(StockAdjustmentPage) },
  { path: 'inventory/low-stock', element: React.createElement(LowStockAlertPage) },
];
