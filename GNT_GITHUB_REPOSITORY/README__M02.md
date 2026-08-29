# M02 — CORE ARCHITECTURE MODULE
## GARUDA NEXTECH (GNT) | A4-APPLE Team

### Status: IN_DEVELOPMENT
### Version: 1.0.0
### Files: 31 registered

---

## 📁 FILE REGISTRY

### Frontend (14 files)
| # | File | Path | Type | Status |
|---|------|------|------|--------|
| 1 | LoginPage.tsx | pages/ | Page | ✅ |
| 2 | OTPVerifyPage.tsx | pages/ | Page | ✅ |
| 3 | RoleSelectPage.tsx | pages/ | Page | ✅ |
| 4 | SessionLockPage.tsx | pages/ | Page | ✅ |
| 5 | AuthGuard.tsx | components/ | Component | ✅ |
| 6 | PermissionGate.tsx | components/ | Component | ✅ |
| 7 | UserAvatar.tsx | components/ | Component | ✅ |
| 8 | SessionTimeoutWarning.tsx | components/ | Component | ✅ |
| 9 | auth.service.ts | services/ | Service | ✅ |
| 10 | auth.types.ts | services/ | Types | ✅ |
| 11 | auth.store.ts | state/ | State | ✅ |
| 12 | auth.schema.ts | validators/ | Validator | ✅ |
| 13 | auth.routes.tsx | routes/ | Route | ✅ |
| 14 | index.ts | root/ | Export | ✅ |

### Backend (18 files)
| # | File | Path | Type | Status |
|---|------|------|------|--------|
| 1 | auth.controller.ts | controllers/ | Controller | ✅ |
| 2 | user.controller.ts | controllers/ | Controller | ✅ |
| 3 | role.controller.ts | controllers/ | Controller | ✅ |
| 4 | auth.service.ts | services/ | Service | ✅ |
| 5 | user.service.ts | services/ | Service | ✅ |
| 6 | role.service.ts | services/ | Service | ✅ |
| 7 | auth.internal.ts | services/ | Internal | ✅ |
| 8 | user.repository.ts | repositories/ | Repository | ✅ |
| 9 | role.repository.ts | repositories/ | Repository | ✅ |
| 10 | user.model.ts | models/ | Model | ✅ |
| 11 | auth.schema.ts | validators/ | Validator | ✅ |
| 12 | auth.routes.ts | routes/ | Route | ✅ |
| 13 | auth.types.ts | types/ | Types | ✅ |
| 14 | index.ts | root/ | Export | ✅ |
| 15 | auth.service.test.ts | tests/unit/ | Test | ✅ |
| 16 | auth.controller.test.ts | tests/api/ | Test | ✅ |
| 17 | auth.integration.test.ts | tests/integration/ | Test | ✅ |

### API/Wiring (3 files)
| # | File | Path | Status |
|---|------|------|--------|
| 1 | M02-core.contract.yaml | api-contracts/v1/ | ✅ |
| 2 | auth.contract.yaml | api-contracts/common/ | ✅ |
| 3 | M02-wiring-map.json | wiring-maps/ | ✅ |

### Database (2 files)
| # | File | Path | Status |
|---|------|------|--------|
| 1 | schema.sql | database/schema/m02/ | ✅ |
| 2 | migration.sql | database/migrations/m02/ | ✅ |

**Total: 31 files | Target: 50 | DESIGN-EXPANSION: 19**

---

## 🔗 CALL CHAIN

```
User
  ↓
LoginPage / OTPVerifyPage / RoleSelectPage / SessionLockPage
  ↓
auth.service.ts (frontend)
  ↓
api-client.ts (common)
  ↓
POST /api/v1/auth/login | /otp-verify | /refresh | /logout
  ↓
validation-middleware (Zod schema check)
  ↓
auth.controller.ts
  ↓
auth.service.ts (backend - PUBLIC)
  ↓
auth.internal.ts (token generation, password hashing, OTP)
  ↓
user.repository.ts / role.repository.ts (OWNER ONLY)
  ↓
user_master / role_master / permission_master / user_role
  ↓
Event Bus → audit-logger (M19)
  ↓
Response → Frontend Store → UI
```

---

## 🗄️ DATABASE OWNERSHIP

| Table | Owner | Purpose |
|-------|-------|---------|
| user_master | M02 | User accounts (canonical) |
| role_master | M02 | Role definitions |
| permission_master | M02 | Permission definitions (global) |
| user_role | M02 | User-Role mapping |

---

## 🚫 FORBIDDEN

- No business logic
- No financial data access
- No direct calls to M06-M20 private services
- No invoice/stock/ledger operations
- Passwords must NEVER be logged

---

## 🔒 LOCK PACKAGE STATUS

| # | Artifact | Status |
|---|----------|--------|
| 1 | Module Contract | ✅ |
| 2 | Repository Map | ✅ |
| 3 | File Registry | ✅ |
| 4 | Database Map | ✅ |
| 5 | Database Registry | ✅ |
| 6 | Dependency Map | ✅ |
| 7 | Wiring Map | ✅ |
| 8 | Wiring Registry | ✅ |
| 9 | API Contract | ✅ |
| 10 | Integration Contract | ✅ |
| 11 | Security Contract | ✅ |
| 12 | Test Report | ⏳ |
| 13 | Change Log | ⏳ |
| 14 | Version | ✅ (1.0.0) |
| 15 | Lock Status | ⏳ PENDING REVIEW |

---

## 📝 DESIGN-EXPANSION (19 files pending approval)

1. `frontend/pages/PasswordResetPage.tsx`
2. `frontend/pages/ProfilePage.tsx`
3. `frontend/components/RoleBadge.tsx`
4. `frontend/components/PermissionMatrix.tsx`
5. `frontend/hooks/usePermission.ts`
6. `frontend/hooks/useAuth.ts`
7. `backend/controllers/permission.controller.ts`
8. `backend/services/permission.service.ts`
9. `backend/repositories/permission.repository.ts`
10. `backend/middleware/rbac-middleware.ts`
11. `backend/middleware/session-middleware.ts`
12. `backend/events/auth.events.ts`
13. `backend/events/auth.handlers.ts`
14. `backend/tests/security/auth.security.test.ts`
15. `backend/tests/performance/auth.performance.test.ts`
16. `database/seeders/m02-default-roles.ts`
17. `database/seeders/m02-default-admin.ts`
18. `wiring-maps/cross-module-flows/auth-flow.wiring.json`
19. `wiring-maps/event-registry/auth-events.json`

---

## 🐛 M01 BUGS → M02 FIXES APPLIED

| M01 Bug | M02 Fix |
|---------|---------|
| JSX in `.ts` file | All route files use `.tsx` |
| 'down' status unreachable | Health logic not in M02 (M01 scope) — but all status enums match contracts |
| Unwired global contract | All contracts have corresponding controllers/routes |
| Test locked wrong behavior | Tests verify real logic, not just mocks |

---

**Team: A4-APPLE | Module: M02 Core Architecture | GNT v2.0.0**
