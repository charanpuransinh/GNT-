// ============================================================================
// M01 — mount का पता सही है या नहीं (असली app चलाकर)
//
// क्यों बना: 2026-09-04 को पकड़ा कि backend M01 को `/api/v1/app` पर चढ़ाता था,
// जबकि frontend `/api/v1/foundation` बुलाता है और contract भी वही कहता है।
// यानी M01 की हर frontend call 404 हो रही थी — और किसी को पता नहीं चला:
//   • tsc नहीं पकड़ता — दोनों बस strings हैं, कोई type नहीं जुड़ा
//   • backend के बाक़ी tests नहीं पकड़ते — वे router को सीधे बुलाते हैं,
//     mount के पते से होकर नहीं जाते
//   • frontend में कोई test था ही नहीं
//
// इसलिए यह test जान-बूझकर **पूरे app** पर चलता है, router पर नहीं — ताकि
// पता ग़लत हो तो यहीं फ़ेल हो जाए।
// ============================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../../app';

// contract यही कहता है: api-contracts/v1/M01-foundation.contract.yaml
// (servers: /api/v1 · paths: /foundation/config, /health, /system-info, /maintenance)
const BASE = '/api/v1/foundation';

beforeAll(async () => {
  await registerModules();
});

describe('M01 — mount का पता contract से मेल खाता है', () => {
  it(`${BASE}/health खुला है और जवाब देता है`, async () => {
    const res = await request(app).get(`${BASE}/health`);

    // 404 का मतलब होगा mount का पता ग़लत है — यही वो गड़बड़ी थी
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(200);
  });

  it(`${BASE}/maintenance खुला है (बिना login)`, async () => {
    const res = await request(app).get(`${BASE}/maintenance`);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(200);
  });

  it(`${BASE}/config मौजूद है, पर login माँगता है`, async () => {
    const res = await request(app).get(`${BASE}/config`);

    // 404 = पता ग़लत · 401 = पता सही, बस token नहीं दिया — यही चाहिए
    expect(res.status).not.toBe(404);
    expect([401, 403]).toContain(res.status);
  });

  it(`${BASE}/system-info मौजूद है, पर login माँगता है`, async () => {
    const res = await request(app).get(`${BASE}/system-info`);
    expect(res.status).not.toBe(404);
    expect([401, 403]).toContain(res.status);
  });

  it('पुराना ग़लत पता /api/v1/app अब M01 नहीं परोसता', async () => {
    // अगर कोई इसे वापस जोड़ दे तो दो पते चालू हो जाएँगे — वो भी ग़लत हालत है।
    //
    // यहाँ 404 की उम्मीद नहीं करते: global auth gate routing से पहले चलता है,
    // इसलिए बिना token अनजान पते पर 401 आता है — और यही सही है, वरना जवाब से
    // ही पता चल जाता कि कौन से पते मौजूद हैं और कौन से नहीं।
    // असली शर्त इतनी है कि यह पता M01 का जवाब न दे।
    const res = await request(app).get('/api/v1/app/health');
    expect(res.status).not.toBe(200);
  });

  it('health का जवाब वही आकार रखता है जो contract कहता है', async () => {
    const res = await request(app).get(`${BASE}/health`);
    const body = res.body?.data ?? res.body;

    expect(['healthy', 'degraded', 'down']).toContain(body.status);
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('cache');
    expect(body.checks).toHaveProperty('storage');
  });
});
