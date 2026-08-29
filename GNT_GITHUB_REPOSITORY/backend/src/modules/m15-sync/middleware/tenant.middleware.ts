import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  tenantId?: string;
  user?: { id: string; role: string };
}

export const tenantMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  // TEMP MOCK: In production, extract from JWT token
  req.tenantId = req.headers['x-tenant-id'] as string || 'tenant-default';
  req.user = {
    id: (req.headers['x-user-id'] as string) || 'system',
    role: (req.headers['x-user-role'] as string) || 'admin'
  };
  next();
};
