/**
 * M18 — Integration Routes
 * Owner: D4-DELTA
 */
import { RouteObject } from 'react-router-dom';
import { GatewayConfigPage } from '../pages/GatewayConfigPage';
import { IntegrationStatusPage } from '../pages/IntegrationStatusPage';
import { APIKeyManagerPage } from '../pages/APIKeyManagerPage';

export const integrationRoutes: RouteObject[] = [
  {
    path: 'integrations/config',
    element: <GatewayConfigPage />,
  },
  {
    path: 'integrations/status',
    element: <IntegrationStatusPage />,
  },
  {
    path: 'integrations/api-keys',
    element: <APIKeyManagerPage />,
  },
];
