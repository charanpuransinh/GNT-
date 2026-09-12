/**
 * M31 — talent/role-fit.service.ts
 * OWN: Calculate explainable role-fit score.
 * AI Safety Contract: EXPLAINABILITY — show relevant contributing factors.
 */

import { TalentProfile } from './talent-profile.service';
import { SkillMatchingService, skillMatchingService, SkillRequirement } from './skill-matching.service';

export interface RoleFitScore {
  employeeId: string;
  roleId: string;
  fitScorePct: number;
  contributingFactors: string[];
}

export class RoleFitService {
  constructor(private readonly skillMatching: SkillMatchingService = skillMatchingService) {}

  calculate(profile: TalentProfile, roleId: string, requirements: SkillRequirement[]): RoleFitScore {
    const [result] = this.skillMatching.match([profile], requirements);

    const contributingFactors = [
      `${result.matchedSkills.length}/${requirements.length} required skills met`,
      ...(result.missingSkills.length > 0 ? [`Missing: ${result.missingSkills.join(', ')}`] : []),
    ];

    return {
      employeeId: profile.employeeId,
      roleId,
      fitScorePct: result.matchScorePct,
      contributingFactors,
    };
  }
}

export const roleFitService = new RoleFitService();
