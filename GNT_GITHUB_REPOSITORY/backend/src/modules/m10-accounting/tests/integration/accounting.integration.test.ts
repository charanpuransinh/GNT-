// ============================================================================
// M10 Accounting — Voucher create → post → ledger entries → balance update
//
// पहले यह पूरी फ़ाइल 4 नक़ली टेस्ट थी (सिर्फ़ `expect(true).toBe(true)`, कुछ
// जाँचता ही नहीं था) — फिर भी "4 tests green" गिनती में दिखता रहा, हर full-suite
// रन में। असली जाँच अब यहाँ है। "Sales/Purchase invoice → auto ledger entry"
// वाले दावे M07 (purchase.return-ledger.db.test.ts) और M08
// (sales.return-ledger.db.test.ts) में असली live-DB tests से पहले ही जाँचे जा
// चुके हैं — यहाँ दोहराना नहीं, नक़ली रखना और भी ग़लत।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M10 Accounting — Voucher lifecycle (live DB)', () => {
  const stamp = Date.now();
  let cashAccountId = '';
  let expenseAccountId = '';
  let voucherId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    const cash = await prisma.account_master.create({
      data: { company_id: TEST_COMPANY_ID, name: `Cash VCH ${stamp}`, code: `CASH-${stamp}`, type: 'asset' },
    });
    const expense = await prisma.account_master.create({
      data: { company_id: TEST_COMPANY_ID, name: `Expense VCH ${stamp}`, code: `EXP-${stamp}`, type: 'expense' },
    });
    cashAccountId = cash.id;
    expenseAccountId = expense.id;
  });

  afterAll(async () => {
    await prisma.ledger.deleteMany({ where: { voucher_id: voucherId } }).catch(() => {});
    await prisma.voucher.deleteMany({ where: { id: voucherId } }).catch(() => {});
    await prisma.account_master.deleteMany({ where: { id: { in: [cashAccountId, expenseAccountId] } } });
  });

  it('create → post: असली ledger entries बनती हैं और account का current_balance बदलता है', async () => {
    const beforeCash = await prisma.account_master.findUnique({ where: { id: cashAccountId } });
    const beforeExpense = await prisma.account_master.findUnique({ where: { id: expenseAccountId } });

    const created = await request(app).post('/api/v1/accounting/vouchers').set('Authorization', mintBearer()).send({
      voucher_type: 'journal',
      voucher_number: `VCH-${stamp}`,
      voucher_date: '2024-04-10',
      narration: `VCH test ${stamp}`,
      items: [
        { account_id: expenseAccountId, debit_amount: 500, credit_amount: 0 },
        { account_id: cashAccountId, debit_amount: 0, credit_amount: 500 },
      ],
    });
    expect(created.status).toBe(201);
    voucherId = created.body.id;

    const posted = await request(app).post(`/api/v1/accounting/vouchers/${voucherId}/post`).set('Authorization', mintBearer());
    expect(posted.status).toBe(200);

    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId } });
    expect(voucher?.status).toBe('posted');

    const ledgerRows = await prisma.ledger.findMany({ where: { voucher_id: voucherId } });
    expect(ledgerRows.length).toBe(2);
    const totalDebit = ledgerRows.reduce((s, r) => s + Number(r.debit_amount), 0);
    const totalCredit = ledgerRows.reduce((s, r) => s + Number(r.credit_amount), 0);
    expect(totalDebit).toBe(500);
    expect(totalCredit).toBe(500);

    const afterCash = await prisma.account_master.findUnique({ where: { id: cashAccountId } });
    const afterExpense = await prisma.account_master.findUnique({ where: { id: expenseAccountId } });
    expect(Number(afterCash?.current_balance) - Number(beforeCash?.current_balance)).toBeCloseTo(-500, 2);
    expect(Number(afterExpense?.current_balance) - Number(beforeExpense?.current_balance)).toBeCloseTo(500, 2);
  });
});
