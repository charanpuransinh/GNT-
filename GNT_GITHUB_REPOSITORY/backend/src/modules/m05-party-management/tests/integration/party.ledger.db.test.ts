// ============================================================================
// M05 — getOutstanding असली party_ledger_view पर (TEST_DB=1)
//
// पहले (TODO #016): party_ledger_view database में कभी बनी ही नहीं थी — migration
// फ़ाइल थी, लगी नहीं थी (database/migrations/010_M05_party_ledger_view.sql)।
// getOutstanding हमेशा 0 लौटाता था। अब view लगी है और service उसी से पढ़ती है —
// यहाँ असली ledger entries डालकर साबित करते हैं कि असली balance आता है, नक़ली नहीं।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M05 — party_ledger_view पर getOutstanding', () => {
  const accountId = randomUUID();
  let partyId: string;

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });

    const res = await request(app).post('/api/v1/parties').set('Authorization', mintBearer()).send({
      party_type: 'customer',
      name: 'Ledger Test Party',
      opening_balance: 1000,
      opening_type: 'dr',
    });
    partyId = res.body.data.id;

    // असली debit/credit entries — party ने 500 और लिया (debit), 200 चुकाया (credit)
    await prisma.ledger.createMany({
      data: [
        { company_id: TEST_COMPANY_ID, account_id: accountId, party_id: partyId, transaction_date: new Date(), debit_amount: 500, credit_amount: 0 },
        { company_id: TEST_COMPANY_ID, account_id: accountId, party_id: partyId, transaction_date: new Date(), debit_amount: 0, credit_amount: 200 },
      ],
    });
  });

  afterAll(async () => {
    await prisma.ledger.deleteMany({ where: { party_id: partyId } });
    await prisma.party_master.deleteMany({ where: { id: partyId } });
  });

  it('opening (dr 1000) + debit 500 - credit 200 = 1300', async () => {
    const res = await request(app).get(`/api/v1/parties/${partyId}/outstanding`).set('Authorization', mintBearer());
    expect(res.status).toBe(200);
    expect(res.body.data.outstanding).toBe(1300);
  });
});
