/**
 * M26 — routes/search.routes.ts
 * WIRED (2026-09-12): Express adapter over SearchController's framework-
 * agnostic methods. Mounted at /api/v1/search (module-registry.ts). Real
 * auth/tenant/permission checks run globally on /api/v1 before this ever
 * executes (auth-middleware.ts, tenant-middleware.ts, requirePermissionMiddleware).
 */

import { Router, Request, Response } from 'express';
import { searchController } from '../api/search.controller';
import { buildSearchAuthContext } from '../adapters/real-search-auth-context';
import { SearchRequest } from '../search/search-query-builder';

const router = Router();

function statusFor(errorCode: string): number {
  if (errorCode === 'SEARCH_ACCESS_DENIED') return 403;
  return 500;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const auth = await buildSearchAuthContext(req);
    const request: SearchRequest = {
      query: String(req.query.q ?? ''),
      entityTypes: req.query.entityTypes ? String(req.query.entityTypes).split(',') : [],
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
    };
    const result = await searchController.search(auth, request, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.post('/index/rebuild', async (req: Request, res: Response) => {
  try {
    const auth = await buildSearchAuthContext(req);
    const result = await searchController.rebuildIndex(auth, String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

router.delete('/index/:entity/:id', async (req: Request, res: Response) => {
  try {
    const auth = await buildSearchAuthContext(req);
    const result = await searchController.deleteFromIndex(auth, String(req.params.entity), String(req.params.id), String(req.requestId));
    res.status(result.success ? 200 : statusFor(result.error.code)).json(result);
  } catch {
    res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } });
  }
});

export { router as searchRoutes };
