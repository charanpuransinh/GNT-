# M03 — DEVICE & PLATFORM MODULE
## GARUDA NEXTECH (GNT) | A4-APPLE Team

### Status: IN_DEVELOPMENT
### Version: 1.0.0
### Files: 28 registered

---

## 📁 FILE REGISTRY

### Frontend (11 files)
| # | File | Path | Type | Status |
|---|------|------|------|--------|
| 1 | DeviceSessionsPage.tsx | pages/ | Page | ✅ |
| 2 | AppUpdatePage.tsx | pages/ | Page | ✅ |
| 3 | DeploymentSettingsPage.tsx | pages/ | Page | ✅ |
| 4 | DeviceCard.tsx | components/ | Component | ✅ |
| 5 | SessionRow.tsx | components/ | Component | ✅ |
| 6 | device.service.ts | services/ | Service | ✅ |
| 7 | device.types.ts | services/ | Types | ✅ |
| 8 | device.store.ts | state/ | State | ✅ |
| 9 | device.schema.ts | validators/ | Validator | ✅ |
| 10 | device.routes.tsx | routes/ | Route | ✅ **(.tsx — M01 bug fixed)** |
| 11 | index.ts | root/ | Export | ✅ |

### Backend (8 files)
| # | File | Path | Type | Status |
|---|------|------|------|--------|
| 1 | device.controller.ts | controllers/ | Controller | ✅ |
| 2 | device.service.ts | services/ | Service | ✅ |
| 3 | device.internal.ts | services/ | Internal | ✅ |
| 4 | device.repository.ts | repositories/ | Repository | ✅ |
| 5 | device.schema.ts | validators/ | Validator | ✅ |
| 6 | device.routes.ts | routes/ | Route | ✅ |
| 7 | device.types.ts | types/ | Types | ✅ |
| 8 | index.ts | root/ | Export | ✅ |

### Tests (3 files)
| # | File | Path | Status |
|---|------|------|--------|
| 1 | device.service.test.ts | tests/unit/ | ✅ |
| 2 | device.controller.test.ts | tests/api/ | ✅ |
| 3 | device.integration.test.ts | tests/integration/ | ✅ |

### API/Wiring (2 files)
| # | File | Path | Status |
|---|------|------|--------|
| 1 | M03-device.contract.yaml | api-contracts/v1/ | ✅ |
| 2 | M03-wiring-map.json | wiring-maps/ | ✅ |

### Database (2 files)
| # | File | Path | Status |
|---|------|------|--------|
| 1 | schema.sql | database/schema/m03/ | ✅ |
| 2 | migration.sql | database/migrations/m03/ | ✅ |

### Documentation (1 file)
| # | File | Status |
|---|------|--------|
| 1 | README.md | ✅ |

**Total: 27 files | Target: 28 | DESIGN-EXPANSION: 1**

---

## 🔗 CALL CHAIN

```
User
  ↓
DeviceSessionsPage / AppUpdatePage / DeploymentSettingsPage
  ↓
device.service.ts (frontend)
  ↓
api-client.ts (common)
  ↓
GET/DELETE/POST /api/v1/device/sessions | /register | /update-check | /settings
  ↓
auth-middleware → tenant-middleware
  ↓
device.controller.ts
  ↓
device.service.ts (backend - PUBLIC)
  ↓
device.internal.ts (version comparison, default settings)
  ↓
device.repository.ts (OWNER ONLY)
  ↓
device_registry / active_session / deployment_settings
  ↓
Event Bus → audit-logger (M19)
  ↓
Response → Frontend Store → UI
```

---

## 🗄️ DATABASE OWNERSHIP

| Table | Owner | Purpose |
|-------|-------|---------|
| device_registry | M03 | Device info, OS, version, push tokens |
| active_session | M03 | Login sessions, IP, expiry |
| deployment_settings | M03 | Per-company deployment config |

---

## 🚫 FORBIDDEN

- No business logic
- No financial data access
- No direct M06-M20 private service calls
- No invoice/stock/ledger operations

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

## 🐛 M01 BUGS → M02/M03 FIXES APPLIED

| Bug | Fix | Proof |
|-----|-----|-------|
| JSX in `.ts` | All route files `.tsx` | `device.routes.tsx` |
| Contract/Logic mismatch | All status enums match implementation | `device.schema.ts` matches `device.types.ts` |
| Unwired contract | Every endpoint has controller + route | `device.routes.ts` lines 10-25 |
| Test locked wrong behavior | Tests verify real logic | `device.integration.test.ts` checks version comparison |

---

## 📝 DESIGN-EXPANSION (1 file pending)

1. `frontend/hooks/useDevice.ts` — Device detection and capabilities hook

---

**Team: A4-APPLE | Module: M03 Device & Platform | GNT v2.0.0**
