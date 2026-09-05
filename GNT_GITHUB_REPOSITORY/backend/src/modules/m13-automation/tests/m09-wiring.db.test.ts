// ============================================================================
// M13 ↔ M09 (GST) — असली wiring (blueprint §7.13: M13 USES M09)
//
// पहले: gst.handlers.ts का emitEInvoiceGenerated सिर्फ़ अपनी ही private
// EventEmitter पर जाता था और खुद कहीं बुलाया ही नहीं जाता था (einvoice.service.ts
// e-invoice बनाकर कभी event emit नहीं करती थी)। अब generateIRN के बाद असली event
// जाता है, साझा bus पर, और M13 के compliance-alert rules इसे पकड़ सकते हैं।
//
// पूरा असली IRP flow (सरकारी portal) यहाँ नहीं चलाया जा सकता — उसके लिए असली
// GNT_IRP_BASE_URL/TOKEN चाहिए जो इस test environment में नहीं है (सही बात है,
// वरना कोई भी test असली सरकारी API को छू लेता)। इसलिए handler को सीधे बुलाकर
// सिर्फ़ वायरिंग जाँचते हैं — असली e-invoice generation flow M09 की अपनी tests
// में पहले से जाँचा हुआ है, वह नहीं बदला।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { GSTEventHandlers } from '@/modules/m09-gst/events/gst.handlers';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M13 ↔ M09 — असली wiring', () => {
  let ruleId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    const created = await request(app).post('/api/v1/automation/rules').set('Authorization', mintBearer()).send({
      name: 'E-Invoice generated alert',
      triggerType: 'EVENT',
      triggerEvent: 'gst.einvoice.generated',
      actions: [{ type: 'LOG', config: { message: 'IRN बना: {{irn}}' } }],
    });
    ruleId = created.body.data.id;
  });

  afterAll(async () => {
    await prisma.jobExecutionLog.deleteMany({ where: { ruleId } });
    await prisma.automationRule.deleteMany({ where: { id: ruleId } });
  });

  it('gst.einvoice.generated event पर M13 का rule चलता है', async () => {
    GSTEventHandlers.emitEInvoiceGenerated({
      company_id: TEST_COMPANY_ID,
      invoice_id: randomUUID(),
      irn: 'IRN-TEST-12345',
      ack_no: 'ACK-1',
      qr_code: 'QR',
    });

    await new Promise((r) => setTimeout(r, 300));

    const log = await prisma.jobExecutionLog.findFirst({ where: { ruleId }, orderBy: { startedAt: 'desc' } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('SUCCESS');
    expect(log!.message).toContain('IRN-TEST-12345');
  });
});
