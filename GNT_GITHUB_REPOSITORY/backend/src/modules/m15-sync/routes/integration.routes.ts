import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

import { IntegrationController } from '../controllers/integration.controller';

const router = Router();

router.post('/', (req: AuthenticatedRequest, res: Response) => IntegrationController.createIntegration(req, res));
router.get('/', (req: AuthenticatedRequest, res: Response) => IntegrationController.listIntegrations(req, res));
router.get('/:id', (req: AuthenticatedRequest, res: Response) => IntegrationController.getIntegration(req, res));
router.patch('/:id', (req: AuthenticatedRequest, res: Response) => IntegrationController.updateIntegration(req, res));
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => IntegrationController.deleteIntegration(req, res));
router.get('/:id/health', (req: AuthenticatedRequest, res: Response) => IntegrationController.healthCheck(req, res));
router.get('/health/all', (req: AuthenticatedRequest, res: Response) => IntegrationController.healthCheckAll(req, res));

export default router;
