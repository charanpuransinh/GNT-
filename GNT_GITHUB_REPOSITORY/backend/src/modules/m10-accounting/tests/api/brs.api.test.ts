// ============================================================================
// M10 — BRS routes असल में mount हैं और company की सीमा पकड़ते हैं (TEST_DB=1)
//
// पहले दो अलग गड़बड़ियाँ थीं:
// 1. BRSController कहीं भी किसी route से जुड़ा ही नहीं था — पूरा feature
//    (create/list/match/status) हमेशा 404 देता।
// 2. createBRS का company_id सीधे req.body से आता था, और bank_account_id भी
//    बिना जाँचे किसी भी company के account से लिया जा सकता था — कोई भी company
//    दूसरी company के नाम पर, दूसरी company के bank account का हिसाब लगाकर,
//    reconciliation record बना सकती थी। matchItem/getStatus भी सिर्फ़ id पर
//    चलते थे, company की जाँच थी ही नहीं।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

const DUSRI_COMPANY_ID = '00000000-0000-4000-8000-0000000009bb';

describe.runIf(process.env.TEST_DB === '1')('M10 — BRS: mount + company की सीमा', () => {
  let dusriAccountId = '';
  let dusriBrsId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: DUSRI_COMPANY_ID },
      update: {},
      create: { id: DUSRI_COMPANY_ID, name: 'Dusri Company M10 BRS', code: 'M10BRS' },
    });

    const dusriAccount = await prisma.account_master.create({
      data: { company_id: DUSRI_COMPANY_ID, name: 'Dusri Bank', code: `DUSRI-BANK-${Date.now()}`, type: 'asset', is_bank_account: true },
    });
    dusriAccountId = dusriAccount.id;

    const dusriBrs = await prisma.bank_reconciliation.create({
      data: {
        company_id: DUSRI_COMPANY_ID,
        bank_account_id: dusriAccountId,
        statement_date: new Date(),
        statement_balance: 1000,
        ledger_balance: 1000,
        difference: 0,
        status: 'reconciled',
      },
    });
    dusriBrsId = dusriBrs.id;
  });

  afterAll(async () => {
    await prisma.bank_reconciliation_item.deleteMany({ where: { bank_reconciliation_id: dusriBrsId } });
    await prisma.bank_reconciliation.deleteMany({ where: { company_id: DUSRI_COMPANY_ID } });
    await prisma.account_master.deleteMany({ where: { company_id: DUSRI_COMPANY_ID } });
    await prisma.company_master.deleteMany({ where: { id: DUSRI_COMPANY_ID } });
  });

  it('route mount है — 404 नहीं देता', async () => {
    const res = await request(app).get(`/api/v1/accounting/brs/${randomUUID()}/status`);
    expect(res.status).not.toBe(404);
  });

  it('🔒 body में दूसरी company की id/account भेजने पर भी अपनी ही company में बनता है, या account न मिलने पर फटता है', async () => {
    const res = await request(app)
      .post('/api/v1/accounting/brs')
      .set('Authorization', mintBearer())
      .send({
        company_id: DUSRI_COMPANY_ID, // जान-बूझकर छेड़ने की कोशिश
        bank_account_id: dusriAccountId, // दूसरी company का असली account
        statement_date: new Date().toISOString(),
        statement_balance: 500,
        ledger_entries: [],
      });

    // dusriAccountId अपनी company (TEST_COMPANY_ID) का नहीं है — service इसे
    // "not found" कहकर रोकती है, चुपचाप दूसरी company का account इस्तेमाल नहीं करती
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('🔒 दूसरी company की BRS status नहीं पढ़ी जा सकती', async () => {
    const res = await request(app)
      .get(`/api/v1/accounting/brs/${dusriBrsId}/status`)
      .set('Authorization', mintBearer());

    expect(res.status).toBe(404);
  });

  it('🔒 दूसरी company की BRS का item match नहीं किया जा सकता', async () => {
    const res = await request(app)
      .post(`/api/v1/accounting/brs/${dusriBrsId}/match`)
      .set('Authorization', mintBearer())
      .send({ ledger_entry_id: randomUUID() });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/i);
  });
});
