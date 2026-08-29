// M11 Payment Module - Auth Middleware
// Extracts tenantId and userId from JWT token

import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  tenantId: string;
  userId: string;
  userRole: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // In production: verify JWT, extract claims
  // Mock for development:
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    return;
  }

  // Extract from JWT payload (mock)
  (req as AuthRequest).tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
  (req as AuthRequest).userId = req.headers['x-user-id'] as string || 'system-user';
  (req as AuthRequest).userRole = req.headers['x-user-role'] as string || 'admin';

  next();
};
