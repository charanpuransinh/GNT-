import { Request, Response, NextFunction } from 'express';
import { auditContext } from '@/common/logging/audit-logger';
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // कंपनी की पहचान सिर्फ़ verified token से — client के भेजे header/body का कोई fallback नहीं (टास्क #009)
  const companyId = (req as any).user?.companyId;
  if (!companyId) return res.status(403).json({ success: false, error: 'FORBIDDEN_NO_TENANT' });
  (req as any).tenant = { companyId, branchId: (req as any).user?.branchId };
  const store = auditContext.getStore();
  if (store) store.companyId = companyId;
  next();
};
