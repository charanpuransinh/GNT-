import { Request, Response, NextFunction } from 'express';
import { authInternal } from '@/modules/m02-core-architecture/services/auth.internal';
import { auditContext } from '@/common/logging/audit-logger';
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('authorization') || ''; const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });
  try { (req as any).user = await authInternal.verifyAccessToken(token); const store = auditContext.getStore(); if (store) { store.userId = (req as any).user?.id; if ((req as any).user?.companyId) store.companyId = (req as any).user?.companyId; } next(); }
  catch { return res.status(401).json({ success: false, error: 'Invalid or expired token' }); }
};
