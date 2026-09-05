// M17 — HR adapter END-TO-END: असली payroll data report me aata hai
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { HRAdapter } from './hr.adapter';

const COMPANY_ID = '00000000-0000-4000-8000-000000000051';

async function cleanup() {
  await prisma.payroll.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.employee.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.designation.deleteMany({ where: { tenantId: COMPANY_ID } });
  await prisma.department.deleteMany({ where: { tenantId: COMPANY_ID } });
}

describe.runIf(process.env.TEST_DB === '1')('M17 HR adapter — live DB', () => {
  beforeAll(async () => {
    await cleanup();
    await prisma.company_master.upsert({ where: { id: COMPANY_ID }, update: { name: 'HR Rpt' }, create: { id: COMPANY_ID, name: 'HR Rpt', code: 'HRRPT' } });
    const dept = await prisma.department.create({ data: { tenantId: COMPANY_ID, code: 'D-RPT', name: 'Dept' } });
    const desig = await prisma.designation.create({ data: { tenantId: COMPANY_ID, code: 'DS-RPT', name: 'Desig' } });
    const emp = await prisma.employee.create({
      data: { tenantId: COMPANY_ID, firstName: 'Hr', lastName: 'Emp', email: 'hr@rpt.com', employeeCode: 'HR-RPT-1', departmentId: dept.id, designationId: desig.id, dateOfJoining: new Date('2026-01-01'), basicSalary: 40000 },
    });
    await prisma.payroll.create({
      data: { tenantId: COMPANY_ID, employeeId: emp.id, payrollNumber: 'PAY-RPT-1', month: 1, year: 2026, periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-01-31'), daysWorked: 25, daysLeave: 0, daysAbsent: 0, daysHoliday: 0, basicSalary: 40000, hra: 4000, totalEarnings: 44000, pfEmployee: 2000, tds: 0, totalDeductions: 2000, netPay: 42000 },
    });
  });
  afterAll(cleanup);

  it('salary register me असली payroll + employee naam aata hai', async () => {
    const adapter = new HRAdapter();
    const salary = await adapter.getSalaryRegister({ companyId: COMPANY_ID, month: '1', year: 2026 });

    expect(salary.length).toBe(1);
    expect(salary[0].employeeName).toBe('Hr Emp');
    expect(salary[0].basicSalary).toBe(40000);
    expect(salary[0].netSalary).toBe(42000);
  });
});
