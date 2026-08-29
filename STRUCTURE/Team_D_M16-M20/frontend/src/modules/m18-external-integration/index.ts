/**
 * M18 — External Integration Module (Public Exports)
 * Owner: D4-DELTA
 */

// Types
export * from './services/integration.types';

// Services
export { IntegrationApi } from './services/integration.service';

// State
export { useIntegrationStore } from './state/integration.store';

// Validators
export * from './validators/integration.schema';

// Components
export { GatewayStatusCard } from './components/GatewayStatusCard';

// Pages
export { GatewayConfigPage } from './pages/GatewayConfigPage';
export { IntegrationStatusPage } from './pages/IntegrationStatusPage';
export { APIKeyManagerPage } from './pages/APIKeyManagerPage';

// Routes
export { integrationRoutes } from './routes/integration.routes';
