// ============================================================================
// M13 ↔ M06 — असली stock.low event से EVENT-trigger rule चलना (blueprint §7.13:
// M13 USES M06)
//
// पहले: M06 का stock.low event अपने ही private EventEmitter (`inventoryEvents`)
// पर जाता था — handler सिर्फ़ console.log करता था, कमेंट में लिखा था "यह production
// में message bus पर publish होगा" पर होता नहीं था। साझा event bus तक कभी
// पहुँचता ही नहीं था, इसलिए M13 का कोई EVENT rule कभी चल ही नहीं सकता था। साथ
// ही payload में company_id भी नहीं था — बिना उसके M13 सही tenant तय नहीं कर
// पाता, सारी companies के rules चल जाते।
//
// यहाँ असली M06 stock deduction चलाकर (raw publish नहीं) पूरी chain जाँचते हैं:
// deductStock → checkLowStock → inventoryEvents → साझा eventBus → M13 rule → log
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { StockService } from '@/modules/m06-inventory/services/stock.service';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-0000000013aa';

describe.runIf(process.env.TEST_DB === '1')('M13 ↔ M06 — असली stock.low event', () => {
  const stockService = new StockService();
  let productId = '';
  let ruleId = '';
  let otherCompanyRuleId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    await prisma.company_master.upsert({
      where: { id: OTHER_COMPANY_ID },
      update: {},
      create: { id: OTHER_COMPANY_ID, name: 'Other Company M13', code: 'M13OTHER' },
    });

    const product = await prisma.product_master.create({
      data: { company_id: TEST_COMPANY_ID, name: `M13-टेस्ट-प्रोडक्ट-${Date.now()}`, reorder_level: 5 },
    });
    productId = product.id;

    // अपनी company का rule
    const created = await request(app).post('/api/v1/automation/rules').set('Authorization', mintBearer()).send({
      name: 'Low stock alert',
      triggerType: 'EVENT',
      triggerEvent: 'stock.low',
      actions: [{ type: 'LOG', config: { message: 'कम स्टॉक: {{product_name}} बचा {{current_qty}}' } }],
    });
    ruleId = created.body.data.id;

    // दूसरी company का वही नाम वाला rule — यह नहीं चलना चाहिए
    const otherRule = await request(app).post('/api/v1/automation/rules').set('Authorization', mintBearer(OTHER_COMPANY_ID)).send({
      name: 'Low stock alert (other company)',
      triggerType: 'EVENT',
      triggerEvent: 'stock.low',
      actions: [{ type: 'LOG', config: { message: 'यह कभी नहीं चलना चाहिए' } }],
    });
    otherCompanyRuleId = otherRule.body.data.id;
  }, 60_000);

  afterAll(async () => {
    await prisma.jobExecutionLog.deleteMany({ where: { ruleId: { in: [ruleId, otherCompanyRuleId] } } });
    await prisma.automationRule.deleteMany({ where: { id: { in: [ruleId, otherCompanyRuleId] } } });
    await prisma.stock_movement.deleteMany({ where: { product_id: productId } });
    await prisma.stock_master.deleteMany({ where: { product_id: productId } });
    await prisma.product_master.deleteMany({ where: { id: productId } });
    await prisma.company_master.deleteMany({ where: { id: OTHER_COMPANY_ID } });
  });

  it('असली stock deduction से reorder level के नीचे जाने पर M13 का rule चलता है', async () => {
    await stockService.addStock(productId, 10, TEST_COMPANY_ID, null, null, 100, 'test', randomUUID());
    // 10 - 8 = 2, reorder_level 5 से कम — low stock होना चाहिए
    await stockService.deductStock(productId, 8, TEST_COMPANY_ID, null, null, 'test', randomUUID());

    // event async publish होता है — थोड़ा रुकना ज़रूरी
    await new Promise((r) => setTimeout(r, 300));

    const log = await prisma.jobExecutionLog.findFirst({ where: { ruleId }, orderBy: { startedAt: 'desc' } });
    expect(log).not.toBeNull();
    expect(log!.status).toBe('SUCCESS');
    expect(log!.message).toContain('कम स्टॉक');

    // दूसरी company का rule बिल्कुल नहीं चला — company_id सही से route हुआ
    const otherLog = await prisma.jobExecutionLog.findFirst({ where: { ruleId: otherCompanyRuleId } });
    expect(otherLog).toBeNull();
  });
});
