/**
 * M23 — routes/security.routes.ts
 * WIRED (2026-09-12): Express adapter over SecurityController. Mounted at
 * /api/v1/security (module-registry.ts). Real auth/tenant/permission checks
 * run globally on /api/v1 before this ever executes (auth-middleware.ts,
 * tenant-middleware.ts, requirePermissionMiddleware) — same pattern as
 * M26/M27.
 */

import { Router, Request, Response } from 'express';
import { securityController } from '../controllers/security.controller';
import { buildSecurityAuthContext } from '../adapters/real-security-auth-context';

const router = Router();

function statusFor(errorCode: string): number {
  if (errorCode === 'SECURITY_ACCESS_DENIED') return 403;
  return 500;
}

router.post('/policy/evaluate', async (req: Request, res: Response) => {
  try {
    const auth = await buildSecurityAuthContext(req);
    const { resource, action, attributes } = req.body ?? {};
    const result = await securityController.evaluatePolicy(auth, resource, action, attributes, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.get('/policy', async (req: Request, res: Response) => {
  try {
    const auth = await buildSecurityAuthContext(req);
    const result = await securityController.listPolicies(auth, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/policy', async (req: Request, res: Response) => {
  try {
    const auth = await buildSecurityAuthContext(req);
    const result = await securityController.createPolicy(auth, req.body ?? {}, String(req.requestId));
    res.status(result.success ? 201 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.get('/retention', async (req: Request, res: Response) => {
  try {
    const auth = await buildSecurityAuthContext(req);
    const result = await securityController.listRetentionPolicies(auth, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/retention', async (req: Request, res: Response) => {
  try {
    const auth = await buildSecurityAuthContext(req);
    const result = await securityController.createRetentionPolicy(auth, req.body ?? {}, String(req.requestId));
    res.status(result.success ? 201 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/retention/execute', async (req: Request, res: Response) => {
  try {
    const auth = await buildSecurityAuthContext(req);
    const result = await securityController.executeRetention(auth, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

export { router as securityRoutes };
