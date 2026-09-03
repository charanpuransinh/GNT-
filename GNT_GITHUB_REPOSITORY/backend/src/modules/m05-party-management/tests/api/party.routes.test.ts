// ============================================================================
// M05 — Party routes का supertest (टास्क #024 — A3)
// auth + tenant की जाँच: बिना/गलत token पर हर रास्ता 401 देता है (टास्क #009
// के बाद का असली व्यवहार — x-company-id header अब मायने नहीं रखता)।
// असली token वाली राहों पर DB चाहिए — DB नहीं है, इसलिए वहाँ तक नहीं जाते
// (नक़ली success दिखाना मना)।
// ============================================================================

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../../../app';

describe('M05 /api/v1/parties — auth/tenant द्वार', () => {
  it('बिना token GET /parties → 401 (auth गेट)', async () => {
    const res = await request(app).get('/api/v1/parties');
    assert.equal(res.status, 401);
  });

  it('गलत token GET /parties → 401 (token की जाँच असली है)', async () => {
    const res = await request(app)
      .get('/api/v1/parties')
      .set('Authorization', 'Bearer nakli-token');
    assert.equal(res.status, 401);
  });

  it('बिना token POST /parties → 401 (बनाना भी बंद)', async () => {
    const res = await request(app).post('/api/v1/parties').send({ party_type: 'customer', name: 'X' });
    assert.equal(res.status, 401);
  });

  it('बिना token GET /parties/{id}/outstanding → 401', async () => {
    const res = await request(app).get('/api/v1/parties/550e8400-e29b-41d4-a716-446655440000/outstanding');
    assert.equal(res.status, 401);
  });

  it('x-company-id header अब पहचान नहीं दिलाता — फिर भी 401', async () => {
    const res = await request(app)
      .get('/api/v1/parties')
      .set('X-Company-Id', '550e8400-e29b-41d4-a716-446655440001');
    assert.equal(res.status, 401);
  });
});
