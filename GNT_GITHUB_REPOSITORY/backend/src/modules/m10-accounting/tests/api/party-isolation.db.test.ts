// ============================================================================
// मालिक का हार्ड रूल — हर party का ledger पूरी तरह अलग (2026-09-05)
//
//   "हर party (customer/supplier) का ledger पूरी तरह isolated होना चाहिए — active हो
//    या inactive, किसी भी हालत में दो parties का डेटा एक-दूसरे को touch/reference
//    नहीं करेगा… हर party का ledger, बैलेंस, transaction history पूरी तरह अपने आप
//    में self-contained रहेगा।"
//
// ये tests असली database पर चलती हैं। जान-बूझकर दोनों parties को **एक ही खाते**
// (साझा account) पर रखा गया है — क्योंकि असली ख़तरा वहीं है: साझा खाते से पढ़ने पर
// पहले दोनों की पंक्तियाँ एक साथ लौट आती थीं।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { LedgerService } from '../../services/ledger.service';
import { LedgerRepository } from '../../repositories/ledger.repository';

const prisma = new PrismaClient();
const service = new LedgerService(new LedgerRepository(prisma), prisma);

const COMPANY_ID = '00000000-0000-4000-8000-00000000a101';
const DUSRI_COMPANY_ID = '00000000-0000-4000-8000-00000000a102';
const stamp = Date.now();

let sharedAccountId = '';
let dusriAccountId = '';
let partyA = '';   // ग्राहक — active
let partyB = '';   // ग्राहक — active
let partyC = '';   // सप्लायर — **inactive** (मालिक ने ख़ास कहा: active हो या inactive)
let dusriParty = '';

async function makeParty(companyId: string, name: string, type: string, active = true): Promise<string> {
  const p = await prisma.party_master.create({
    data: {
      company_id: companyId, party_type: type, name: `${name}-${stamp}`,
      is_active: active, opening_balance: 0, opening_type: 'dr',
    },
  });
  return p.id;
}

async function entry(companyId: string, accountId: string, partyId: string, debit: number, credit: number) {
  await prisma.ledger.create({
    data: {
      company_id: companyId, account_id: accountId, party_id: partyId,
      transaction_date: new Date('2026-01-15'), debit_amount: debit, credit_amount: credit,
    },
  });
}

describe.runIf(process.env.TEST_DB === '1')('🔒 हार्ड रूल — हर party का ledger अपने में बंद', () => {
  beforeAll(async () => {
    for (const [id, name, code] of [
      [COMPANY_ID, 'Party Isolation Co', `PICO${stamp}`],
      [DUSRI_COMPANY_ID, 'Dusri Co', `PIOTHER${stamp}`],
    ] as const) {
      await prisma.company_master.upsert({ where: { id }, update: {}, create: { id, name, code } });
    }

    const shared = await prisma.account_master.create({
      data: { company_id: COMPANY_ID, name: 'Sundry Debtors', code: `SD-${stamp}`, type: 'asset', opening_balance: 0 },
    });
    sharedAccountId = shared.id;

    const dusriAcc = await prisma.account_master.create({
      data: { company_id: DUSRI_COMPANY_ID, name: 'Dusri Debtors', code: `SD2-${stamp}`, type: 'asset', opening_balance: 0 },
    });
    dusriAccountId = dusriAcc.id;

    partyA = await makeParty(COMPANY_ID, 'ग्राहक-A', 'customer');
    partyB = await makeParty(COMPANY_ID, 'ग्राहक-B', 'customer');
    partyC = await makeParty(COMPANY_ID, 'सप्लायर-C', 'supplier', false);
    dusriParty = await makeParty(DUSRI_COMPANY_ID, 'दूसरी-कंपनी-की', 'customer');

    // तीनों parties एक ही साझा खाते पर — असली ख़तरे वाली हालत
    await entry(COMPANY_ID, sharedAccountId, partyA, 1000, 0);
    await entry(COMPANY_ID, sharedAccountId, partyA, 0, 400);
    await entry(COMPANY_ID, sharedAccountId, partyB, 7000, 0);
    await entry(COMPANY_ID, sharedAccountId, partyC, 250, 0);
    await entry(DUSRI_COMPANY_ID, dusriAccountId, dusriParty, 9999, 0);
  }, 60_000);

  afterAll(async () => {
    const companies = [COMPANY_ID, DUSRI_COMPANY_ID];
    await prisma.ledger.deleteMany({ where: { company_id: { in: companies } } });
    await prisma.party_master.deleteMany({ where: { company_id: { in: companies } } });
    await prisma.account_master.deleteMany({ where: { company_id: { in: companies } } });
    await prisma.company_master.deleteMany({ where: { id: { in: companies } } });
    await prisma.$disconnect();
  });

  it('नियम 1 — party A का ledger सिर्फ़ A का है, B की एक भी पंक्ति नहीं', async () => {
    const rows = await service.getPartyLedger(COMPANY_ID, partyA);
    expect(rows.length).toBe(2);
    expect(rows.every((r) => r.party_id === partyA)).toBe(true);
    expect(rows.some((r) => r.party_id === partyB)).toBe(false);
  });

  it('नियम 2 — दो sales parties आपस में कभी नहीं जुड़तीं (साझा खाते पर भी नहीं)', async () => {
    const a = await service.getPartyLedger(COMPANY_ID, partyA);
    const b = await service.getPartyLedger(COMPANY_ID, partyB);
    const aIds = new Set(a.map((r) => r.id));
    // एक भी पंक्ति दोनों में नहीं होनी चाहिए
    expect(b.some((r) => aIds.has(r.id))).toBe(false);
    expect(b.every((r) => r.party_id === partyB)).toBe(true);
  });

  it('नियम 3 — sales party और purchase party के ledger अलग-अलग हैं', async () => {
    const sales = await service.getPartyLedger(COMPANY_ID, partyA);
    const purchase = await service.getPartyLedger(COMPANY_ID, partyC);
    expect(sales.every((r) => r.party_id === partyA)).toBe(true);
    expect(purchase.every((r) => r.party_id === partyC)).toBe(true);
    expect(purchase.length).toBe(1);
  });

  it('inactive party पर भी वही नियम — मालिक ने ख़ास कहा था', async () => {
    const rows = await service.getPartyLedger(COMPANY_ID, partyC);
    expect(rows.every((r) => r.party_id === partyC)).toBe(true);
    const party = await prisma.party_master.findUnique({ where: { id: partyC } });
    expect(party?.is_active).toBe(false);   // सच में inactive है, फिर भी अलगाव कायम
  });

  it('नियम 5 — बैलेंस भी party का अपना (1000 − 400 = 600), साझा खाते का नहीं', async () => {
    const balanceA = await service.getPartyBalance(COMPANY_ID, partyA);
    expect(balanceA).toBe(600);

    const balanceB = await service.getPartyBalance(COMPANY_ID, partyB);
    expect(balanceB).toBe(7000);

    // साझा खाते का कुल = 1000 − 400 + 7000 + 250 = 7850 — यानी किसी party का
    // बैलेंस खाते के कुल से कभी नहीं लिया जा रहा
    const accountTotal = await service.getAccountBalance(COMPANY_ID, sharedAccountId);
    expect(accountTotal).toBe(7850);
    expect(balanceA).not.toBe(accountTotal);
  });

  it('एक party का बैलेंस बदलने से दूसरी का बैलेंस नहीं बदलता', async () => {
    const pehleB = await service.getPartyBalance(COMPANY_ID, partyB);
    await entry(COMPANY_ID, sharedAccountId, partyA, 5000, 0);
    const baadB = await service.getPartyBalance(COMPANY_ID, partyB);
    const baadA = await service.getPartyBalance(COMPANY_ID, partyA);
    expect(baadB).toBe(pehleB);      // B को छुआ तक नहीं गया
    expect(baadA).toBe(5600);        // A अपना हिसाब रखता है
  });

  it('🔒 दूसरी कंपनी की party का ledger कभी नहीं मिलेगा', async () => {
    const rows = await service.getPartyLedger(COMPANY_ID, dusriParty);
    expect(rows.length).toBe(0);
    const balance = await service.getPartyBalance(COMPANY_ID, dusriParty);
    expect(balance).toBe(0);
  });

  it('🔒 दूसरी कंपनी का खाता सिर्फ़ account_id जानकर नहीं पढ़ा जा सकता (यह छेद खुला था)', async () => {
    const rows = await service.getLedgerByAccount(COMPANY_ID, dusriAccountId);
    expect(rows.length).toBe(0);
    const balance = await service.getAccountBalance(COMPANY_ID, dusriAccountId);
    expect(balance).toBe(0);   // पहले यहाँ 9999 मिलता था
  });
});
