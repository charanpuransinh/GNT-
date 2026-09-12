# M31 — Workforce & HR Intelligence — wiring status

Updated 2026-09-12.

## Checked for duplication against M12-hr
`m12-hr` owns core HR CRUD (employee/department/attendance/leave/payroll/tax).
None of that overlaps M31's talent-intelligence layer (skill matching, role
fit, workforce forecasting, recruitment funnel, career paths) — this is a
new analytics/intelligence layer on top of M12 data, not a duplicate of it.

## What's wired for real
- `talent/talent-profile.service.ts` — backed by the new `talent_profile`
  table (migration 024) via `RealTalentProfileRepository`, and by M12's real
  `m12_employees` table (read-only) via `RealEmployeeDirectoryAdapter`.
  Default singleton: `talentProfileService`.
- `recruitment/candidate-feedback.service.ts` — backed by the new
  `candidate_feedback` table (migration 024) via
  `RealCandidateFeedbackStore`. Default singleton: `candidateFeedbackService`.
- `talent/skill-matching.service.ts`, `talent/skill-gap.service.ts`,
  `talent/role-fit.service.ts`, `career/career-path.service.ts`,
  `career/internal-talent.service.ts`, `workforce/capacity-planning.service.ts`,
  `recruitment/screening-engine.service.ts`,
  `recruitment/interview-assistant.service.ts`,
  `analytics/hiring-funnel.service.ts` — pure logic, no external dependency,
  wired as-is (default singletons already in the blueprint).

## Verified, correctly left un-instantiated (no default singleton)
- `recruitment/requirement-engine.service.ts` — requires an injected
  `RequirementExtractor` (real NLP/AI skill extraction). No AI/ML SDK exists
  in this repo (checked package.json, same finding as M30). Fabricating one
  would be guessing an architecture that doesn't exist.
- `workforce/workforce-forecast.service.ts` — requires an injected
  `WorkforceForecastProvider`. The blueprint's own note says this should use
  M30's `ForecastService`, but M30's `ForecastService` itself requires an
  injected `ForecastProvider` that doesn't exist for the same reason above —
  so there is no real provider to hand it, transitively.
- `analytics/workforce-kpi.service.ts` — requires a `WorkforceKpiDataSource`
  with 4 methods. `getHeadcount`/`getAttritionRate` could be backed by real
  M12 employee data, but `getOpenRequirements`/`getTimeToHireSamples` have no
  backing store anywhere (`requirement-engine.service.ts` never persists a
  `StructuredRequirement`). A data source that's real for 2 fields and
  fabricated for 2 would violate the no-fake rule, so this stays
  un-instantiated rather than partially faked.
- `workforce/workforce-intelligence.service.ts` — composes the forecast and
  KPI services above, so it inherits the same block; no default singleton.

## Owner rule followed
No table or contract invented beyond what the blueprint specifies;
`employeeId` is stored as a plain string (not a Prisma relation) so M31
never writes into M12's own tables directly.
