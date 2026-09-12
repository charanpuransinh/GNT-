// ============================================================================
// M31 — Workforce & HR Intelligence — real DB + real HTTP wiring
//
// Mounted 2026-09-13 at /api/v1/workforce (module-registry.ts). Verifies
// the module is actually reachable and that talent-profile access is
// scoped to real, verified M12 employees within the caller's own tenant.
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { mintBearer, TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M31 — Workforce & HR Intelligence (real DB, real HTTP)', () => {
  let employeeId = '';
  let deptId = '';
  let desigId = '';

  beforeAll(async () => {
    await registerModules();
    const dept = await prisma.department.create({ data: { code: `M31H-D-${randomUUID().slice(0, 8)}`, name: 'M31 HTTP Dept', tenantId: TEST_COMPANY_ID } });
    deptId = dept.id;
    const desig = await prisma.designation.create({ data: { code: `M31H-R-${randomUUID().slice(0, 8)}`, name: 'M31 HTTP Role', tenantId: TEST_COMPANY_ID } });
    desigId = desig.id;
    const employee = await prisma.employee.create({
      data: {
        employeeCode: `M31H-E-${randomUUID().slice(0, 8)}`,
        firstName: 'HTTP', lastName: 'Test',
        email: `m31http-${randomUUID()}@test.local`,
        departmentId: deptId, designationId: desigId,
        dateOfJoining: new Date(), basicSalary: 40000,
        tenantId: TEST_COMPANY_ID,
      },
    });
    employeeId = employee.id;
  });

  afterAll(async () => {
    await prisma.talentProfile.deleteMany({ where: { companyId: TEST_COMPANY_ID } });
    if (employeeId) await prisma.employee.deleteMany({ where: { id: employeeId } });
    if (deptId) await prisma.department.deleteMany({ where: { id: deptId } });
    if (desigId) await prisma.designation.deleteMany({ where: { id: desigId } });
  });

  it('GET /talent-profile/:employeeId 401s without a token (module is actually mounted, not a stray 404)', async () => {
    const res = await request(app).get(`/api/v1/workforce/talent-profile/${employeeId}`);
    expect(res.status).toBe(401);
  });

  it('PUT /talent-profile rejects an unverified employeeId (real M12 check, not fabricated)', async () => {
    const res = await request(app)
      .put('/api/v1/workforce/talent-profile')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ employeeId: 'does-not-exist', skills: [] });
    expect(res.status).toBe(500);
    expect(res.body.error.message).toContain('unverified employeeId');
  });

  it('PUT /talent-profile creates a real talent_profile row for a real employee', async () => {
    const res = await request(app)
      .put('/api/v1/workforce/talent-profile')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ employeeId, skills: [{ skillId: 'typescript', proficiencyLevel: 4 }] });
    expect(res.status).toBe(200);
    expect(res.body.data.employeeId).toBe(employeeId);

    const row = await prisma.talentProfile.findFirst({ where: { employeeId, companyId: TEST_COMPANY_ID } });
    expect(row).not.toBeNull();
  });

  it('GET /talent-profile/:employeeId returns the profile just created', async () => {
    const res = await request(app)
      .get(`/api/v1/workforce/talent-profile/${employeeId}`)
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID));
    expect(res.status).toBe(200);
    expect(res.body.data.employeeId).toBe(employeeId);
  });

  it('POST /skill-match scores the real profile against requirements', async () => {
    const res = await request(app)
      .post('/api/v1/workforce/skill-match')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ employeeIds: [employeeId], requirements: [{ skillId: 'typescript', minProficiency: 3, weight: 1 }] });
    expect(res.status).toBe(200);
    expect(res.body.data[0].matchScorePct).toBe(100);
  });

  it('POST /skill-gap 404s for an employee with no talent profile', async () => {
    const res = await request(app)
      .post('/api/v1/workforce/skill-gap')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ employeeId: 'no-profile-employee', requirements: [] });
    expect(res.status).toBe(404);
  });

  it('POST /capacity-plan runs a pure computation, no DB involved', async () => {
    const res = await request(app)
      .post('/api/v1/workforce/capacity-plan')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ inputs: [{ departmentId: 'd1', requiredHeadcount: 10, availableHeadcount: 7 }] });
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toEqual({ departmentId: 'd1', gap: 3, status: 'UNDERSTAFFED' });
  });
});
