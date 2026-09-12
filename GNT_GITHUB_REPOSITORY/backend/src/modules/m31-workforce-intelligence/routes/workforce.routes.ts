/**
 * M31 — routes/workforce.routes.ts
 * WIRED (2026-09-13): Express adapter over WorkforceController. Mounted at
 * /api/v1/workforce (module-registry.ts). Same auth/tenant/permission
 * pattern as M23/M24/M26/M27/M28/M29.
 */

import { Router, Request, Response } from 'express';
import { workforceController } from '../controllers/workforce.controller';
import { buildWorkforceAuthContext } from '../adapters/real-workforce-auth-context';

const router = Router();

function statusFor(errorCode: string): number {
  if (errorCode === 'WORKFORCE_ACCESS_DENIED') return 403;
  if (errorCode === 'WORKFORCE_NOT_FOUND') return 404;
  return 500;
}

router.get('/talent-profile/:employeeId', async (req: Request, res: Response) => {
  try {
    const auth = await buildWorkforceAuthContext(req);
    const result = await workforceController.getTalentProfile(auth, String(req.params.employeeId), String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.put('/talent-profile', async (req: Request, res: Response) => {
  try {
    const auth = await buildWorkforceAuthContext(req);
    const result = await workforceController.upsertTalentProfile(auth, req.body ?? {}, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/skill-match', async (req: Request, res: Response) => {
  try {
    const auth = await buildWorkforceAuthContext(req);
    const { employeeIds, requirements } = req.body ?? {};
    const result = await workforceController.matchSkills(auth, employeeIds ?? [], requirements ?? [], String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/skill-gap', async (req: Request, res: Response) => {
  try {
    const auth = await buildWorkforceAuthContext(req);
    const { employeeId, requirements } = req.body ?? {};
    const result = await workforceController.skillGaps(auth, employeeId, requirements ?? [], String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/role-fit', async (req: Request, res: Response) => {
  try {
    const auth = await buildWorkforceAuthContext(req);
    const { employeeId, roleId, requirements } = req.body ?? {};
    const result = await workforceController.roleFitScore(auth, employeeId, roleId, requirements ?? [], String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/capacity-plan', async (req: Request, res: Response) => {
  try {
    const auth = await buildWorkforceAuthContext(req);
    const result = await workforceController.capacityPlan(auth, req.body?.inputs ?? [], String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

export { router as workforceRoutes };
