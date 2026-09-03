// ============================================================================
// M14 — अपने पुराने middleware की typing (टास्क #024-अनुवर्ती: as any सफाई)
//
// m14 की अपनी chain (middleware/auth.ts, middleware/tenant.ts) अभी x-tenant-id/
// x-user-id headers से पहचान बनाती है — जब तक M14 मुख्य app की tenant chain पर
// नहीं आता (#016 दर्ज: "M14 router नहीं"), ये fields m14 के अंदर ही इस्तेमाल
// होते हैं। यह ambient typing उन reads/writes को बिना as any के typed बनाती है।
// ============================================================================

export {};

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
      userRoles?: string[];
    }
  }
}
