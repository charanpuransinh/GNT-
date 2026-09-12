/**
 * M31 — talent/talent-profile.service.ts
 * OWN: Normalized skill/profile intelligence.
 * SECURITY: HR data is highly sensitive — scope and field-level masking mandatory.
 * Backs table: talent_profile (proposed, tenant-owned).
 *
 * USE (per blueprint): existing employee/user data only through verified
 * public contracts. Depends on an injected EmployeeDirectoryAdapter.
 */

export interface SkillEntry {
  skillId: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  yearsExperience?: number;
}

export interface TalentProfile {
  profileId: string;
  tenantId: string;
  employeeId: string; // verified reference into the owning employee module, never guessed
  skills: SkillEntry[];
  summary?: string;
  updatedAt: string;
}

export interface TalentProfileRepository {
  save(profile: TalentProfile): Promise<void>;
  find(profileId: string, tenantId: string): Promise<TalentProfile | null>;
  findByEmployee(employeeId: string, tenantId: string): Promise<TalentProfile | null>;
}

export interface EmployeeDirectoryAdapter {
  /** Verified adapter into the real employee module — never a guessed table. */
  employeeExists(employeeId: string, tenantId: string): Promise<boolean>;
}

export class TalentProfileService {
  constructor(
    private readonly repository: TalentProfileRepository,
    private readonly employeeDirectory: EmployeeDirectoryAdapter,
  ) {}

  async upsert(profile: Omit<TalentProfile, 'profileId' | 'updatedAt'> & { profileId?: string }): Promise<TalentProfile> {
    const exists = await this.employeeDirectory.employeeExists(profile.employeeId, profile.tenantId);
    if (!exists) {
      throw new Error('Cannot create a talent profile for an unverified employeeId');
    }
    const full: TalentProfile = {
      profileId: profile.profileId ?? `tal_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      tenantId: profile.tenantId,
      employeeId: profile.employeeId,
      skills: profile.skills,
      summary: profile.summary,
      updatedAt: new Date().toISOString(),
    };
    await this.repository.save(full);
    return full;
  }

  async getByEmployee(employeeId: string, tenantId: string): Promise<TalentProfile | null> {
    return this.repository.findByEmployee(employeeId, tenantId);
  }
}
