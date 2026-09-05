// ============================================================================
// M12 — हाल के 6 bug-fixes की जाँच (DB-gated):
//   1. payroll अब असली attendance से days भरता है (hardcoded 0 नहीं)
//   2. leave balance approve पर year-scoped है
//   3. leave number tenant-scoped है
// NOTE: parallel run में टकराव न हो, इसलिए अलग company-id।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const COMPANY_ID = '00000000-0000-4000-8000-000000000022';
const OTHER_ID = '00000000-0000-4000-8000-000000000023';
const auth = () => mintBearer(COMPANY_ID, TEST_USER_ID);
const authOther = () => mintBearer(OTHER_ID, TEST_USER_ID);

async function cleanupTenant(tenantId: string) {
  await prisma.attendance.deleteMany({ where: { tenantId } });
  await prisma.leave.deleteMany({ where: { tenantId } });
  await prisma.leaveBalance.deleteMany({ where: { employee: { tenantId } } });
  await prisma.leaveType.deleteMany({ where: { tenantId } });
  await prisma.payroll.deleteMany({ where: { tenantId } });
  await prisma.employee.deleteMany({ where: { tenantId } });
  await prisma.designation.deleteMany({ where: { tenantId } });
  await prisma.department.deleteMany({ where: { tenantId } });
}

describe.runIf(process.env.TEST_DB === '1')('M12 bug-fixes — live DB', () => {
  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({ where: { id: COMPANY_ID }, update: { name: 'Fix Co' }, create: { id: COMPANY_ID, name: 'Fix Co', code: 'FIXCO' } });
    await prisma.company_master.upsert({ where: { id: OTHER_ID }, update: { name: 'Fix Other' }, create: { id: OTHER_ID, name: 'Fix Other', code: 'FIXOT' } });
    await cleanupTenant(COMPANY_ID);
    await cleanupTenant(OTHER_ID);
  });

  afterAll(async () => {
    await cleanupTenant(COMPANY_ID);
    await cleanupTenant(OTHER_ID);
  });

  it('payroll: असली attendance से daysWorked/daysAbsent भरता है (0 hardcoded नहीं)', async () => {
    const dept = await prisma.department.create({ data: { tenantId: COMPANY_ID, code: 'D-FIX', name: 'Dept' } });
    const desig = await prisma.designation.create({ data: { tenantId: COMPANY_ID, code: 'DS-FIX', name: 'Desig' } });
    const emp = await prisma.employee.create({
      data: { tenantId: COMPANY_ID, firstName: 'A', lastName: 'B', email: 'a@fix.com', departmentId: dept.id, designationId: desig.id, dateOfJoining: new Date('2026-01-01'), employeeCode: 'EMP-FIX1', basicSalary: 30000 },
    });

    // Feb 2026: 3 PRESENT + 1 ABSENT
    await prisma.attendance.createMany({
      data: [
        { employeeId: emp.id, tenantId: COMPANY_ID, date: new Date('2026-02-02'), status: 'PRESENT' },
        { employeeId: emp.id, tenantId: COMPANY_ID, date: new Date('2026-02-03'), status: 'PRESENT' },
        { employeeId: emp.id, tenantId: COMPANY_ID, date: new Date('2026-02-04'), status: 'PRESENT' },
        { employeeId: emp.id, tenantId: COMPANY_ID, date: new Date('2026-02-05'), status: 'ABSENT' },
      ],
    });

    const res = await request(app)
      .post('/api/v1/hr/payroll/generate')
      .set('Authorization', auth())
      .send({ month: 2, year: 2026 });
    expect(res.status).toBe(201);

    const payroll = await prisma.payroll.findFirst({ where: { employeeId: emp.id, month: 2, year: 2026 } });
    expect(payroll).toBeTruthy();
    expect(Number(payroll!.daysWorked)).toBe(3);
    expect(Number(payroll!.daysAbsent)).toBe(1);
  });

  it('leave: approve करने पर सिर्फ़ उसी साल का balance घटता है (year-scoped)', async () => {
    const dept = await prisma.department.create({ data: { tenantId: COMPANY_ID, code: 'D-LV', name: 'Dept' } });
    const desig = await prisma.designation.create({ data: { tenantId: COMPANY_ID, code: 'DS-LV', name: 'Desig' } });
    const emp = await prisma.employee.create({
      data: { tenantId: COMPANY_ID, firstName: 'L', lastName: 'M', email: 'l@fix.com', departmentId: dept.id, designationId: desig.id, dateOfJoining: new Date('2026-01-01'), employeeCode: 'EMP-FIX2', basicSalary: 30000 },
    });
    const lt = await prisma.leaveType.create({ data: { tenantId: COMPANY_ID, code: 'LV-FIX', name: 'Leave', annualQuota: 20 } });

    // 2026 का balance (current) + 2027 का अलग balance बना दो
    await prisma.leaveBalance.create({ data: { employeeId: emp.id, year: 2026, annual: 20, sick: 10, casual: 5, unpaid: 0, used: 0 } });
    await prisma.leaveBalance.create({ data: { employeeId: emp.id, year: 2027, annual: 20, sick: 10, casual: 5, unpaid: 0, used: 0 } });

    const apply = await request(app)
      .post('/api/v1/hr/leaves')
      .set('Authorization', auth())
      .send({ employeeId: emp.id, leaveTypeId: lt.id, reason: 'test', startDate: '2026-03-10', endDate: '2026-03-11' });
    expect(apply.status).toBe(201);

    const approve = await request(app)
      .post(`/api/v1/hr/leaves/${apply.body.data.id}/approve`)
      .set('Authorization', auth())
      .send({});
    expect(approve.status).toBe(200);

    const b2026 = await prisma.leaveBalance.findUnique({ where: { employeeId_year: { employeeId: emp.id, year: 2026 } } });
    const b2027 = await prisma.leaveBalance.findUnique({ where: { employeeId_year: { employeeId: emp.id, year: 2027 } } });
    expect(Number(b2026!.used)).toBe(2);  // 2 din ki leave
    expect(Number(b2027!.used)).toBe(0);  // doosre saal ka balance untouched
  });

  it('leave: number tenant-scoped hai — fresh tenant ki pehli leave LEV-2026-0001', async () => {
    const dept = await prisma.department.create({ data: { tenantId: OTHER_ID, code: 'D-OT', name: 'Dept' } });
    const desig = await prisma.designation.create({ data: { tenantId: OTHER_ID, code: 'DS-OT', name: 'Desig' } });
    const emp = await prisma.employee.create({
      data: { tenantId: OTHER_ID, firstName: 'O', lastName: 'P', email: 'o@fix.com', departmentId: dept.id, designationId: desig.id, dateOfJoining: new Date('2026-01-01'), employeeCode: 'EMP-FIX3', basicSalary: 30000 },
    });
    const lt = await prisma.leaveType.create({ data: { tenantId: OTHER_ID, code: 'LV-OT', name: 'Leave', annualQuota: 20 } });

    const apply = await request(app)
      .post('/api/v1/hr/leaves')
      .set('Authorization', authOther())
      .send({ employeeId: emp.id, leaveTypeId: lt.id, reason: 'test', startDate: '2026-03-10', endDate: '2026-03-10' });
    expect(apply.status).toBe(201);

    // इस tenant की pehli leave → count 1 → LEV-2026-0001 (global counter नहीं)
    expect(apply.body.data.leaveNumber).toBe('LEV-2026-0001');
  });
});
