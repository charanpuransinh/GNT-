// ============================================================================
// M31 — Workforce & HR Intelligence — wiring tests
// talent-profile.service.ts and candidate-feedback.service.ts are DB-gated
// (real talent_profile / candidate_feedback tables + real m12_employees);
// the rest is pure logic, no DB needed.
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';
import { talentProfileService } from '../talent/talent-profile.singleton';
import { candidateFeedbackService } from '../recruitment/candidate-feedback.singleton';
import { skillMatchingService } from '../talent/skill-matching.service';
import { skillGapService } from '../talent/skill-gap.service';
import { roleFitService } from '../talent/role-fit.service';
import { careerPathService } from '../career/career-path.service';
import { capacityPlanningService } from '../workforce/capacity-planning.service';
import { hiringFunnelService } from '../analytics/hiring-funnel.service';
import type { TalentProfile } from '../talent/talent-profile.service';

describe('M31 — pure logic (skill matching, role fit, career path, capacity, funnel)', () => {
  const profile: TalentProfile = {
    profileId: 'p1',
    tenantId: 't1',
    employeeId: 'e1',
    skills: [
      { skillId: 'ts', proficiencyLevel: 4 },
      { skillId: 'sql', proficiencyLevel: 2 },
    ],
    updatedAt: new Date().toISOString(),
  };
  const requirements = [
    { skillId: 'ts', minProficiency: 3 as const, weight: 0.7 },
    { skillId: 'sql', minProficiency: 4 as const, weight: 0.3 },
  ];

  it('scores a profile against requirements and reports gaps', () => {
    const [match] = skillMatchingService.match([profile], requirements);
    expect(match.matchedSkills).toEqual(['ts']);
    expect(match.missingSkills).toEqual(['sql']);
    expect(match.matchScorePct).toBeCloseTo(70);

    const gaps = skillGapService.findGaps(profile, requirements);
    expect(gaps).toEqual([{ skillId: 'sql', requiredLevel: 4, currentLevel: 2, gap: 2 }]);
  });

  it('computes explainable role-fit and career-path readiness from the same inputs', () => {
    const fit = roleFitService.calculate(profile, 'role-x', requirements);
    expect(fit.fitScorePct).toBeCloseTo(70);
    expect(fit.contributingFactors[0]).toContain('1/2');

    const [suggestion] = careerPathService.suggest(profile, [
      { roleId: 'role-x', roleTitle: 'Senior Dev', requirements },
    ]);
    expect(suggestion.developmentAreas).toEqual(['sql']);
    expect(suggestion.readinessPct).toBeCloseTo(50);
  });

  it('evaluates capacity gaps and tracks a hiring funnel', () => {
    const [gap] = capacityPlanningService.evaluate([{ departmentId: 'd1', requiredHeadcount: 5, availableHeadcount: 3 }]);
    expect(gap).toEqual({ departmentId: 'd1', gap: 2, status: 'UNDERSTAFFED' });

    const reqId = randomUUID();
    hiringFunnelService.record({ requirementId: reqId, candidateId: 'c1', stage: 'APPLIED', occurredAt: new Date().toISOString() });
    hiringFunnelService.record({ requirementId: reqId, candidateId: 'c1', stage: 'HIRED', occurredAt: new Date().toISOString() });
    const snapshot = hiringFunnelService.snapshot(reqId);
    expect(snapshot.counts.APPLIED).toBe(1);
    expect(snapshot.counts.HIRED).toBe(1);
    expect(snapshot.conversionRatePct).toBe(100);
  });
});

describe.runIf(process.env.TEST_DB === '1')('M31 — TalentProfileService / CandidateFeedbackService (real DB)', () => {
  let employeeId = '';
  let deptId = '';
  let desigId = '';

  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'M31 Test Co', code: 'M31TC' },
    });

    const dept = await prisma.department.create({ data: { code: `M31-D-${randomUUID().slice(0, 8)}`, name: 'M31 Dept', tenantId: TEST_COMPANY_ID } });
    deptId = dept.id;
    const desig = await prisma.designation.create({ data: { code: `M31-R-${randomUUID().slice(0, 8)}`, name: 'M31 Role', tenantId: TEST_COMPANY_ID } });
    desigId = desig.id;
    const employee = await prisma.employee.create({
      data: {
        employeeCode: `M31-E-${randomUUID().slice(0, 8)}`,
        firstName: 'Talent',
        lastName: 'Test',
        email: `talent-${randomUUID()}@test.local`,
        departmentId: deptId,
        designationId: desigId,
        dateOfJoining: new Date(),
        basicSalary: 50000,
        tenantId: TEST_COMPANY_ID,
      },
    });
    employeeId = employee.id;
  });

  afterAll(async () => {
    await prisma.talentProfile.deleteMany({ where: { companyId: TEST_COMPANY_ID } });
    await prisma.candidateFeedback.deleteMany({ where: { companyId: TEST_COMPANY_ID } });
    if (employeeId) await prisma.employee.deleteMany({ where: { id: employeeId } });
    if (deptId) await prisma.department.deleteMany({ where: { id: deptId } });
    if (desigId) await prisma.designation.deleteMany({ where: { id: desigId } });
  });

  it('rejects a talent profile for an unverified employeeId', async () => {
    await expect(
      talentProfileService.upsert({ tenantId: TEST_COMPANY_ID, employeeId: 'does-not-exist', skills: [] }),
    ).rejects.toThrow('Cannot create a talent profile for an unverified employeeId');
  });

  it('upserts and reads back a talent profile for a real employee', async () => {
    const created = await talentProfileService.upsert({
      tenantId: TEST_COMPANY_ID,
      employeeId,
      skills: [{ skillId: 'ts', proficiencyLevel: 5 }],
      summary: 'Strong TS engineer',
    });
    expect(created.profileId).toBeTruthy();

    const fetched = await talentProfileService.getByEmployee(employeeId, TEST_COMPANY_ID);
    expect(fetched?.summary).toBe('Strong TS engineer');
    expect(fetched?.skills).toEqual([{ skillId: 'ts', proficiencyLevel: 5 }]);
  });

  it('records candidate feedback and aggregates decision rate', async () => {
    const requirementId = randomUUID();
    await candidateFeedbackService.record({
      tenantId: TEST_COMPANY_ID, candidateId: 'cand-1', requirementId, managerId: 'mgr-1', decision: 'GOOD_FIT',
    });
    await candidateFeedbackService.record({
      tenantId: TEST_COMPANY_ID, candidateId: 'cand-2', requirementId, managerId: 'mgr-1', decision: 'NOT_FIT',
    });

    const rate = await candidateFeedbackService.decisionRate(requirementId, TEST_COMPANY_ID);
    expect(rate).toEqual({ GOOD_FIT: 1, MAYBE: 0, NOT_FIT: 1 });
  });
});
