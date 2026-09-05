// ============================================================================
// M12 — HR feature coverage (DB-gated): employee/department/attendance/leave/payroll
// (tenant-isolation पहले से tenant-isolation.db.test.ts में है)
// NOTE: parallel run में टकराव न हो, इसलिए अलग company-id।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const COMPANY_ID = '00000000-0000-4000-8000-000000000020';
const OTHER_ID = '00000000-0000-4000-8000-000000000021';
const auth = () => mintBearer(COMPANY_ID, TEST_USER_ID);
const authOther = () => mintBearer(OTHER_ID, TEST_USER_ID);

async function cleanupTenant(tenantId: string) {
  await prisma.attendance.deleteMany({ where: { tenantId } });
  await prisma.leave.deleteMany({ where: { tenantId } });
  await prisma.leaveBalance.deleteMany({ where: { employee: { tenantId } } });
  await prisma.leaveType.deleteMany({ where: { tenantId } });
  await prisma.payroll.deleteMany({ where: { tenantId } });
  await prisma.employeeDocument.deleteMany({ where: { employee: { tenantId } } });
  await prisma.employee.deleteMany({ where: { tenantId } });
  await prisma.designation.deleteMany({ where: { tenantId } });
  await prisma.department.deleteMany({ where: { tenantId } });
}

describe.runIf(process.env.TEST_DB === '1')('M12 HR features — live DB', () => {
  let deptId = '';
  let desigId = '';
  let employeeId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: COMPANY_ID },
      update: { name: 'HR Co' },
      create: { id: COMPANY_ID, name: 'HR Co', code: 'HRCO' },
    });
    await prisma.company_master.upsert({
      where: { id: OTHER_ID },
      update: { name: 'HR Other' },
      create: { id: OTHER_ID, name: 'HR Other', code: 'HROT' },
    });
    await cleanupTenant(COMPANY_ID);
    await cleanupTenant(OTHER_ID);
  });

  afterAll(async () => {
    await cleanupTenant(COMPANY_ID);
    await cleanupTenant(OTHER_ID);
  });

  it('department: create → list → tree → update → delete (empty)', async () => {
    const created = await request(app)
      .post('/api/v1/hr/departments')
      .set('Authorization', auth())
      .send({ code: 'SALES-HR', name: 'Sales' });
    expect(created.status).toBe(201);
    deptId = created.body.data.id;

    const list = await request(app).get('/api/v1/hr/departments').set('Authorization', auth());
    expect(list.status).toBe(200);
    expect(list.body.data.some((d: { id: string }) => d.id === deptId)).toBe(true);

    const tree = await request(app).get('/api/v1/hr/departments/tree').set('Authorization', auth());
    expect(tree.status).toBe(200);

    const upd = await request(app)
      .patch(`/api/v1/hr/departments/${deptId}`)
      .set('Authorization', auth())
      .send({ name: 'Sales v2' });
    expect(upd.status).toBe(200);

    // empty department delete (अभी कोई employee नहीं)
    const emptyDept = await request(app)
      .post('/api/v1/hr/departments')
      .set('Authorization', auth())
      .send({ code: 'EMPTY-HR', name: 'Empty' });
    const emptyDel = await request(app)
      .delete(`/api/v1/hr/departments/${emptyDept.body.data.id}`)
      .set('Authorization', auth());
    expect(emptyDel.status).toBe(200);
  });

  it('employee: create → findOne → list → update → stats → tenant isolation', async () => {
    const desig = await prisma.designation.create({
      data: { tenantId: COMPANY_ID, code: 'EXEC-HR', name: 'Executive' },
    });
    desigId = desig.id;

    const created = await request(app)
      .post('/api/v1/hr/employees')
      .set('Authorization', auth())
      .send({
        firstName: 'Ravi', lastName: 'Kumar', email: 'ravi@hr.com',
        departmentId: deptId, designationId: desigId,
        dateOfJoining: '2026-01-01T00:00:00.000Z', basicSalary: 50000,
      });
    expect(created.status).toBe(201);
    employeeId = created.body.data.id;

    const one = await request(app).get(`/api/v1/hr/employees/${employeeId}`).set('Authorization', auth());
    expect(one.status).toBe(200);
    expect(one.body.data.firstName).toBe('Ravi');

    const list = await request(app).get('/api/v1/hr/employees').set('Authorization', auth());
    expect(list.status).toBe(200);
    expect(list.body.data.some((e: { id: string }) => e.id === employeeId)).toBe(true);

    const upd = await request(app)
      .patch(`/api/v1/hr/employees/${employeeId}`)
      .set('Authorization', auth())
      .send({ firstName: 'Ravikant' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.firstName).toBe('Ravikant');

    const stats = await request(app).get('/api/v1/hr/employees/stats').set('Authorization', auth());
    expect(stats.status).toBe(200);
    expect(stats.body.data.total).toBeGreaterThanOrEqual(1);

    const otherRead = await request(app).get(`/api/v1/hr/employees/${employeeId}`).set('Authorization', authOther());
    expect(otherRead.status).toBe(404);
  });

  it('attendance: check-in → check-out → getByEmployee', async () => {
    const checkIn = await request(app)
      .post('/api/v1/hr/attendance/check-in')
      .set('Authorization', auth())
      .send({ employeeId, location: 'office', notes: 'on time' });
    expect(checkIn.status).toBe(201);

    const checkOut = await request(app)
      .post('/api/v1/hr/attendance/check-out')
      .set('Authorization', auth())
      .send({ employeeId, notes: 'done' });
    expect(checkOut.status).toBe(200);

    const list = await request(app)
      .get(`/api/v1/hr/attendance/employee/${employeeId}`)
      .set('Authorization', auth());
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('payroll: generate → getByEmployee → pay → summary (employee ACTIVE)', async () => {
    const generate = await request(app)
      .post('/api/v1/hr/payroll/generate')
      .set('Authorization', auth())
      .send({ month: 1, year: 2026 });
    expect(generate.status).toBe(201);
    const payrolls = generate.body.data;
    expect(payrolls.length).toBeGreaterThanOrEqual(1);

    const byEmp = await request(app)
      .get(`/api/v1/hr/payroll/employee/${employeeId}`)
      .set('Authorization', auth());
    expect(byEmp.status).toBe(200);
    expect(byEmp.body.data.length).toBeGreaterThanOrEqual(1);

    const pay = await request(app)
      .post(`/api/v1/hr/payroll/${payrolls[0].id}/pay`)
      .set('Authorization', auth())
      .send({ paymentTransactionId: 'TXN-TEST-1' });
    expect(pay.status).toBe(200);

    const summary = await request(app)
      .get('/api/v1/hr/payroll/summary')
      .set('Authorization', auth())
      .query({ month: 1, year: 2026 });
    expect(summary.status).toBe(200);
  });

  it('leave: apply → balance → pending → approve', async () => {
    const lt = await prisma.leaveType.create({
      data: { tenantId: COMPANY_ID, code: 'ANNUAL-HR', name: 'Annual Leave', annualQuota: 20 },
    });

    const apply = await request(app)
      .post('/api/v1/hr/leaves')
      .set('Authorization', auth())
      .send({ employeeId, leaveTypeId: lt.id, reason: 'family', startDate: '2026-02-10', endDate: '2026-02-11' });
    expect(apply.status).toBe(201);
    const leaveId = apply.body.data.id;

    const balance = await request(app)
      .get(`/api/v1/hr/leaves/balance/${employeeId}`)
      .set('Authorization', auth());
    expect(balance.status).toBe(200);

    const pending = await request(app).get('/api/v1/hr/leaves/pending').set('Authorization', auth());
    expect(pending.status).toBe(200);
    expect(pending.body.data.some((l: { id: string }) => l.id === leaveId)).toBe(true);

    const approve = await request(app)
      .post(`/api/v1/hr/leaves/${leaveId}/approve`)
      .set('Authorization', auth())
      .send({ approvedById: TEST_USER_ID });
    expect(approve.status).toBe(200);
  });

  it('employee: terminate (remove) works', async () => {
    const del = await request(app).delete(`/api/v1/hr/employees/${employeeId}`).set('Authorization', auth());
    expect(del.status).toBe(200);
    const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId: COMPANY_ID } });
    expect(emp?.employmentStatus).toBe('TERMINATED');
  });
});
