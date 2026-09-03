// ============================================================================
// M11 — Payment API का auth-द्वार test (टास्क #024 — F1)
//
// पुराना test '../src/index' (अब नहीं है) और prisma.payment/prisma.invoice
// (पुराने model नाम — अब payment_transaction/ledger हैं, #008) पर टिका था।
// असली हालत से मिलाया: main app, /api/v1/payments, token-बिना 401 —
// असली payment flows DB चालू होने पर ही test होंगे (झूठे pass नहीं)।
// ============================================================================

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../app';

describe('M11 /api/v1/payments — auth द्वार', () => {
  it('बिना token GET /api/v1/payments → 401', async () => {
    const res = await request(app).get('/api/v1/payments');
    expect(res.status).toBe(401);
  });

  it('गलत token POST /api/v1/payments → 401', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', 'Bearer nakli-token')
      .send({});
    expect(res.status).toBe(401);
  });
});
