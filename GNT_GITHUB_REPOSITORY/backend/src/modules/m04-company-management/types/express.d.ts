// Express Request के लिए GNT middleware contract की typing
// (टास्क #003 के अंतर्गत type-level fix — कोई runtime बदलाव नहीं):
//   - common/middleware/tenant-middleware.ts  → req.tenant  = { companyId, branchId? }
//   - common/middleware/request-tracer.ts     → req.requestId (string)
// m04 company.controller.ts इन्हीं values पर चलता है।
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
