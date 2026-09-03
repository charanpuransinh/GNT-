// ============================================================================
// M15 — Sync API का auth-द्वार test (टास्क #024 — F1)
//
// पुराना test '../../src/index' (अब नहीं है) और x-tenant-id/x-user-id headers
// (टास्क #009 के बाद काम नहीं करते — पहचान सिर्फ़ token से) पर टिका था।
// असली हालत: main app, /api/v1/sync, बिना token 401।
// ============================================================================

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../app';

describe('M15 /api/v1/sync — auth द्वार', () => {
  it('बिना token GET /api/v1/sync/configs → 401', async () => {
    const res = await request(app).get('/api/v1/sync/configs');
    expect(res.status).toBe(401);
  });

  it('पुराने x-tenant-id headers अब पहचान नहीं दिलाते — फिर भी 401', async () => {
    const res = await request(app)
      .get('/api/v1/sync/configs')
      .set('x-tenant-id', 'tenant-integration')
      .set('x-user-id', 'user-test');
    expect(res.status).toBe(401);
  });
});
