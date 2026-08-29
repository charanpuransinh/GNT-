/**
 * M18 — Integration Routes
 * Owner: D4-DELTA
 */
import { Router } from 'express';
import { IntegrationController } from '../controllers/integration.controller';
import { WebhookController } from '../controllers/webhook.controller';

export function createIntegrationRoutes(
  integrationController: IntegrationController,
  webhookController: WebhookController,
): Router {
  const router = Router();

  // Integration CRUD
  router.get('/integrations', integrationController.listIntegrations.bind(integrationController));
  router.get('/integrations/:id', integrationController.getIntegration.bind(integrationController));
  router.post('/integrations', integrationController.createIntegration.bind(integrationController));
  router.put('/integrations/:id', integrationController.updateIntegration.bind(integrationController));
  router.delete('/integrations/:id', integrationController.deleteIntegration.bind(integrationController));

  // Gateway testing & status
  router.post('/integrations/test', integrationController.testConnection.bind(integrationController));
  router.get('/integrations/status', integrationController.getGatewayStatus.bind(integrationController));

  // API Keys
  router.post('/integrations/api-keys', integrationController.generateApiKey.bind(integrationController));
  router.get('/integrations/api-keys', integrationController.listApiKeys.bind(integrationController));
  router.delete('/integrations/api-keys/:id', integrationController.revokeApiKey.bind(integrationController));

  // Webhooks (public — no auth required for signature validation)
  router.post('/integrations/webhook/:provider', webhookController.receiveWebhook.bind(webhookController));

  return router;
}
