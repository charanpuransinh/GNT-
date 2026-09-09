import { authMiddleware } from '@/common/middleware/auth-middleware';
import { apiRateLimiter } from '@/common/middleware/rate-limit';
import { validationMiddleware } from '@/common/middleware/validation-middleware';
import { Router } from 'express';
import { deviceController } from '../controllers/device.controller';
import {
  checkUpdateQuerySchema,
  deploymentSettingsSchema,
  publishReleaseSchema,
  registerDeviceSchema,
  updateDeviceSchema,
} from '../validators/device.schema';

const router = Router();

// Apply rate limiting to device routes
router.use(apiRateLimiter);

// Session management
router.get('/sessions', authMiddleware, deviceController.getActiveSessions);
router.delete('/sessions/:sessionId', authMiddleware, deviceController.terminateSession);
router.delete('/sessions', authMiddleware, deviceController.terminateAllSessions);

// Device registration
router.post(
  '/register',
  authMiddleware,
  validationMiddleware(registerDeviceSchema),
  deviceController.registerDevice
);
router.get('/devices', authMiddleware, deviceController.getRegisteredDevices);

// App updates
router.get(
  '/update-check',
  validationMiddleware(checkUpdateQuerySchema),
  deviceController.checkForUpdate
);
router.post('/download-update', authMiddleware, deviceController.downloadUpdate);

// App releases — असली version store (owner/admin publish करता है; कोई हार्डकोडेड नहीं)
router.get('/releases', authMiddleware, deviceController.listReleases);
router.post(
  '/releases',
  authMiddleware,
  validationMiddleware(publishReleaseSchema),
  deviceController.publishRelease
);

// Deployment settings
router.get('/settings', authMiddleware, deviceController.getDeploymentSettings);
router.put(
  '/settings',
  authMiddleware,
  validationMiddleware(deploymentSettingsSchema),
  deviceController.updateDeploymentSettings
);

export default router;
