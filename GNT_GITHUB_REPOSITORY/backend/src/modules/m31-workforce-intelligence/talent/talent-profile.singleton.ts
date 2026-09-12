/**
 * M31 — talent/talent-profile.singleton.ts
 * Default TalentProfileService wired against the real repository + real
 * M12 employee directory (no invented adapters).
 */

import { TalentProfileService } from './talent-profile.service';
import { realTalentProfileRepository } from '../adapters/real-talent-profile-repository';
import { realEmployeeDirectoryAdapter } from '../adapters/real-employee-directory-adapter';

export const talentProfileService = new TalentProfileService(realTalentProfileRepository, realEmployeeDirectoryAdapter);
