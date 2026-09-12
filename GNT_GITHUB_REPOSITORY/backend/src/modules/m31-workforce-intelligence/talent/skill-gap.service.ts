/**
 * M31 — talent/skill-gap.service.ts
 * OWN: Identify missing skills.
 */

import { TalentProfile } from './talent-profile.service';
import { SkillRequirement } from './skill-matching.service';

export interface SkillGap {
  skillId: string;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
}

export class SkillGapService {
  findGaps(profile: TalentProfile, requirements: SkillRequirement[]): SkillGap[] {
    const skillMap = new Map(profile.skills.map((s) => [s.skillId, s.proficiencyLevel]));
    const gaps: SkillGap[] = [];

    for (const req of requirements) {
      const currentLevel = skillMap.get(req.skillId) ?? 0;
      if (currentLevel < req.minProficiency) {
        gaps.push({
          skillId: req.skillId,
          requiredLevel: req.minProficiency,
          currentLevel,
          gap: req.minProficiency - currentLevel,
        });
      }
    }

    return gaps.sort((a, b) => b.gap - a.gap);
  }
}

export const skillGapService = new SkillGapService();
