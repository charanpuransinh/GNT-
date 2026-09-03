// ============================================================================
// requireTenant — req.tenant का safe पढ़ना (CERT-003 शर्त 2 / टास्क #024 — B1)
//
// tenant-middleware सिर्फ़ authenticated (गैर-public) रास्तों पर चलता है, इसलिए
// typing में req.tenant optional है। जो भी कोड उस पर टिकता है वह इसी helper से
// tenant निकाले — गायब होने पर 401 (कभी चुपचाप गलत company_id नहीं)।
// ============================================================================

import type { Request } from 'express';
import { AppError } from '../errors/error-classes';

export interface TenantContext {
  companyId: string;
  branchId?: string;
}

export function requireTenant(req: Request): TenantContext {
  if (!req.tenant) {
    throw new AppError('TENANT_REQUIRED', 'Tenant required', 401);
  }
  return req.tenant;
}
