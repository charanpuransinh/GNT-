// ============================================================================
// M05 — Party Service internals के unit tests (टास्क #024 — A3)
// बिना DB के चलते हैं: checkCreditLimitInternal / emptyAging pure हैं,
// Zod schemas भी pure हैं।
// ============================================================================

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  checkCreditLimitInternal,
  emptyAging,
} from '../../services/party.internal';
import {
  createPartySchema,
  updatePartySchema,
  partyQuerySchema,
} from '../../validators/party.schema';
import type { Party } from '../../types/party.types';

function makeParty(overrides: Partial<Party> = {}): Party {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    company_id: '550e8400-e29b-41d4-a716-446655440001',
    branch_id: null,
    party_type: 'customer',
    name: 'Test Party',
    display_name: null,
    gstin: null,
    pan: null,
    gst_type: null,
    contact_person: null,
    phone: null,
    alt_phone: null,
    email: null,
    billing_address: null,
    shipping_address: null,
    city: null,
    state_code: null,
    pincode: null,
    country: 'IN',
    credit_limit: 0,
    credit_days: 0,
    opening_balance: 0,
    opening_type: 'dr',
    notes: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
    ...overrides,
  };
}

describe('checkCreditLimitInternal', () => {
  it('limit 0 = कोई सीमा नहीं — हमेशा allowed', () => {
    const r = checkCreditLimitInternal(makeParty({ credit_limit: 0 }), 0, 999999);
    assert.equal(r.allowed, true);
    assert.equal(r.limit, 0);
  });

  it('सीमा के अंदर — allowed true, available सही', () => {
    const r = checkCreditLimitInternal(makeParty({ credit_limit: 10000 }), 0, 4000);
    assert.equal(r.allowed, true);
    assert.equal(r.used, 0);
    assert.equal(r.available, 10000);
  });

  it('सीमा के बाहर — allowed false + reason', () => {
    const r = checkCreditLimitInternal(makeParty({ credit_limit: 10000 }), 0, 12000);
    assert.equal(r.allowed, false);
    assert.ok(r.reason && r.reason.includes('Credit limit exceeded'));
  });

  it('opening dr बकाया जुड़ता है (used में)', () => {
    const r = checkCreditLimitInternal(
      makeParty({ credit_limit: 10000, opening_balance: 3000, opening_type: 'dr' }),
      0,
      8000,
    );
    // 3000 (opening) + 8000 (नया) = 11000 > 10000
    assert.equal(r.allowed, false);
    assert.equal(r.used, 3000);
  });

  it('opening cr घटता है (सप्लायर को दिया बकाया)', () => {
    const r = checkCreditLimitInternal(
      makeParty({ credit_limit: 10000, opening_balance: 5000, opening_type: 'cr' }),
      0,
      12000,
    );
    // used = -5000; -5000 + 12000 = 7000 <= 10000
    assert.equal(r.used, -5000);
    assert.equal(r.allowed, true);
  });

  it('ledger का outstanding भी used में गिना जाता है', () => {
    const r = checkCreditLimitInternal(makeParty({ credit_limit: 10000 }), 6000, 5000);
    assert.equal(r.used, 6000);
    assert.equal(r.allowed, false); // 6000 + 5000 > 10000
  });
});

describe('emptyAging', () => {
  it('सब बकेट शून्य, party_id सही (TODO #016 — M10 से आएगा)', () => {
    const a = emptyAging('party-123');
    assert.deepEqual(a, {
      party_id: 'party-123',
      not_due: 0,
      due_1_30: 0,
      due_31_60: 0,
      due_61_90: 0,
      due_over_90: 0,
      total: 0,
    });
  });
});

describe('createPartySchema (Zod)', () => {
  const base = { party_type: 'customer', name: 'राम ट्रेडर्स' };

  it('सही GSTIN मंज़ूर', () => {
    const r = createPartySchema.safeParse({ ...base, gstin: '27ABCDE1234F1Z5' });
    assert.equal(r.success, true);
  });

  it('गलत GSTIN रद्द', () => {
    const r = createPartySchema.safeParse({ ...base, gstin: '123' });
    assert.equal(r.success, false);
  });

  it('state_code सिर्फ़ 2 अंक', () => {
    assert.equal(createPartySchema.safeParse({ ...base, state_code: '27' }).success, true);
    assert.equal(createPartySchema.safeParse({ ...base, state_code: 'MH' }).success, false);
    assert.equal(createPartySchema.safeParse({ ...base, state_code: '270' }).success, false);
  });

  it('गलत phone रद्द', () => {
    assert.equal(createPartySchema.safeParse({ ...base, phone: 'abc' }).success, false);
    assert.equal(createPartySchema.safeParse({ ...base, phone: '9876543210' }).success, true);
  });

  it('name ज़रूरी है', () => {
    const r = createPartySchema.safeParse({ party_type: 'customer' });
    assert.equal(r.success, false);
  });

  it('party_type सिर्फ़ तीन मान', () => {
    assert.equal(createPartySchema.safeParse({ ...base, party_type: 'vendor' }).success, false);
    assert.equal(createPartySchema.safeParse({ ...base, party_type: 'both' }).success, true);
  });
});

describe('updatePartySchema (Zod)', () => {
  it('सब optional — सिर्फ़ is_active से भी चले', () => {
    const r = updatePartySchema.safeParse({ is_active: false });
    assert.equal(r.success, true);
  });

  it('खाली object मंज़ूर (कोई बदलाव नहीं)', () => {
    assert.equal(updatePartySchema.safeParse({}).success, true);
  });
});

describe('partyQuerySchema (Zod)', () => {
  it('default page=1 limit=20', () => {
    const r = partyQuerySchema.parse({});
    assert.equal(r.page, 1);
    assert.equal(r.limit, 20);
  });

  it('limit 100 से ज़्यादा रद्द', () => {
    assert.equal(partyQuerySchema.safeParse({ limit: 500 }).success, false);
  });
});
