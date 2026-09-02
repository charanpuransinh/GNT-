// Express Request के लिए GNT middleware contract की typing (common/types — global declaration)
// टास्क #009 में m04/types से यहाँ ले जाया गया (CERT-003 शर्त 3)।
//   - auth-middleware.ts    → req.user    = { id, companyId? } (verified token payload)
//   - tenant-middleware.ts  → req.tenant  = { companyId, branchId? } (verified token से)
//   - request-tracer.ts     → req.requestId (string)
export {};

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; companyId?: string };
      tenant: { companyId: string; branchId?: string };
      requestId: string;
    }
  }
}
