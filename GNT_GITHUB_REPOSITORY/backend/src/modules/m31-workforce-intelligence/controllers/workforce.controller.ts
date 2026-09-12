/**
 * M31 — controllers/workforce.controller.ts
 * OWN: Workforce & HR Intelligence HTTP API. Framework-agnostic, standard
 * success/failure envelope (same shape as M23/M24/M26/M27/M28/M29
 * controllers).
 *
 * Only the real, DB-backed/pure-computation singletons are exposed:
 * talentProfileService (real talent_profile table + verified M12 employee
 * check), skillMatchingService/skillGapService/roleFitService (pure
 * computation over a fetched profile — never invented data), and
 * capacityPlanningService (pure computation over caller-supplied numbers).
 * WorkforceIntelligenceService/WorkforceForecastService/RequirementEngineService
 * etc. have no default singleton (no verified provider exists) and are
 * intentionally NOT exposed here — matches M30's same "correctly
 * un-instantiated" pattern.
 */

import { TalentProfileService, type TalentProfile } from '../talent/talent-profile.service';
import { talentProfileService } from '../talent/talent-profile.singleton';
import { SkillMatchingService, skillMatchingService, type SkillRequirement, type MatchResult } from '../talent/skill-matching.service';
import { SkillGapService, skillGapService, type SkillGap } from '../talent/skill-gap.service';
import { RoleFitService, roleFitService, type RoleFitScore } from '../talent/role-fit.service';
import { CapacityPlanningService, capacityPlanningService, type CapacityInput, type CapacityGap } from '../workforce/capacity-planning.service';

export interface WorkforceAuthContext {
  userId: string;
  tenantId: string;
  permissions: string[];
}

export interface ApiSuccess<T> { success: true; data: T; meta: { correlationId: string } }
export interface ApiFailure { success: false; error: { code: string; message: string }; meta: { correlationId: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class WorkforcePermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkforcePermissionDeniedError';
  }
}
export class WorkforceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkforceNotFoundError';
  }
}

export class WorkforceController {
  constructor(
    private readonly profiles: TalentProfileService = talentProfileService,
    private readonly matching: SkillMatchingService = skillMatchingService,
    private readonly gaps: SkillGapService = skillGapService,
    private readonly roleFit: RoleFitService = roleFitService,
    private readonly capacity: CapacityPlanningService = capacityPlanningService,
  ) {}

  async getTalentProfile(auth: WorkforceAuthContext, employeeId: string, correlationId: string): Promise<ApiResponse<TalentProfile | null>> {
    try {
      this.requirePermission(auth, 'M31:view');
      const data = await this.profiles.getByEmployee(employeeId, auth.tenantId);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async upsertTalentProfile(
    auth: WorkforceAuthContext,
    input: { profileId?: string; employeeId: string; skills: TalentProfile['skills']; summary?: string },
    correlationId: string,
  ): Promise<ApiResponse<TalentProfile>> {
    try {
      this.requirePermission(auth, 'M31:edit');
      const data = await this.profiles.upsert({
        profileId: input.profileId,
        tenantId: auth.tenantId,
        employeeId: input.employeeId,
        skills: input.skills ?? [],
        summary: input.summary,
      });
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async matchSkills(
    auth: WorkforceAuthContext,
    employeeIds: string[],
    requirements: SkillRequirement[],
    correlationId: string,
  ): Promise<ApiResponse<MatchResult[]>> {
    try {
      this.requirePermission(auth, 'M31:view');
      const profiles = await this.fetchProfiles(auth.tenantId, employeeIds);
      const data = this.matching.match(profiles, requirements ?? []);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async skillGaps(
    auth: WorkforceAuthContext,
    employeeId: string,
    requirements: SkillRequirement[],
    correlationId: string,
  ): Promise<ApiResponse<SkillGap[]>> {
    try {
      this.requirePermission(auth, 'M31:view');
      const profile = await this.profiles.getByEmployee(employeeId, auth.tenantId);
      if (!profile) throw new WorkforceNotFoundError(`No talent profile for employee ${employeeId}`);
      const data = this.gaps.findGaps(profile, requirements ?? []);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async roleFitScore(
    auth: WorkforceAuthContext,
    employeeId: string,
    roleId: string,
    requirements: SkillRequirement[],
    correlationId: string,
  ): Promise<ApiResponse<RoleFitScore>> {
    try {
      this.requirePermission(auth, 'M31:view');
      const profile = await this.profiles.getByEmployee(employeeId, auth.tenantId);
      if (!profile) throw new WorkforceNotFoundError(`No talent profile for employee ${employeeId}`);
      const data = this.roleFit.calculate(profile, roleId, requirements ?? []);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  async capacityPlan(auth: WorkforceAuthContext, inputs: CapacityInput[], correlationId: string): Promise<ApiResponse<CapacityGap[]>> {
    try {
      this.requirePermission(auth, 'M31:view');
      const data = this.capacity.evaluate(inputs ?? []);
      return { success: true, data, meta: { correlationId } };
    } catch (err) {
      return this.toFailure(err, correlationId);
    }
  }

  /** Fetch each employee's profile scoped to the caller's own tenant — never another tenant's. */
  private async fetchProfiles(tenantId: string, employeeIds: string[]): Promise<TalentProfile[]> {
    const results = await Promise.all(employeeIds.map((id) => this.profiles.getByEmployee(id, tenantId)));
    return results.filter((p): p is TalentProfile => p !== null);
  }

  private requirePermission(auth: WorkforceAuthContext, permission: string): void {
    if (!auth.permissions.includes(permission)) {
      throw new WorkforcePermissionDeniedError(`Missing permission ${permission}`);
    }
  }

  private toFailure(err: unknown, correlationId: string): ApiFailure {
    const code =
      err instanceof WorkforcePermissionDeniedError ? 'WORKFORCE_ACCESS_DENIED' :
      err instanceof WorkforceNotFoundError ? 'WORKFORCE_NOT_FOUND' :
      'WORKFORCE_ERROR';
    const message = err instanceof Error ? err.message : 'Unexpected workforce error';
    return { success: false, error: { code, message }, meta: { correlationId } };
  }
}

export const workforceController = new WorkforceController();
