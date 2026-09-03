// ============================================================================
// M03 — Device/Session/Platform के unit tests (टास्क #024 — E2)
// pure logic: expired-session filter + zod schemas (DB नहीं चाहिए)
// ============================================================================

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { buildExpiredSessionsFilter, SESSION_CLEANUP_INTERVAL_MS } from '../../services/session-cleanup';
import {
  registerDeviceSchema,
  updateDeviceSchema,
  deploymentSettingsSchema,
  checkUpdateQuerySchema,
} from '../../validators/device.schema';

describe('buildExpiredSessionsFilter (E1 job का दिल)', () => {
  it('सिर्फ active/idle + समय-सीमा पार sessions छूता है', () => {
    const now = new Date('2026-09-03T20:00:00Z');
    const filter = buildExpiredSessionsFilter(now);
    assert.deepEqual(filter.status.in, ['active', 'idle']);
    assert.deepEqual(filter.expires_at, { lt: now });
  });

  it('cleanup हर 15 मिनट पर (interval की तय सीमा)', () => {
    assert.equal(SESSION_CLEANUP_INTERVAL_MS, 15 * 60 * 1000);
  });
});

describe('registerDeviceSchema', () => {
  const base = {
    deviceName: 'दुकान का टैब',
    model: 'Tab S9',
    platform: 'android',
    osVersion: '14',
    appVersion: '1.2.3',
  };

  it('सही device मंज़ूर', () => {
    assert.equal(registerDeviceSchema.safeParse(base).success, true);
  });

  it('platform सिर्फ 6 जाने-पहचाने मान', () => {
    assert.equal(registerDeviceSchema.safeParse({ ...base, platform: 'windows' }).success, true);
    assert.equal(registerDeviceSchema.safeParse({ ...base, platform: 'kaios' }).success, false);
  });

  it('appVersion का format x.y.z ज़रूरी', () => {
    assert.equal(registerDeviceSchema.safeParse({ ...base, appVersion: '1.2' }).success, false);
    assert.equal(registerDeviceSchema.safeParse({ ...base, appVersion: '1.2.3' }).success, true);
  });
});

describe('updateDeviceSchema', () => {
  it('सब optional', () => {
    assert.equal(updateDeviceSchema.safeParse({}).success, true);
    assert.equal(updateDeviceSchema.safeParse({ isTrusted: true }).success, true);
  });
});

describe('deploymentSettingsSchema', () => {
  const base = {
    autoUpdate: false,
    updateNotifications: true,
    sessionTimeout: 30,
    forceSingleSession: false,
    offlineSync: true,
    syncInterval: 15,
  };

  it('सही settings मंज़ूर', () => {
    assert.equal(deploymentSettingsSchema.safeParse(base).success, true);
  });

  it('sessionTimeout 5..120 के बाहर रद्द', () => {
    assert.equal(deploymentSettingsSchema.safeParse({ ...base, sessionTimeout: 4 }).success, false);
    assert.equal(deploymentSettingsSchema.safeParse({ ...base, sessionTimeout: 121 }).success, false);
    assert.equal(deploymentSettingsSchema.safeParse({ ...base, sessionTimeout: 120 }).success, true);
  });

  it('syncInterval 1..60 के बाहर रद्द', () => {
    assert.equal(deploymentSettingsSchema.safeParse({ ...base, syncInterval: 0 }).success, false);
    assert.equal(deploymentSettingsSchema.safeParse({ ...base, syncInterval: 61 }).success, false);
  });
});

describe('checkUpdateQuerySchema', () => {
  it('platform + version x.y.z', () => {
    assert.equal(checkUpdateQuerySchema.safeParse({ platform: 'android', version: '1.2.3' }).success, true);
    assert.equal(checkUpdateQuerySchema.safeParse({ platform: 'android', version: 'abc' }).success, false);
  });
});
