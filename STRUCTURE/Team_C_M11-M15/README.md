# GNT Class C — M11 to M15 (Complete)

## Modules

| Module | Name | Files | Status |
|--------|------|-------|--------|
| M11 | Payment & Communication | 97 | ✅ Complete |
| M12 | Employee & HR | 59 | ✅ Complete |
| M13 | Smart Automation | 111 | ✅ Complete |
| M14 | Import/Export | 150 | ✅ Complete |
| M15 | Data Storage & Sync | 61 | ✅ Complete |

## Structure

```
GNT_CLASS_C_FINAL/
├── frontend/src/modules/     → React + Zustand frontend
├── backend/src/modules/      → Node + Express backend
├── api-contracts/v1/         → Shared API contracts
├── database/                 → Schema, migrations, seeders
├── wiring-maps/              → Module wiring & event registry
├── tests/                    → Unit + integration tests
└── docs/                     → Documentation
```

## Cross-Module Rules

- All inter-module calls via PUBLIC API only
- No direct repository/database access across modules
- Event bus for async communication
- 15 lock artifacts per module

## Build

```bash
npm install
npm run dev
```
