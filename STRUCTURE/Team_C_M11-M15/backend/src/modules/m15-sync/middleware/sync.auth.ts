// M15 Sync Module — Auth & Tenant Middleware
// GNT Team C | Modular Monolith Architecture
// NOTE: In production, integrate with M01 Auth module via PUBLIC API

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/sync.errors';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string };
  tenantId?: string;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // TEMP MOCK: In production, verify JWT via M01 Auth module
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // For development, mock a user
    req.user = { id: 'dev-user-001', email: 'dev@gnt.local', role: 'admin' };
    return next();
  }

  // Real JWT verification would go here
  // const token = authHeader.replace('Bearer ', '');
  // const decoded = verifyToken(token); // Call M01 PUBLIC API
  req.user = { id: 'dev-user-001', email: 'dev@gnt.local', role: 'admin' };
  next();
};

export const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new AppError('TENANT_REQUIRED', 'x-tenant-id header is required', 400);
  }
  req.tenantId = tenantId;
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions', 403);
    }
    next();
  };
};
