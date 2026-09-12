/**
 * M31 — talent/skill-matching.service.ts
 * OWN: Match people to requirements.
 */

import { TalentProfile, SkillEntry } from './talent-profile.service';

export interface SkillRequirement {
  skillId: string;
  minProficiency: 1 | 2 | 3 | 4 | 5;
  weight: number; // relative importance, 0-1
}

export interface MatchResult {
  profileId: string;
  employeeId: string;
  matchScorePct: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export class SkillMatchingService {
  match(profiles: TalentProfile[], requirements: SkillRequirement[]): MatchResult[] {
    return profiles
      .map((profile) => this.scoreProfile(profile, requirements))
      .sort((a, b) => b.matchScorePct - a.matchScorePct);
  }

  private scoreProfile(profile: TalentProfile, requirements: SkillRequirement[]): MatchResult {
    const skillMap = new Map<string, SkillEntry>(profile.skills.map((s) => [s.skillId, s]));
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    for (const req of requirements) {
      totalWeight += req.weight;
      const skill = skillMap.get(req.skillId);
      if (skill && skill.proficiencyLevel >= req.minProficiency) {
        matchedSkills.push(req.skillId);
        earnedWeight += req.weight;
      } else {
        missingSkills.push(req.skillId);
      }
    }

    const matchScorePct = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;

    return {
      profileId: profile.profileId,
      employeeId: profile.employeeId,
      matchScorePct,
      matchedSkills,
      missingSkills,
    };
  }
}

export const skillMatchingService = new SkillMatchingService();
