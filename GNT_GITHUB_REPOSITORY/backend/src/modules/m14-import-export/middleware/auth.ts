// M14 — Auth Middleware (TEMP MOCK)
// Lock: LOCK_12_MIDDLEWARE
import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // TODO: Replace with real JWT/SSO validation
  const userId = req.headers['x-user-id'] as string || 'mock-user-id';
  const roles = (req.headers['x-user-roles'] as string)?.split(',') || ['ADMIN'];
  (req as any).userId = userId;
  (req as any).userRoles = roles;
  next();
}
