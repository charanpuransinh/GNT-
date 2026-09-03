// M14 — Tenant Middleware (TEMP MOCK)
// Lock: LOCK_12_MIDDLEWARE
import { Request, Response, NextFunction } from 'express';

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  // TODO: Replace with real tenant resolution from JWT or subdomain
  const tenantId = req.headers['x-tenant-id'] as string || 'mock-tenant-id';
  req.tenantId = tenantId;
  next();
}
