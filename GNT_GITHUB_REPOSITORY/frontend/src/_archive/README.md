# Archive — unused/misplaced files (not deleted, just parked)

These files are not routed or imported by the app. Moved here on 2026-09-12
during the M01–M34 module audit instead of deleting them, per owner instruction.

- `m15-sync-misplaced-m11-m12-pages/` — pages and services that actually belong
  to M11 (Payment) and M12 (HR) but were sitting inside `modules/m15-sync/`
  from an earlier merge. The real, routed versions of these pages live in
  `modules/m11-payment/pages/` and `modules/m12-hr/pages/` — those are the ones
  that were fixed this session. These copies were never referenced by
  `routes.tsx` and had the same bugs unfixed.
- `m12-hr-dead-service/hr.api.ts` — an unused API client with a wrong base URL
  (`/api/m12/hr` instead of the real `/api/v1/hr`) and a wrong localStorage
  auth key. Nothing imports it; the real `EmployeeListPage.tsx` calls
  `apiClient` directly instead.
