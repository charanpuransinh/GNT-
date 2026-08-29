import { RouteObject } from 'react-router-dom';
import GSTConfigPage from '../pages/GSTConfigPage';
import GSTCalculationPage from '../pages/GSTCalculationPage';
import GSTReturnsPage from '../pages/GSTReturnsPage';
import GSTR2BReconciliationPage from '../pages/GSTR2BReconciliationPage';
import EWayEInvoicePage from '../pages/EWayEInvoicePage';

export const gstRoutes: RouteObject[] = [
  { path: 'gst/config', element: <GSTConfigPage companyId="" /> },
  { path: 'gst/calc', element: <GSTCalculationPage companyId="" /> },
  { path: 'gst/returns', element: <GSTReturnsPage companyId="" /> },
  { path: 'gst/reconcile', element: <GSTR2BReconciliationPage companyId="" /> },
  { path: 'gst/einvoice', element: <EWayEInvoicePage companyId="" /> },
];
