/**
 * M31 — Workforce & HR Intelligence
 * index.ts — Public M31 exports.
 * SECURITY: HR data is highly sensitive — field-level masking (M23) is
 * mandatory wherever these services' output is exposed via API.
 * USE: existing employee/attendance/payroll data only through verified
 * public contracts (see TalentProfileService's EmployeeDirectoryAdapter).
 */

export { WorkforceIntelligenceService, type WorkforceIntelligenceReport } from './workforce/workforce-intelligence.service';
export { WorkforceForecastService, type WorkforceDemandPoint, type WorkforceForecastProvider } from './workforce/workforce-forecast.service';
export { CapacityPlanningService, capacityPlanningService, type CapacityInput, type CapacityGap } from './workforce/capacity-planning.service';

export { TalentProfileService, type TalentProfile, type SkillEntry, type TalentProfileRepository, type EmployeeDirectoryAdapter } from './talent/talent-profile.service';
export { realTalentProfileRepository } from './adapters/real-talent-profile-repository';
export { realEmployeeDirectoryAdapter } from './adapters/real-employee-directory-adapter';
export { talentProfileService } from './talent/talent-profile.singleton';
export { SkillMatchingService, skillMatchingService, type SkillRequirement, type MatchResult } from './talent/skill-matching.service';
export { SkillGapService, skillGapService, type SkillGap } from './talent/skill-gap.service';
export { RoleFitService, roleFitService, type RoleFitScore } from './talent/role-fit.service';

export { RequirementEngineService, type RawRequirement, type StructuredRequirement, type RequirementExtractor } from './recruitment/requirement-engine.service';
export { ScreeningEngineService, screeningEngineService, type ScreeningQuestion, type ScreeningTemplate, type ScreeningAnswer, type ScreeningResult } from './recruitment/screening-engine.service';
export { InterviewAssistantService, interviewAssistantService, type InterviewPlan, type InterviewScoreEntry, type InterviewEvaluation } from './recruitment/interview-assistant.service';
export { CandidateFeedbackService, type CandidateFeedback, type CandidateFeedbackStore, type FeedbackDecision } from './recruitment/candidate-feedback.service';
export { realCandidateFeedbackStore } from './adapters/real-candidate-feedback-store';
export { candidateFeedbackService } from './recruitment/candidate-feedback.singleton';

export { CareerPathService, careerPathService, type CareerPathTarget, type CareerPathSuggestion } from './career/career-path.service';
export { InternalTalentService, internalTalentService } from './career/internal-talent.service';

export { HiringFunnelService, hiringFunnelService, type FunnelStage, type FunnelEvent, type FunnelSnapshot } from './analytics/hiring-funnel.service';
export { WorkforceKpiService, type WorkforceKpiSnapshot, type WorkforceKpiDataSource } from './analytics/workforce-kpi.service';

// --- HTTP API (2026-09-13 mounting pass) ---
export { WorkforceController, workforceController, WorkforcePermissionDeniedError, WorkforceNotFoundError, type WorkforceAuthContext } from './controllers/workforce.controller';
export { workforceRoutes } from './routes/workforce.routes';
