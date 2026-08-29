import { Request, Response, NextFunction } from 'express';
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const companyId = (req as any).user?.companyId || req.header('x-company-id');
  if (!companyId) return res.status(400).json({ success: false, error: 'Company context required' });
  (req as any).tenant = { companyId, branchId: (req as any).user?.branchId || req.header('x-branch-id') };
  next();
};
