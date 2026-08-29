import { Request, Response, NextFunction } from 'express';
import { authInternal } from '@/modules/m02-core-architecture/services/auth.internal';
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('authorization') || ''; const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });
  try { (req as any).user = await authInternal.verifyAccessToken(token); next(); }
  catch { return res.status(401).json({ success: false, error: 'Invalid or expired token' }); }
};
