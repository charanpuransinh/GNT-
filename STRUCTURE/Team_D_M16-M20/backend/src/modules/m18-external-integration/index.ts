/**
 * M18 — External Integration Module (Public Exports)
 * Owner: D4-DELTA
 */

// Types
export * from './types/integration.types';

// Validators
export * from './validators/integration.schema';

// Models
export * from './models/integration.model';

// Repository
export { IntegrationRepository } from './repositories/integration.repository';

// Services
export { IntegrationService } from './services/integration.service';
export { GatewayService } from './services/gateway.service';
export { WebhookService } from './services/webhook.service';

// Events
export * from './events/integration.events';
export { IntegrationEventHandlers } from './events/integration.handlers';

// Controllers
export { IntegrationController } from './controllers/integration.controller';
export { WebhookController } from './controllers/webhook.controller';

// Routes
export { createIntegrationRoutes } from './routes/integration.routes';
