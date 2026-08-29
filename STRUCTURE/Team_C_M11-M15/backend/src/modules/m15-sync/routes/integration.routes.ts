import { Router } from 'express';
import { IntegrationController } from '../controllers/integration.controller';

const router = Router();

router.post('/', IntegrationController.createIntegration);
router.get('/', IntegrationController.listIntegrations);
router.get('/:id', IntegrationController.getIntegration);
router.patch('/:id', IntegrationController.updateIntegration);
router.delete('/:id', IntegrationController.deleteIntegration);
router.get('/:id/health', IntegrationController.healthCheck);
router.get('/health/all', IntegrationController.healthCheckAll);

export default router;
