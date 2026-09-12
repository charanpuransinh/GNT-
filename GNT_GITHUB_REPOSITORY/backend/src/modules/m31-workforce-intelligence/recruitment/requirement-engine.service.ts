/**
 * M31 — recruitment/requirement-engine.service.ts
 * OWN: Convert hiring requirements into structured criteria.
 * Naukri-inspired: AI requirement understanding / structured requirement.
 */

import { SkillRequirement } from '../talent/skill-matching.service';

export interface RawRequirement {
  tenantId: string;
  roleTitle: string;
  freeTextDescription: string;
  minExperienceYears?: number;
}

export interface StructuredRequirement {
  requirementId: string;
  tenantId: string;
  roleTitle: string;
  minExperienceYears: number;
  skillRequirements: SkillRequirement[];
  createdAt: string;
}

export interface RequirementExtractor {
  /** Real NLP/AI extraction happens here once an AI provider is verified. */
  extractSkills(freeTextDescription: string): Promise<SkillRequirement[]>;
}

export class RequirementEngineService {
  constructor(private readonly extractor: RequirementExtractor) {}

  async build(raw: RawRequirement): Promise<StructuredRequirement> {
    const skillRequirements = await this.extractor.extractSkills(raw.freeTextDescription);
    return {
      requirementId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      tenantId: raw.tenantId,
      roleTitle: raw.roleTitle,
      minExperienceYears: raw.minExperienceYears ?? 0,
      skillRequirements,
      createdAt: new Date().toISOString(),
    };
  }
}
