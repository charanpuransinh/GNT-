# GNT M01-M20 — Repository Structure Completion Audit

## Basis
This structure was aligned to the supplied GNT Advanced Software Blueprint and Module→File→Function→Dependency Master Map.

## Rules applied
- Every module has one backend and one frontend module root.
- Backend module pattern: controllers, services, repositories, models, validators, routes, events, types, tests/unit, tests/integration, tests/api, index.ts.
- Frontend module pattern: pages, components, services, state, validators, routes, index.ts.
- API contracts remain under api-contracts/v1/.
- Wiring remains under wiring-maps/module-wiring/, wiring-maps/cross-module-flows/, and wiring-maps/event-registry/.
- Database material remains under controlled database paths.
- Cross-module calls must use public contracts/services/events; private repositories are not cross-module interfaces.

## Important status
This package completes the **repository folder/skeleton structure**. It does not claim that missing implementation code, tests, API contracts, database definitions, or module-specific files have been invented or completed. Files not supplied by the source blueprints are not silently fabricated.

## Added structural items
- `backend/src/modules/m01-foundation/models`
- `backend/src/modules/m05-party-management/controllers`
- `backend/src/modules/m05-party-management/services`
- `backend/src/modules/m05-party-management/repositories`
- `backend/src/modules/m05-party-management/models`
- `backend/src/modules/m05-party-management/validators`
- `backend/src/modules/m05-party-management/routes`
- `backend/src/modules/m05-party-management/events`
- `backend/src/modules/m05-party-management/types`
- `backend/src/modules/m05-party-management/tests/unit`
- `backend/src/modules/m05-party-management/tests/integration`
- `backend/src/modules/m05-party-management/tests/api`
- `frontend/src/modules/m05-party-management/pages`
- `frontend/src/modules/m05-party-management/components`
- `frontend/src/modules/m05-party-management/services`
- `frontend/src/modules/m05-party-management/state`
- `frontend/src/modules/m05-party-management/validators`
- `frontend/src/modules/m05-party-management/routes`
- `backend/src/modules/m05-party-management/index.ts`
- `frontend/src/modules/m05-party-management/index.ts`
- `backend/src/modules/m07-purchase/models`
- `backend/src/modules/m07-purchase/tests/unit`
- `backend/src/modules/m07-purchase/tests/integration`
- `backend/src/modules/m07-purchase/tests/api`
- `frontend/src/modules/m07-purchase/pages`
- `frontend/src/modules/m07-purchase/components`
- `frontend/src/modules/m07-purchase/services`
- `frontend/src/modules/m07-purchase/state`
- `frontend/src/modules/m07-purchase/validators`
- `frontend/src/modules/m07-purchase/routes`
- `backend/src/modules/m07-purchase/index.ts`
- `frontend/src/modules/m07-purchase/index.ts`
- `frontend/src/modules/m08-sales/pages`
- `frontend/src/modules/m08-sales/components`
- `frontend/src/modules/m08-sales/state`
- `frontend/src/modules/m08-sales/routes`
- `backend/src/modules/m08-sales/index.ts`
- `frontend/src/modules/m08-sales/index.ts`
- `backend/src/modules/m09-gst/index.ts`
- `backend/src/modules/m10-accounting/index.ts`
- `backend/src/modules/m11-payment/models`
- `backend/src/modules/m11-payment/tests/unit`
- `backend/src/modules/m11-payment/tests/integration`
- `backend/src/modules/m11-payment/tests/api`
- `frontend/src/modules/m11-payment/validators`
- `frontend/src/modules/m11-payment/routes`
- `backend/src/modules/m12-hr/repositories`
- `backend/src/modules/m12-hr/models`
- `backend/src/modules/m12-hr/types`
- `backend/src/modules/m12-hr/tests/unit`
- `backend/src/modules/m12-hr/tests/integration`
- `backend/src/modules/m12-hr/tests/api`
- `frontend/src/modules/m12-hr/validators`
- `frontend/src/modules/m12-hr/routes`
- `backend/src/modules/m13-automation/models`
- `backend/src/modules/m13-automation/tests/unit`
- `backend/src/modules/m13-automation/tests/integration`
- `backend/src/modules/m13-automation/tests/api`
- `frontend/src/modules/m13-automation/validators`
- `backend/src/modules/m14-import-export/models`
- `backend/src/modules/m14-import-export/tests/unit`
- `backend/src/modules/m14-import-export/tests/integration`
- `backend/src/modules/m14-import-export/tests/api`
- `frontend/src/modules/m14-import-export/validators`
- `backend/src/modules/m15-sync/models`
- `backend/src/modules/m15-sync/tests/unit`
- `backend/src/modules/m15-sync/tests/integration`
- `backend/src/modules/m15-sync/tests/api`
- `frontend/src/modules/m15-sync/validators`
- `frontend/src/modules/m15-sync/routes`
- `backend/src/modules/m16-notification/tests/unit`
- `backend/src/modules/m16-notification/tests/integration`
- `backend/src/modules/m16-notification/tests/api`
- `backend/src/modules/m17-reporting/tests/unit`
- `backend/src/modules/m17-reporting/tests/integration`
- `backend/src/modules/m17-reporting/tests/api`
- `backend/src/modules/m18-external-integration/tests/unit`
- `backend/src/modules/m18-external-integration/tests/integration`
- `backend/src/modules/m18-external-integration/tests/api`
- `backend/src/modules/m19-production-monitoring/tests/unit`
- `backend/src/modules/m19-production-monitoring/tests/integration`
- `backend/src/modules/m19-production-monitoring/tests/api`
- `frontend/src/modules/m19-production-monitoring/components`
- `backend/src/modules/m20-international-trade/tests/unit`
- `backend/src/modules/m20-international-trade/tests/integration`
- `backend/src/modules/m20-international-trade/tests/api`
- `frontend/src/state`
- `frontend/src/utils`
- `frontend/src/styles`
- `wiring-maps/module-wiring/m01`
- `wiring-maps/module-wiring/m02`
- `wiring-maps/module-wiring/m03`
- `wiring-maps/module-wiring/m04`
- `wiring-maps/module-wiring/m05`
- `wiring-maps/module-wiring/m06`
- `wiring-maps/module-wiring/m07`
- `wiring-maps/module-wiring/m08`
- `wiring-maps/module-wiring/m09`
- `wiring-maps/module-wiring/m10`
- `wiring-maps/module-wiring/m11`
- `wiring-maps/module-wiring/m12`
- `wiring-maps/module-wiring/m13`
- `wiring-maps/module-wiring/m14`
- `wiring-maps/module-wiring/m15`
- `wiring-maps/module-wiring/m16`
- `wiring-maps/module-wiring/m17`
- `wiring-maps/module-wiring/m18`
- `wiring-maps/module-wiring/m19`
- `tests/master`
- `tests/contracts`
- `tests/security`
- `tests/recovery`
- `tests/performance`


## Production gate
A module is production-ready only when its implementation and required tests/contracts pass the project's lock criteria. The source blueprint explicitly states that missing checks block production readiness.
