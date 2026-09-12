// ============================================================================
// M21 — Data Sense TRANSFER, 'm10-accounting' adapter (DB-gated)
//
// owner फ़ैसला (2026-09-12): कोई भी अकेली, voucher-रहित ledger पंक्ति नहीं — हर
// import row को असली M10 double-entry voucher (2 balanced lines) बनना है, और
// against-खाता ज़रूर Bank/Cash/Control Ledger में से एक होना चाहिए।
// ============================================================================

import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { dataSenseService } from '../../services/dataSense.service';
import { executeTransfer } from '../../services/transfer.executor';

const RENT_CODE = 'TEST-M21-RENT';
const INCOME_CODE = 'TEST-M21-INCOME';
const OFFICE_EXP_CODE = 'TEST-M21-OFFICEEXP';
const BANK_CODE = 'TEST-M21-BANK';
const CASH_CODE = 'TEST-M21-CASH';

async function cleanup() {
  const accounts = await prisma.account_master.findMany({
    where: { code: { in: [RENT_CODE, INCOME_CODE, OFFICE_EXP_CODE, BANK_CODE, CASH_CODE] } },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);
  if (accountIds.length) {
    await prisma.ledger.deleteMany({ where: { account_id: { in: accountIds } } });
    await prisma.voucher_item.deleteMany({ where: { account_id: { in: accountIds } } });
  }
  await prisma.voucher.deleteMany({
    where: { company_id: TEST_COMPANY_ID, voucher_type: 'journal', voucher_number: { startsWith: 'JV-' } },
  });
  await prisma.account_master.deleteMany({
    where: { code: { in: [RENT_CODE, INCOME_CODE, OFFICE_EXP_CODE, BANK_CODE, CASH_CODE] } },
  });
}

describe.runIf(process.env.TEST_DB === '1')('M21 Data Sense TRANSFER — m10-accounting adapter, live DB', () => {
  let rentAccountId: string;
  let incomeAccountId: string;
  let officeExpAccountId: string;
  let bankAccountId: string;
  let cashAccountId: string;

  beforeAll(async () => {
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: { name: 'Test Company' },
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    await cleanup();

    const [rent, income, officeExp, bank, cash] = await Promise.all([
      prisma.account_master.create({
        data: { company_id: TEST_COMPANY_ID, name: 'Rent Expense', code: RENT_CODE, type: 'expense' },
      }),
      prisma.account_master.create({
        data: { company_id: TEST_COMPANY_ID, name: 'Consulting Income', code: INCOME_CODE, type: 'income' },
      }),
      prisma.account_master.create({
        data: { company_id: TEST_COMPANY_ID, name: 'Office Expense', code: OFFICE_EXP_CODE, type: 'expense' },
      }),
      prisma.account_master.create({
        data: {
          company_id: TEST_COMPANY_ID, name: 'HDFC Bank', code: BANK_CODE, type: 'asset',
          is_bank_account: true, bank_name: 'HDFC',
        },
      }),
      prisma.account_master.create({
        data: { company_id: TEST_COMPANY_ID, name: 'Cash', code: CASH_CODE, type: 'asset' },
      }),
    ]);
    rentAccountId = rent.id;
    incomeAccountId = income.id;
    officeExpAccountId = officeExp.id;
    bankAccountId = bank.id;
    cashAccountId = cash.id;
  });

  afterAll(async () => {
    await cleanup();
  });

  it('Bank offset — असली balanced voucher बनता है (Dr Rent Expense / Cr Bank)', async () => {
    const result = await dataSenseService.transfer(TEST_COMPANY_ID, {
      sheetName: 'journal-bank.csv',
      headers: ['Ledger', 'Offset Account', 'Debit', 'Credit', 'Date', 'Narration'],
      rows: [
        { Ledger: 'Rent Expense', 'Offset Account': 'HDFC Bank', Debit: 1500, Credit: '', Date: '01/09/2026', Narration: 'Sept rent' },
      ],
    });

    expect(result.sense.group).toBe('accounting');
    expect(result.importable).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.transferred!.summary.created).toBe(1);
    expect(result.transferred!.summary.failed).toBe(0);

    const voucherId = result.transferred!.rows[0].id as string;
    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId }, include: { items: true } });
    expect(voucher).not.toBeNull();
    expect(voucher!.voucher_type).toBe('journal');
    expect(Number(voucher!.total_debit)).toBe(1500);
    expect(Number(voucher!.total_credit)).toBe(1500);
    expect(voucher!.items.length).toBe(2);

    const rentItem = voucher!.items.find((i) => i.account_id === rentAccountId)!;
    const bankItem = voucher!.items.find((i) => i.account_id === bankAccountId)!;
    expect(Number(rentItem.debit_amount)).toBe(1500);
    expect(Number(rentItem.credit_amount)).toBe(0);
    expect(Number(bankItem.debit_amount)).toBe(0);
    expect(Number(bankItem.credit_amount)).toBe(1500);

    const ledgerRows = await prisma.ledger.findMany({ where: { voucher_id: voucherId } });
    expect(ledgerRows.length).toBe(2);
    expect(ledgerRows.every((l) => l.voucher_id === voucherId)).toBe(true);
  });

  // नोट: planner (transfer.planner.ts) किसी भी accounting पंक्ति में credit>0 को
  // "बैंक receipt" मान लेता है (फ़ैसला 3 — पहले से pending-adapter, owner के bank/
  // receivable mapping का इंतज़ार, इस बदलाव के दायरे से बाहर) — इसलिए वह UI पाइपलाइन
  // (dataSenseService.transfer) से इस adapter तक कभी credit-primary रूप में नहीं
  // पहुँचती। यहाँ सीधे executeTransfer बुलाकर adapter के mirror-logic (credit-side
  // primary → offset पर debit) की जाँच है, ताकि दोनों दिशाएँ सही रहें।
  it('Cash offset, credit-side primary (सीधे executor) — Dr Cash / Cr Consulting Income', async () => {
    const result = await executeTransfer(TEST_COMPANY_ID, [
      {
        rowNumber: 1,
        targetModule: 'm10-accounting',
        operation: 'create',
        payload: { ledgerName: 'Consulting Income', offsetLedgerName: 'Cash', credit: 2000 },
      },
    ]);

    expect(result.summary.created).toBe(1);
    expect(result.summary.failed).toBe(0);
    const voucherId = result.rows[0].id as string;
    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId }, include: { items: true } });
    const incomeItem = voucher!.items.find((i) => i.account_id === incomeAccountId)!;
    const cashItem = voucher!.items.find((i) => i.account_id === cashAccountId)!;
    expect(Number(incomeItem.credit_amount)).toBe(2000);
    expect(Number(cashItem.debit_amount)).toBe(2000);
  });

  it('अमान्य against-खाता (न Bank, न Cash, न Control Ledger) — पंक्ति failed, कोई voucher नहीं बनता', async () => {
    const before = await prisma.voucher.count({ where: { company_id: TEST_COMPANY_ID, voucher_type: 'journal' } });

    const result = await dataSenseService.transfer(TEST_COMPANY_ID, {
      sheetName: 'journal-bad-offset.csv',
      headers: ['Ledger', 'Offset Account', 'Debit'],
      rows: [{ Ledger: 'Rent Expense', 'Offset Account': 'Office Expense', Debit: 500 }],
    });

    expect(result.transferred!.summary.failed).toBe(1);
    expect(result.transferred!.summary.created).toBe(0);
    expect(result.transferred!.rows[0].status).toBe('failed');
    expect(result.transferred!.rows[0].note).toContain('Bank, Cash, या Control Ledger');

    const after = await prisma.voucher.count({ where: { company_id: TEST_COMPANY_ID, voucher_type: 'journal' } });
    expect(after).toBe(before);
  });

  it('offsetLedgerName column ही ग़ायब — पूरी sheet blocked, कुछ नहीं चढ़ता', async () => {
    const before = await prisma.voucher.count({ where: { company_id: TEST_COMPANY_ID, voucher_type: 'journal' } });

    const result = await dataSenseService.transfer(TEST_COMPANY_ID, {
      sheetName: 'journal-no-offset-col.csv',
      headers: ['Ledger', 'Debit', 'Credit'],
      rows: [{ Ledger: 'Rent Expense', Debit: 100, Credit: '' }],
    });

    expect(result.sense.group).toBe('accounting');
    expect(result.importable).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.transferred).toBeNull();
    expect(result.totals.red).toBe(1);
    expect(result.verdicts[0].reasons.join(' ')).toContain('offsetLedgerName');

    const after = await prisma.voucher.count({ where: { company_id: TEST_COMPANY_ID, voucher_type: 'journal' } });
    expect(after).toBe(before);
  });

  it('ledgerName === offsetLedgerName (ख़ुद से ख़ुद) — RED, पूरी sheet blocked', async () => {
    const result = await dataSenseService.transfer(TEST_COMPANY_ID, {
      sheetName: 'journal-self-offset.csv',
      headers: ['Ledger', 'Offset Account', 'Debit'],
      rows: [{ Ledger: 'Rent Expense', 'Offset Account': 'Rent Expense', Debit: 100 }],
    });

    expect(result.importable).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.transferred).toBeNull();
    expect(result.totals.red).toBe(1);
  });
});
