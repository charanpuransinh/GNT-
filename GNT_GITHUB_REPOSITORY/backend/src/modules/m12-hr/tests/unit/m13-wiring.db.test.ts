// ============================================================================
// M12 (HR) → M13 (Automation) — असली wiring, असली DB पर
//
// पहले: HrEventPublisher सिर्फ़ m12_hr_event_log में row लिखता था और उस row को
// कोई नहीं पढ़ता था (getUnprocessedEvents/markProcessed सिर्फ़ tests में) — यानी
// PAYROLL_GENERATED / PAYROLL_PAID / LEAVE_APPLIED जैसा हर M12 event एक dead
// table में गिरता था, M13 के automation rules तक कभी नहीं पहुँचता था।
//
// अब publish() उसी event को साझा in-process eventBus पर भी भेजता है (dot-case नाम:
// payroll.generated), वही fire-and-forget pattern जो M11 payment.service उपयोग
// करता है। यह file साबित करती है:
//   1. HR event publish करने पर M13 का EVENT-trigger rule सच में चलता है
//      (job_execution_log में SUCCESS row)
//   2. audit row m12_hr_event_log में बनती है, processed:true, payload में tenantId
//   3. tenant-safety: दूसरी company का same-event rule नहीं चलता
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { HrEventPublisher } from '../../events/hr.events';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

const OTHER_TENANT = '00000000-0000-4000-8000-0000000009c2';

describe.runIf(process.env.TEST_DB === '1')('M12 → M13 — असली wiring (HR event → automation rule)', () => {
  let ruleId = '';
  let otherRuleId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });

    const created = await request(app)
      .post('/api/v1/automation/rules')
      .set('Authorization', mintBearer())
      .send({
        name: 'Payroll generated → log',
        triggerType: 'EVENT',
        triggerEvent: 'payroll.generated',
        actions: [{ type: 'LOG', config: { message: 'payroll {{payrollId}} for {{employeeId}}' } }],
      });
    expect(created.status).toBe(201);
    ruleId = created.body.data.id;

    // दूसरी company का rule — सीधे DB में (उस tenant में यह test-user owner नहीं है)
    const other = await prisma.automationRule.create({
      data: {
        tenantId: OTHER_TENANT,
        name: 'Other tenant payroll rule',
        triggerType: 'EVENT',
        triggerEvent: 'payroll.generated',
        actions: [{ type: 'LOG', config: { message: 'should not run' } }],
        isActive: true,
        createdBy: 'test',
        updatedBy: 'test',
      },
    });
    otherRuleId = other.id;
  });

  afterAll(async () => {
    await prisma.jobExecutionLog.deleteMany({ where: { ruleId: { in: [ruleId, otherRuleId] } } });
    await prisma.automationRule.deleteMany({ where: { id: { in: [ruleId, otherRuleId] } } });
    await prisma.hrEventLog.deleteMany({ where: { eventType: 'PAYROLL_GENERATED', payload: { path: ['tenantId'], equals: TEST_COMPANY_ID } } });
  });

  it('PAYROLL_GENERATED publish करने पर M13 का rule चलता है + audit row बनती है', async () => {
    const payrollId = randomUUID();
    const employeeId = randomUUID();

    const row = await new HrEventPublisher().publish(TEST_COMPANY_ID, 'PAYROLL_GENERATED', {
      payrollId,
      employeeId,
      amount: 50000,
      month: 9,
      year: 2026,
    });

    // 1. audit row — processed:true, payload में tenantId
    expect(row.processed).toBe(true);
    const persisted = await prisma.hrEventLog.findUnique({ where: { id: row.id } });
    expect((persisted?.payload as Record<string, unknown>)?.tenantId).toBe(TEST_COMPANY_ID);

    // 2. M13 rule चला — job_execution_log में SUCCESS
    let log: Awaited<ReturnType<typeof prisma.jobExecutionLog.findFirst>> = null;
    for (let i = 0; i < 25; i++) {
      log = await prisma.jobExecutionLog.findFirst({ where: { ruleId }, orderBy: { startedAt: 'desc' } });
      if (log && log.status !== 'RUNNING') break;
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(log).not.toBeNull();
    expect(log!.status).toBe('SUCCESS');
    expect(log!.tenantId).toBe(TEST_COMPANY_ID);
  });

  it('दूसरी company का same-event rule नहीं चला (tenant-safe)', async () => {
    const otherLog = await prisma.jobExecutionLog.findFirst({ where: { ruleId: otherRuleId } });
    expect(otherLog).toBeNull();
  });
});
