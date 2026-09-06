// ============================================================================
// M17 — cross-module report-cache invalidation wiring (असली bus)
//
// report.routes.ts mount पर `new ReportEventHandlers(reportService).register()`
// करता है। यह file जाँचती है कि canonical event नाम (event-catalog / report.events
// अब aligned) पर सच में cache invalidate होता है — पहले `invoice.created` जैसे
// नाम सुनता था जो कोई publish नहीं करता।
// ============================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { registerModules } from '../../../app';
import { eventBus } from '@/common/events/event-bus';
import { GNT_EVENTS } from '@/common/events/event-catalog';
import { reportCache } from '../services/report.cache';

const CO = '00000000-0000-4000-8000-0000000000f1';

describe.runIf(process.env.TEST_DB === '1')('M17 — event-driven report cache invalidation', () => {
  beforeAll(async () => {
    await registerModules(); // report.routes.ts → ReportEventHandlers.register()
  });

  it('sales.invoice.created → sales cache हट जाता है', async () => {
    reportCache.set(CO, 'sales', { rows: [1, 2, 3] });
    expect(reportCache.get(CO, 'sales')).toBeDefined();
    await eventBus.publish(GNT_EVENTS.SALES_INVOICE_CREATED, { companyId: CO, invoiceId: 'inv-1' });
    expect(reportCache.get(CO, 'sales')).toBeUndefined();
  });

  it('payment.completed (tenantId payload) → accounting cache हट जाता है', async () => {
    reportCache.set(CO, 'accounting', { balance: 100 });
    expect(reportCache.get(CO, 'accounting')).toBeDefined();
    await eventBus.publish(GNT_EVENTS.PAYMENT_COMPLETED, { tenantId: CO, transactionId: 'txn-1', amount: '100' });
    expect(reportCache.get(CO, 'accounting')).toBeUndefined();
  });

  it('payroll.paid → hr cache हट जाता है', async () => {
    reportCache.set(CO, 'hr', { count: 5 });
    await eventBus.publish(GNT_EVENTS.PAYROLL_PAID, { tenantId: CO, payrollId: 'p1', employeeId: 'e1', amount: 100 });
    expect(reportCache.get(CO, 'hr')).toBeUndefined();
  });

  it('दूसरी company का cache नहीं छिड़ता (tenant-safe)', async () => {
    const OTHER = '00000000-0000-4000-8000-0000000000f2';
    reportCache.set(OTHER, 'sales', { rows: [9] });
    await eventBus.publish(GNT_EVENTS.SALES_INVOICE_CREATED, { companyId: CO, invoiceId: 'inv-2' });
    expect(reportCache.get(OTHER, 'sales')).toBeDefined();
    reportCache.invalidate(OTHER, 'sales');
  });
});
