/**
 * M29 — routes/mobile.routes.ts
 * WIRED (2026-09-13): Express adapter over MobileController. Mounted at
 * /api/v1/mobile (module-registry.ts). auth/login and auth/refresh are
 * PRE-AUTH — must be listed in app.ts's PUBLIC_PREFIXES (same treatment as
 * /api/v1/auth/login) or every mobile login attempt 401s before it can run.
 */

import { Router, Request, Response } from 'express';
import { mobileController } from '../controllers/mobile.controller';
import { buildMobileAuthContext } from '../adapters/real-mobile-auth-context';

const router = Router();

function statusFor(errorCode: string): number {
  if (errorCode === 'MOBILE_ACCESS_DENIED') return 403;
  if (errorCode === 'MOBILE_AUTH_FAILED') return 401;
  return 500;
}

router.post('/auth/login', async (req: Request, res: Response) => {
  const result = await mobileController.login(req.body ?? {}, String(req.requestId));
  res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
});

router.post('/auth/refresh', async (req: Request, res: Response) => {
  const result = await mobileController.refresh(String(req.body?.refreshToken ?? ''), String(req.requestId));
  res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
});

router.post('/push/send', async (req: Request, res: Response) => {
  try {
    const auth = await buildMobileAuthContext(req);
    const { deviceToken, message } = req.body ?? {};
    const result = await mobileController.sendPush(auth, deviceToken, message, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

export { router as mobileRoutes };
