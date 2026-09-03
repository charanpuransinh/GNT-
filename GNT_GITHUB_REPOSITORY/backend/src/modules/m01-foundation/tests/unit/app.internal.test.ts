// ============================================================================
// M01 — Foundation: config enrichment + schemas के unit tests (टास्क #024 — D3)
// pure logic — DB/Redis नहीं चाहिए (app.internal.validateAndEnrichConfig सिर्फ़
// process.env पढ़ता है)।
// ============================================================================

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { appInternal } from '../../services/app.internal';
import {
  getConfigQuerySchema,
  healthCheckResponseSchema,
  systemInfoResponseSchema,
  maintenanceStatusSchema,
} from '../../validators/app.schema';

describe('appInternal.validateAndEnrichConfig', () => {
  it('खाली config पर defaults भरता है (GARUDA NEXTECH)', () => {
    const c = appInternal.validateAndEnrichConfig({});
    assert.equal(c.appName, 'GARUDA NEXTECH');
    assert.equal(c.version, '1.0.0');
    // environment env से आता है (vitest में NODE_ENV=test) — default सिर्फ़ तब 'development'
    assert.equal(c.environment, process.env.NODE_ENV || 'development');
    assert.equal(c.maintenanceMode, false);
  });

  it('दिए गए मान रहते हैं — override नहीं होते', () => {
    const c = appInternal.validateAndEnrichConfig({
      appName: 'मेरी दुकान',
      version: '2.0.0',
      environment: 'production',
      maintenanceMode: true,
    });
    assert.equal(c.appName, 'मेरी दुकान');
    assert.equal(c.version, '2.0.0');
    assert.equal(c.environment, 'production');
    assert.equal(c.maintenanceMode, true);
  });

  it('feature flags के defaults + दिए गए साथ-साथ', () => {
    const c = appInternal.validateAndEnrichConfig({ features: { ocrEnabled: true } });
    assert.equal(c.features.ocrEnabled, true); // दिया गया
    assert.equal(c.features.gstEnabled, true); // default
    assert.equal(c.features.internationalTrade, false); // default
    assert.equal(c.features.offlineMode, true); // default
  });

  it('sanitizeConfigForClient config लौटाता है', () => {
    const c = appInternal.validateAndEnrichConfig({});
    const out = appInternal.sanitizeConfigForClient(c);
    assert.equal(out.appName, c.appName);
    assert.equal(out.version, c.version);
  });
});

describe('M01 zod schemas', () => {
  it('getConfigQuerySchema — खाली और strict', () => {
    assert.equal(getConfigQuerySchema.safeParse({}).success, true);
    assert.equal(getConfigQuerySchema.safeParse({ extra: 1 }).success, false);
  });

  it('healthCheckResponseSchema — healthy + checks', () => {
    const r = healthCheckResponseSchema.safeParse({
      status: 'healthy',
      timestamp: '2026-09-03T19:00:00Z',
      uptime: 1234,
      version: '1.0.0',
      checks: { database: true, cache: true, storage: true },
    });
    assert.equal(r.success, true);
  });

  it('healthCheckResponseSchema — गलत status रद्द', () => {
    const r = healthCheckResponseSchema.safeParse({
      status: 'broken',
      timestamp: '2026-09-03T19:00:00Z',
      uptime: 1,
      version: '1.0.0',
      checks: { database: false, cache: false, storage: false },
    });
    assert.equal(r.success, false);
  });

  it('systemInfoResponseSchema — memory/cpu/connections', () => {
    const r = systemInfoResponseSchema.safeParse({
      platform: 'linux',
      nodeVersion: 'v20.20.2',
      memoryUsage: { used: 100, total: 8000, percentage: 1.25 },
      cpuLoad: 0.5,
      activeConnections: 0,
    });
    assert.equal(r.success, true);
  });

  it('maintenanceStatusSchema — message optional', () => {
    assert.equal(maintenanceStatusSchema.safeParse({ maintenanceMode: true }).success, true);
    assert.equal(
      maintenanceStatusSchema.safeParse({ maintenanceMode: true, message: 'रात 2 बजे रख-रखाव' }).success,
      true,
    );
  });
});
