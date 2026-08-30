import { Router } from 'express';
import { appController } from '../controllers/app.controller';
import { authMiddleware } from '@/common/middleware/auth-middleware';
import { apiRateLimiter } from '@/common/middleware/rate-limit';

const router = Router();

// Apply rate limiting to app routes
router.use(apiRateLimiter);

// Public health check — no auth required
router.get('/health', appController.getHealth);

// Public maintenance status — no auth required
router.get('/maintenance', appController.checkMaintenance);

// Protected endpoints
router.get('/config', authMiddleware, appController.getConfig);
router.get('/system-info', authMiddleware, appController.getSystemInfo);

export default router;
