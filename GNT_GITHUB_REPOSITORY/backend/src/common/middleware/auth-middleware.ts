import { Request, Response, NextFunction } from 'express';
import { authInternal } from '@/modules/m02-core-architecture/services/auth.internal';
import { auditContext } from '@/common/logging/audit-logger';

/**
 * 2026-09-05 — token का payload यहीं उस shape में बदला जाता है जिसका वादा
 * `common/types/express.d.ts` करता है: `{ id, companyId, branchId }`.
 *
 * क्यों: token के अंदर field का नाम **`userId`** है, `id` नहीं। पहले यहाँ पूरा payload
 * ज्यों-का-त्यों `req.user` में रख दिया जाता था, इसलिए पूरे backend में `req.user.id`
 * हमेशा `undefined` रहता था — और typing `any` होने से न compile पर पता चला, न किसी test में।
 *
 * इससे जो चीज़ें चुपचाप टूटी हुई थीं:
 *   - M07: बिल किसने approve/post किया — `approved_by`/`posted_by` खाली जाता था
 *   - M14: हर import/export "system" के नाम चढ़ता था, असली user के नाम नहीं
 *   - M11: userId खाली string जाता था
 *   - audit log: `store.userId` हमेशा undefined — यानी "किसने किया" कभी दर्ज ही नहीं हुआ
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });

  try {
    const payload = await authInternal.verifyAccessToken(token);
    const id: string | undefined = payload?.userId ?? payload?.id;
    if (!id) return res.status(401).json({ success: false, error: 'Invalid or expired token' });

    req.user = { id, companyId: payload?.companyId, branchId: payload?.branchId };

    const store = auditContext.getStore();
    if (store) {
      store.userId = id;
      if (req.user.companyId) store.companyId = req.user.companyId;
    }
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
