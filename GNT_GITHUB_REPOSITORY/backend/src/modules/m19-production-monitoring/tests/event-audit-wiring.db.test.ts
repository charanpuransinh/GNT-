// ============================================================================
// M19 — business event → append-only audit_log wiring (असली bus, असली DB)
//
// पहले SecurityEventHandlers कभी bus से subscribe नहीं होता था — यानी
// payment/sales/payroll/import जैसे business events कभी audit trail में नहीं जाते
// थे (सिर्फ़ HTTP-route वाले actions)। अब registerSecurityEventHandlers() module
// mount पर canonical GNT_EVENTS.* सुनकर हर एक को audit_log में लिखता है।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { eventBus } from '@/common/events/event-bus';
import { GNT_EVENTS } from '@/common/events/event-catalog';

const CO = '00000000-0000-4000-8000-0000000000e1';

describe.runIf(process.env.TEST_DB === '1')('M19 — event → audit_log wiring', () => {
  beforeAll(async () => {
    await registerModules(); // registerSecurityEventHandlers() यहीं
    await prisma.auditLog.deleteMany({ where: { companyId: CO } });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { companyId: CO } });
  });

  it('payment.completed publish → audit_log में M11 row बनती है', async () => {
    const txnId = randomUUID();
    await eventBus.publish(GNT_EVENTS.PAYMENT_COMPLETED, { tenantId: CO, transactionId: txnId, amount: '2500' });

    let row: Awaited<ReturnType<typeof prisma.auditLog.findFirst>> = null;
    for (let i = 0; i < 25; i++) {
      row = await prisma.auditLog.findFirst({ where: { companyId: CO, action: GNT_EVENTS.PAYMENT_COMPLETED } });
      if (row) break;
      await new Promise((r) => setTimeout(r, 150));
    }
    expect(row).not.toBeNull();
    expect(row!.module).toBe('M11');
    expect(row!.resourceId).toBe(txnId);
  });

  it('import.completed publish → audit_log में M14 row', async () => {
    await eventBus.publish(GNT_EVENTS.IMPORT_COMPLETED, {
      tenantId: CO, jobId: 'job-audit-1', entityType: 'customer', status: 'COMPLETED', totalRows: 3, successRows: 3,
    });

    let row: Awaited<ReturnType<typeof prisma.auditLog.findFirst>> = null;
    for (let i = 0; i < 25; i++) {
      row = await prisma.auditLog.findFirst({ where: { companyId: CO, action: GNT_EVENTS.IMPORT_COMPLETED } });
      if (row) break;
      await new Promise((r) => setTimeout(r, 150));
    }
    expect(row).not.toBeNull();
    expect(row!.module).toBe('M14');
  });

  it('company id न हो तो audit row नहीं बनती (tenant-safe)', async () => {
    const before = await prisma.auditLog.count();
    await eventBus.publish(GNT_EVENTS.PAYMENT_COMPLETED, { transactionId: 'no-company', amount: '1' });
    await new Promise((r) => setTimeout(r, 400));
    const after = await prisma.auditLog.count();
    expect(after).toBe(before);
  });
});
