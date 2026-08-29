# M14 Import/Export Module

## Session 9 — Backend ✅ COMPLETE
## Session 10 — Frontend ✅ COMPLETE

---

## 📁 Full Structure

```
M14-ImportExport/
├── README.md
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma          # 4 models + 3 enums
│   ├── src/
│   │   ├── types/index.ts         # Core TypeScript interfaces
│   │   ├── services/
│   │   │   ├── parser.service.ts  # CSV/XLSX/JSON parsing
│   │   │   ├── formatter.service.ts # CSV/XLSX/JSON/PDF formatting
│   │   │   ├── import.service.ts  # Import job lifecycle
│   │   │   ├── export.service.ts  # Export job lifecycle
│   │   │   ├── template.service.ts # Import/Export templates
│   │   │   └── job.service.ts     # Dashboard & cleanup
│   │   ├── controllers/
│   │   │   ├── import.controller.ts
│   │   │   ├── export.controller.ts
│   │   │   ├── template.controller.ts
│   │   │   └── job.controller.ts
│   │   ├── routes/index.ts        # 18 endpoints under /api/m14
│   │   ├── jobs/
│   │   │   ├── import.processor.ts
│   │   │   └── export.processor.ts
│   │   ├── events/
│   │   │   ├── import.events.ts
│   │   │   └── export.events.ts
│   │   └── middleware/
│   │       ├── auth.ts            # TEMP MOCK
│   │       └── tenant.ts          # TEMP MOCK
│   └── tests/
│       ├── import.service.test.ts
│       └── export.service.test.ts
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                # Main tabbed shell
│   │   ├── index.css
│   │   ├── types/index.ts         # Frontend type mirror
│   │   ├── api/index.ts           # Axios API layer
│   │   ├── stores/
│   │   │   ├── import.store.ts    # Zustand import state
│   │   │   ├── export.store.ts    # Zustand export state
│   │   │   ├── template.store.ts  # Zustand template state
│   │   │   └── dashboard.store.ts # Zustand dashboard state
│   │   ├── components/
│   │   │   ├── Common/
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── ErrorAlert.tsx
│   │   │   ├── Import/
│   │   │   │   ├── ImportUploader.tsx    # Drag-drop upload
│   │   │   │   ├── ImportProgress.tsx    # Live progress tracking
│   │   │   │   └── ImportJobList.tsx     # History table
│   │   │   ├── Export/
│   │   │   │   ├── ExportBuilder.tsx     # Filter/column builder
│   │   │   │   ├── ExportProgress.tsx    # Download ready state
│   │   │   │   └── ExportJobList.tsx     # History table
│   │   │   ├── Template/
│   │   │   │   └── TemplateManager.tsx   # CRUD + mapping builder
│   │   │   └── Dashboard/
│   │   │       └── JobDashboard.tsx      # Stats + recent jobs
│   │   ├── hooks/
│   │   │   ├── usePolling.ts
│   │   │   └── useFileUpload.ts
│   │   ├── utils/index.ts
│   │   └── tests/
│   │       ├── setup.ts
│   │       ├── import.store.test.ts
│   │       ├── export.store.test.ts
│   │       └── components.test.tsx
│   └── public/
│
├── docs/
│   ├── API_CONTRACT_M14.md
│   ├── SCHEMA_M14.md
│   └── WIRING_MAP_M14.md
│
├── locks/
│   ├── LOCK_01_SCHEMA.md  → LOCK_15_TESTS.md     (Backend 15 locks)
│   └── frontend/locks/
│       ├── LOCK_01_TYPES.md  → LOCK_15_INTEGRATION.md  (Frontend 15 locks)
```

---

## 🔒 Lock Artifacts — Total: 30

### Backend (15)
| # | Lock | Status |
|---|------|--------|
| 1 | Schema | 4 models, 3 enums, tenant indexes |
| 2 | API Contract | 18 REST endpoints |
| 3 | Wiring Map | Internal + cross-module PUBLIC API |
| 4 | Parser | CSV / XLSX / JSON |
| 5 | Formatter | CSV / XLSX / JSON / PDF |
| 6 | Import Service | Lifecycle + validation + retry |
| 7 | Export Service | Lifecycle + download |
| 8 | Job Service | Dashboard + cleanup |
| 9 | Import Controller | 6 endpoints |
| 10 | Export Controller | 5 endpoints |
| 11 | Routes | All wired with auth + tenant |
| 12 | Middleware | TEMP MOCK marked |
| 13 | Processors | Async Redis workers |
| 14 | Events | 6 Redis topics |
| 15 | Tests | 9 vitest cases |

### Frontend (15)
| # | Lock | Status |
|---|------|--------|
| 1 | Types | Full backend mirror |
| 2 | API Layer | Axios + interceptors |
| 3 | Zustand Stores | 4 stores with polling |
| 4 | Common Components | StatusBadge, ProgressBar, ErrorAlert |
| 5 | Import Components | Uploader, Progress, JobList |
| 6 | Export Components | Builder, Progress, JobList |
| 7 | Template Components | Manager with mapping builder |
| 8 | Dashboard Components | Stats + recent jobs panels |
| 9 | App Shell | Tabbed navigation |
| 10 | Custom Hooks | usePolling, useFileUpload |
| 11 | Utilities | formatBytes, formatDate, debounce |
| 12 | Frontend Tests | 7 vitest cases |
| 13 | Build Config | Vite 5 + Tailwind + TS strict |
| 14 | Styling | Tailwind utility-first |
| 15 | Integration | Auth headers + polling intervals |

---

## 🏗️ Architecture Rules Followed

- **Modular Monolith**: M14 only touches its own Prisma models
- **Cross-module calls**: ExportProcessor hits target module's **PUBLIC `/list` API** only
- **Queue**: Real Redis `ioredis` with `BRPOP` + pub/sub
- **Tenant scope**: Every query filtered by `tenantId`
- **Auth/Tenant middleware**: Present but marked **TEMP MOCK**
- **Frontend**: Zustand stores, Axios API layer, Tailwind CSS, React 18
- **Polling**: 3s job progress, 5s lists, 10s dashboard

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/m14/imports/upload` | Upload file → queue import |
| GET | `/api/m14/imports/:jobId` | Check import status |
| POST | `/api/m14/exports` | Create export job |
| GET | `/api/m14/exports/:jobId/download` | Download finished file |
| GET | `/api/m14/jobs/dashboard` | Import/Export stats |

---

## 🚀 How to Run

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev          # Express server
npm run queue:import # Import worker
npm run queue:export # Export worker
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Vite dev server (port 5173)
npm run test         # Vitest
```

---

## ⏭️ Next Steps (Session 11)
- M15 Sync Module Backend
- M15 Sync Module Frontend
