import { prisma } from '@/common/config/env-config';
// M03 — app releases are a REAL DB store now (no hardcoded LATEST_VERSIONS).
// Live-DB: publish a release, then update-check reads it back; no release => honest empty.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { deviceService } from '../services/device.service';

const PLATFORM = 'linux'; // isolated platform so other tests/data don't collide

async function wipe() {
  await prisma.app_release.deleteMany({ where: { platform: PLATFORM } });
}

describe.runIf(process.env.TEST_DB === '1')('M03 app releases — live DB', () => {
  beforeAll(wipe);
  afterAll(wipe);

  it('no published release => hasUpdate:false, latestVersion == current (no fake data)', async () => {
    const info = await deviceService.checkForUpdate(PLATFORM, '1.2.3');
    expect(info.hasUpdate).toBe(false);
    expect(info.latestVersion).toBe('1.2.3');
    expect(info.releaseNotes).toBeUndefined();
  });

  it('publishRelease writes a real row; update-check reads its version + notes', async () => {
    await deviceService.publishRelease({
      platform: PLATFORM,
      version: '4.5.0',
      releaseNotes: ['Real note A', 'Real note B'],
      minSupported: '4.0.0',
    });

    const row = await prisma.app_release.findFirst({
      where: { platform: PLATFORM, version: '4.5.0' },
    });
    expect(row).toBeTruthy();
    expect(row?.release_notes).toEqual(['Real note A', 'Real note B']);

    const info = await deviceService.checkForUpdate(PLATFORM, '4.2.0');
    expect(info.hasUpdate).toBe(true);
    expect(info.latestVersion).toBe('4.5.0');
    expect(info.releaseNotes).toEqual(['Real note A', 'Real note B']);

    // 3.9.0 is below min_supported 4.0.0 => forced
    const forced = await deviceService.checkForUpdate(PLATFORM, '3.9.0');
    expect(forced.forceUpdate).toBe(true);
  });

  it('publishRelease is idempotent per (platform, version) — upsert, not duplicate', async () => {
    await deviceService.publishRelease({
      platform: PLATFORM,
      version: '4.5.0',
      releaseNotes: ['updated'],
    });
    const rows = await prisma.app_release.findMany({
      where: { platform: PLATFORM, version: '4.5.0' },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].release_notes).toEqual(['updated']);
  });
});
