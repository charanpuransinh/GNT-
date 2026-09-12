/**
 * M26 — security/search-access-guard.ts
 * OWN: Tenant/permission filtering for search.
 * FORBIDDEN (per blueprint): Returning records outside tenant/scope.
 *
 * WIRED (2026-09-12): the blueprint's fictional 4-tier permission strings
 * ("M26.SEARCH.USE/ADVANCED/ADMIN/INDEX") do not fit the real permission
 * system, which is a hard-coded 4-action model (view/create/edit/delete —
 * permission-catalog.ts: "मालिक की चार क्रियाएँ — इससे बाहर कोई पाँचवीं नहीं",
 * i.e. "the owner's four actions — no fifth outside these"). Introducing a
 * 5th permission tier would violate that explicit rule, so:
 *   - basic search            -> "M26:view" (real catalog entry added)
 *   - sensitive entity types  -> ALSO requires the OWNING module's own
 *     view permission (e.g. payroll/salary/employee data is M12's, so
 *     search over it requires "M12:view", not a separate M26 tier). This
 *     reuses the real resource-ownership model instead of inventing one.
 */

export interface SearchAuthContext {
  userId: string;
  tenantId: string;
  permissions: string[];
}

export interface SearchAccessCheckInput {
  auth: SearchAuthContext;
  requestedTenantId: string;
  entityTypes: string[];
}

const SEARCH_VIEW_PERMISSION = 'M26:view';

/** entityType -> the real module permission that owns that sensitive data. */
const ENTITY_OWNER_PERMISSION: Record<string, string> = {
  payroll: 'M12:view',
  salary: 'M12:view',
  employee_confidential: 'M12:view',
};

export class SearchAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchAccessDeniedError';
  }
}

export class SearchAccessGuard {
  enforce(input: SearchAccessCheckInput): void {
    const { auth, requestedTenantId, entityTypes } = input;

    if (auth.tenantId !== requestedTenantId) {
      throw new SearchAccessDeniedError('Cross-tenant search denied');
    }
    if (!auth.permissions.includes(SEARCH_VIEW_PERMISSION)) {
      throw new SearchAccessDeniedError('Missing M26:view permission');
    }
    for (const entityType of entityTypes) {
      const ownerPermission = ENTITY_OWNER_PERMISSION[entityType];
      if (ownerPermission && !auth.permissions.includes(ownerPermission)) {
        throw new SearchAccessDeniedError(`Missing ${ownerPermission} permission required for entity type "${entityType}"`);
      }
    }
  }
}

export const searchAccessGuard = new SearchAccessGuard();
