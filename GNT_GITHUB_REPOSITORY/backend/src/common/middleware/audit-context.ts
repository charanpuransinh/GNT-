import { Request, Response, NextFunction } from 'express';
import { auditContext } from '@/common/logging/audit-logger';

/**
 * टास्क #014 — request context (AsyncLocalStorage) भरने वाला global middleware।
 * जो यहाँ उपलब्ध है (ip, user-agent) वही global समय पर भरता है;
 * companyId/userId route-level middlewares (tenant/auth) बाद में store में जोड़ते हैं।
 */
export const auditContextMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  auditContext.run(
    {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    },
    () => next(),
  );
};
