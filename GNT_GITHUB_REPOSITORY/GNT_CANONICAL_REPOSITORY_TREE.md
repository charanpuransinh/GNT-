# GNT M01-M20 — Canonical Repository Tree

```text
GNT_GITHUB_REPOSITORY/
├── api-contracts/
│   ├── common/
│   └── v1/
│       └── events/
├── backend/
│   └── src/
│       ├── common/
│       ├── core/
│       └── modules/
│           ├── m01-foundation/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m02-core-architecture/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m03-device-platform/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m04-company-management/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m05-party-management/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m06-inventory/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m07-purchase/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m08-sales/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m09-gst/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m10-accounting/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m11-payment/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m12-hr/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m13-automation/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m14-import-export/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m15-sync/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m16-notification/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m17-reporting/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m18-external-integration/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m19-production-monitoring/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
│           ├── m20-international-trade/
│           │   ├── controllers/
│           │   ├── services/
│           │   ├── repositories/
│           │   ├── models/
│           │   ├── validators/
│           │   ├── routes/
│           │   ├── events/
│           │   ├── types/
│           │   ├── tests/unit/
│           │   ├── tests/integration/
│           │   ├── tests/api/
│           │   └── index.ts
├── frontend/
│   └── src/
│       ├── components/
│       ├── core/
│       ├── hooks/
│       ├── modules/
│       │   ├── m01-foundation/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m02-core-architecture/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m03-device-platform/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m04-company-management/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m05-party-management/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m06-inventory/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m07-purchase/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m08-sales/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m09-gst/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m10-accounting/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m11-payment/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m12-hr/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m13-automation/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m14-import-export/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m15-sync/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m16-notification/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m17-reporting/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m18-external-integration/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m19-production-monitoring/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       │   ├── m20-international-trade/
│       │   │   ├── pages/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── state/
│       │   │   ├── validators/
│       │   │   ├── routes/
│       │   │   └── index.ts
│       ├── state/
│       ├── utils/
│       └── styles/
├── database/
│   ├── schema/
│   ├── migrations/
│   └── seeders/
├── integration/
├── prisma/
├── tests/
│   ├── master/
│   ├── contracts/
│   ├── security/
│   ├── recovery/
│   └── performance/
├── tools/
├── docs/
├── source-archives/
├── team-d/
└── wiring-maps/
    ├── module-wiring/
    ├── cross-module-flows/
    └── event-registry/
```
