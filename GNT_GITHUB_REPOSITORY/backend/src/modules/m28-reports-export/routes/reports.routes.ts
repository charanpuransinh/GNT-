/**
 * M28 — routes/reports.routes.ts
 * WIRED (2026-09-13): Express adapter over ReportsController. Mounted at
 * /api/v1/reports-export (module-registry.ts) — NOT /api/v1/reports, which
 * M17-reporting already owns for real (verified: module-registry.ts M17
 * entry). Same auth/tenant/permission pattern as M23/M24/M26/M27.
 */

import { Router, Request, Response } from 'express';
import { reportsController } from '../controllers/reports.controller';
import { buildReportsAuthContext } from '../adapters/real-reports-auth-context';

const router = Router();

function statusFor(errorCode: string): number {
  if (errorCode === 'REPORTS_ACCESS_DENIED') return 403;
  return 500;
}

router.post('/build', async (req: Request, res: Response) => {
  try {
    const auth = await buildReportsAuthContext(req);
    const result = await reportsController.buildReport(auth, req.body ?? {}, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/export', async (req: Request, res: Response) => {
  try {
    const auth = await buildReportsAuthContext(req);
    const result = await reportsController.exportReport(auth, req.body ?? {}, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

export { router as reportsExportRoutes };
