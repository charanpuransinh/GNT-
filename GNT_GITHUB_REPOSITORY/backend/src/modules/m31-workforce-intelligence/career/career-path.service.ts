/**
 * M31 — career/career-path.service.ts
 * OWN: Suggest internal development paths.
 * Backs table: career_path (proposed, tenant-owned).
 */

import { TalentProfile } from '../talent/talent-profile.service';
import { SkillGapService, skillGapService } from '../talent/skill-gap.service';
import { SkillRequirement } from '../talent/skill-matching.service';

export interface CareerPathTarget {
  roleId: string;
  roleTitle: string;
  requirements: SkillRequirement[];
}

export interface CareerPathSuggestion {
  employeeId: string;
  targetRoleId: string;
  targetRoleTitle: string;
  readinessPct: number;
  developmentAreas: string[];
}

export class CareerPathService {
  constructor(private readonly skillGap: SkillGapService = skillGapService) {}

  suggest(profile: TalentProfile, targets: CareerPathTarget[]): CareerPathSuggestion[] {
    return targets
      .map((target) => {
        const gaps = this.skillGap.findGaps(profile, target.requirements);
        const readinessPct = target.requirements.length > 0
          ? ((target.requirements.length - gaps.length) / target.requirements.length) * 100
          : 100;
        return {
          employeeId: profile.employeeId,
          targetRoleId: target.roleId,
          targetRoleTitle: target.roleTitle,
          readinessPct,
          developmentAreas: gaps.map((g) => g.skillId),
        };
      })
      .sort((a, b) => b.readinessPct - a.readinessPct);
  }
}

export const careerPathService = new CareerPathService();
