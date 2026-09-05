// ============================================================================
// M12 — HR tenant isolation (DB-gated) — employee दूसरी company से सुरक्षित
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { EmployeeService } from '../../services/employee.service';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-000000000099';
const service = new EmployeeService();

async function cleanup() {
  await prisma.employee.deleteMany({ where: { tenantId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] } } });
  await prisma.designation.deleteMany({ where: { tenantId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] } } });
  await prisma.department.deleteMany({ where: { tenantId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] } } });
}

describe.runIf(process.env.TEST_DB === '1')('M12 HR tenant isolation — live DB', () => {
  let employeeId = '';

  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: { name: 'Test Company' },
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    await prisma.company_master.upsert({
      where: { id: OTHER_COMPANY_ID },
      update: { name: 'Other Company' },
      create: { id: OTHER_COMPANY_ID, name: 'Other Company', code: 'OTHERCO' },
    });
    await cleanup();

    const dept = await prisma.department.create({
      data: { tenantId: TEST_COMPANY_ID, code: 'DEPT-T1', name: 'Sales' },
    });
    const desig = await prisma.designation.create({
      data: { tenantId: TEST_COMPANY_ID, code: 'DES-T1', name: 'Executive' },
    });
    const emp = await service.create(TEST_COMPANY_ID, {
      firstName: 'Ravi', lastName: 'Kumar', email: 'ravi@test.com',
      departmentId: dept.id, designationId: desig.id,
      dateOfJoining: new Date('2026-01-01'), basicSalary: 50000,
    });
    employeeId = emp.id;
  });

  afterAll(async () => {
    await cleanup();
  });

  it('दूसरी company employee पढ़ न पाए', async () => {
    expect(await service.findOne(TEST_COMPANY_ID, employeeId)).not.toBeNull();
    expect(await service.findOne(OTHER_COMPANY_ID, employeeId)).toBeNull();
  });

  it('दूसरी company employee बदल न पाए', async () => {
    await expect(service.update(OTHER_COMPANY_ID, employeeId, { firstName: 'HACKED' })).rejects.toThrow();
    const still = await service.findOne(TEST_COMPANY_ID, employeeId);
    expect(still).not.toBeNull();
    expect(still!.firstName).toBe('Ravi');
  });

  it('दूसरी company employee हटा न पाए (terminate)', async () => {
    await expect(service.remove(OTHER_COMPANY_ID, employeeId)).rejects.toThrow();
    const still = await service.findOne(TEST_COMPANY_ID, employeeId);
    expect(still).not.toBeNull();
    expect(still!.employmentStatus).toBe('ACTIVE');
  });
});
