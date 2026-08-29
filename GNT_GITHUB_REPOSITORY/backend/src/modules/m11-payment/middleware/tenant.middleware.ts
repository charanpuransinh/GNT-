// M11 Payment Module - Tenant Middleware
// Ensures tenant isolation at route level

import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.helper';

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    errorResponse(res, 'TENANT_REQUIRED', 'Tenant ID is required', 400);
    return;
  }
  next();
};
