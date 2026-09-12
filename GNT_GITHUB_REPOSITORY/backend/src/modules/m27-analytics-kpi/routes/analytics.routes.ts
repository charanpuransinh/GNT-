/**
 * M27 — routes/analytics.routes.ts
 * WIRED (2026-09-12): Express adapter over AnalyticsController. Mounted at
 * /api/v1/analytics (module-registry.ts).
 */

import { Router, Request, Response } from 'express';
import { analyticsController } from '../dashboard/analytics.controller';
import { buildAnalyticsAuthContext } from '../adapters/real-analytics-auth-context';

const router = Router();

function statusFor(errorCode: string): number {
  if (errorCode === 'ANALYTICS_ACCESS_DENIED') return 403;
  return 500;
}

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const auth = await buildAnalyticsAuthContext(req);
    const keys = req.query.keys ? String(req.query.keys).split(',') : [];
    const from = String(req.query.from ?? '');
    const to = String(req.query.to ?? '');
    const result = await analyticsController.getMetrics(auth, keys, from, to, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/kpi/evaluate', async (req: Request, res: Response) => {
  try {
    const auth = await buildAnalyticsAuthContext(req);
    const { definition, fromDate, toDate } = req.body ?? {};
    const result = await analyticsController.evaluateKpi(auth, definition, fromDate, toDate, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/dashboard/widget', async (req: Request, res: Response) => {
  try {
    const auth = await buildAnalyticsAuthContext(req);
    const { widget, fromDate, toDate } = req.body ?? {};
    const result = await analyticsController.getWidgetData(auth, widget, fromDate, toDate, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

export { router as analyticsRoutes };
