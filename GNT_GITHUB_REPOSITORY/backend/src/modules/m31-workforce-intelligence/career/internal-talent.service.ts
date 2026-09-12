/**
 * M31 — career/internal-talent.service.ts
 * OWN: Find suitable internal employees for roles.
 * Naukri-inspired: internal talent matching / cross-platform discovery
 * (implemented internally — GNT never exposes candidates externally).
 */

import { TalentProfile } from '../talent/talent-profile.service';
import { SkillMatchingService, skillMatchingService, SkillRequirement, MatchResult } from '../talent/skill-matching.service';

export class InternalTalentService {
  constructor(private readonly skillMatching: SkillMatchingService = skillMatchingService) {}

  findCandidates(profiles: TalentProfile[], requirements: SkillRequirement[], minMatchPct = 50): MatchResult[] {
    return this.skillMatching.match(profiles, requirements).filter((r) => r.matchScorePct >= minMatchPct);
  }
}

export const internalTalentService = new InternalTalentService();
