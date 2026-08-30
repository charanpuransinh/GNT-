import { Router } from 'express';
import { deviceController } from '../controllers/device.controller';
import { authMiddleware } from '@/common/middleware/auth-middleware';
import { validationMiddleware } from '@/common/middleware/validation-middleware';
import {
  registerDeviceSchema,
  updateDeviceSchema,
  deploymentSettingsSchema,
  checkUpdateQuerySchema,
} from '../validators/device.schema';
import { apiRateLimiter } from '@/common/middleware/rate-limit';

const router = Router();

// Apply rate limiting to device routes
router.use(apiRateLimiter);

// Session management
router.get('/sessions', authMiddleware, deviceController.getActiveSessions);
router.delete('/sessions/:sessionId', authMiddleware, deviceController.terminateSession);
router.delete('/sessions', authMiddleware, deviceController.terminateAllSessions);

// Device registration
router.post('/register', authMiddleware, validationMiddleware(registerDeviceSchema), deviceController.registerDevice);
router.get('/devices', authMiddleware, deviceController.getRegisteredDevices);

// App updates
router.get('/update-check', validationMiddleware(checkUpdateQuerySchema), deviceController.checkForUpdate);
router.post('/download-update', authMiddleware, deviceController.downloadUpdate);

// Deployment settings
router.get('/settings', authMiddleware, deviceController.getDeploymentSettings);
router.put('/settings', authMiddleware, validationMiddleware(deploymentSettingsSchema), deviceController.updateDeploymentSettings);

export default router;