/**
 * M24 — routes/performance.routes.ts
 * WIRED (2026-09-13): Express adapter over PerformanceController. Mounted
 * at /api/v1/performance (module-registry.ts). Same auth/tenant/permission
 * pattern as M23/M26/M27.
 */

import { Router, Request, Response } from 'express';
import { performanceController } from '../controllers/performance.controller';
import { buildPerformanceAuthContext } from '../adapters/real-performance-auth-context';

const router = Router();

function statusFor(errorCode: string): number {
  if (errorCode === 'PERFORMANCE_ACCESS_DENIED') return 403;
  return 500;
}

router.get('/snapshot', async (req: Request, res: Response) => {
  try {
    const auth = await buildPerformanceAuthContext(req);
    const result = await performanceController.performanceSnapshot(auth, String(req.query.operation ?? ''), String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.get('/cache/metrics', async (req: Request, res: Response) => {
  try {
    const auth = await buildPerformanceAuthContext(req);
    const result = await performanceController.cacheMetricsSnapshot(auth, String(req.query.namespace ?? ''), String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.get('/query/recommendations', async (req: Request, res: Response) => {
  try {
    const auth = await buildPerformanceAuthContext(req);
    const result = await performanceController.queryRecommendations(auth, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.get('/index', async (req: Request, res: Response) => {
  try {
    const auth = await buildPerformanceAuthContext(req);
    const result = await performanceController.listIndexes(auth, String(req.query.table ?? ''), String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/index/propose', async (req: Request, res: Response) => {
  try {
    const auth = await buildPerformanceAuthContext(req);
    const result = await performanceController.proposeIndex(auth, req.body ?? {}, String(req.requestId));
    res.status(result.success ? 201 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

export { router as performanceRoutes };
