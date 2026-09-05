// ============================================================================
// अनुमति की जाँच — "login है या नहीं" के आगे "इसे इस काम का हक़ है या नहीं"
//
// क्यों बना (मालिक का P0, 2026-09-04): पूरे system में यह जाँच कहीं थी ही नहीं। कोई भी
// login किया हुआ आदमी users बना सकता था, किसी को भी निष्क्रिय कर सकता था, भूमिकाएँ
// बदल सकता था। code में `// permission check would be added` लिखकर छोड़ा गया था।
//
// यहाँ एक ही जगह लगी है — auth/tenant की तरह (app.ts में `/api/v1` पर)। 41 route
// फ़ाइलों में अलग-अलग जाँच लगाने का मतलब होता कि कल कोई नई route बिना जाँच के जुड़ जाए।
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import { resolveRequiredPermission } from '@/common/auth/permission-catalog';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import { logger } from '@/common/logging/logger';

/**
 * आपात-स्थिति का switch। सामान्य हालत में जाँच **चालू** रहती है।
 * `PERMISSIONS_ENFORCED=false` सिर्फ़ तब, जब seed बिगड़ जाए और मालिक ख़ुद बंद करना चाहे।
 */
const isEnforced = (): boolean => process.env.PERMISSIONS_ENFORCED !== 'false';

export const requirePermissionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const required = resolveRequiredPermission(req.method, req.originalUrl);
  if (!required) return next();

  if (!isEnforced()) {
    logger.warn('अनुमति की जाँच बंद है (PERMISSIONS_ENFORCED=false)', { path: req.originalUrl, needed: required.key });
    return next();
  }

  const userId = req.user?.id;
  if (!userId) {
    // यहाँ तक बिना user के पहुँचना नहीं चाहिए (auth पहले चलता है) — फिर भी खुला नहीं छोड़ेंगे
    return res.status(401).json({ success: false, error: 'AUTH_REQUIRED' });
  }

  try {
    const allowed = await permissionService.hasPermission(userId, required.key);
    if (!allowed) {
      logger.warn('अनुमति नहीं — request रोकी गई', {
        userId, path: req.originalUrl, method: req.method, needed: required.key,
      });
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_NO_PERMISSION',
        message: 'इस काम की अनुमति आपके पास नहीं है',
        required: required.key,
      });
    }
    return next();
  } catch (error) {
    // अनुमति पढ़ी ही न जा सके तो **बंद** करेंगे, खोलेंगे नहीं — वरना DB गिरते ही
    // पूरा system बिना जाँच के खुल जाएगा।
    logger.error('अनुमति की जाँच फ़ेल — request रोकी गई (fail-closed)', { error, path: req.originalUrl });
    return res.status(403).json({ success: false, error: 'FORBIDDEN_PERMISSION_CHECK_FAILED' });
  }
};
