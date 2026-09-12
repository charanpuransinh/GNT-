/**
 * M31 — adapters/real-talent-profile-repository.ts
 * WIRED (2026-09-12): TalentProfileRepository backed by the new
 * `talent_profile` table (migration 024) — genuinely new, does not touch
 * any M12 table.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/common/config/prisma';
import type { TalentProfile, TalentProfileRepository } from '../talent/talent-profile.service';

function toDomain(row: {
  id: string;
  companyId: string;
  employeeId: string;
  skills: Prisma.JsonValue;
  summary: string | null;
  updatedAt: Date;
}): TalentProfile {
  return {
    profileId: row.id,
    tenantId: row.companyId,
    employeeId: row.employeeId,
    skills: row.skills as unknown as TalentProfile['skills'],
    summary: row.summary ?? undefined,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class RealTalentProfileRepository implements TalentProfileRepository {
  async save(profile: TalentProfile): Promise<void> {
    await prisma.talentProfile.upsert({
      where: { id: profile.profileId },
      update: {
        companyId: profile.tenantId,
        employeeId: profile.employeeId,
        skills: profile.skills as unknown as Prisma.InputJsonValue,
        summary: profile.summary,
      },
      create: {
        id: profile.profileId,
        companyId: profile.tenantId,
        employeeId: profile.employeeId,
        skills: profile.skills as unknown as Prisma.InputJsonValue,
        summary: profile.summary,
      },
    });
  }

  async find(profileId: string, tenantId: string): Promise<TalentProfile | null> {
    const row = await prisma.talentProfile.findFirst({ where: { id: profileId, companyId: tenantId } });
    return row ? toDomain(row) : null;
  }

  async findByEmployee(employeeId: string, tenantId: string): Promise<TalentProfile | null> {
    const row = await prisma.talentProfile.findUnique({ where: { companyId_employeeId: { companyId: tenantId, employeeId } } });
    return row ? toDomain(row) : null;
  }
}

export const realTalentProfileRepository = new RealTalentProfileRepository();
