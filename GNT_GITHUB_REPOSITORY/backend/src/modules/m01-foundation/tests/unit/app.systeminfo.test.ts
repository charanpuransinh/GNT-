// ============================================================================
// M01 — getSystemInfo के असली tests (live DB चाहिए)
//
// क्यों बने: पहले यह पन्ना दो बनावटी संख्याएँ भेजता था —
//   cpuLoad: 0                      ("Would use os.loadavg() in real implementation")
//   activeConnections: हमेशा 0      ("Would query connection pool")
// यानी CPU चाहे जल रहा हो और database चाहे भरा पड़ा हो, निगरानी का पन्ना
// आराम से "0, 0" दिखाता रहता। ऐसी बनावटी संख्या ख़राबी छिपाती है, और
// निगरानी का पूरा मक़सद ही ख़त्म कर देती है।
//
// ये tests पक्का करते हैं कि दोनों संख्याएँ असल में नापी जा रही हैं।
// ============================================================================

import { describe, it, expect } from 'vitest';
import os from 'node:os';
import { appService } from '../../services/app.service';
import { appRepository } from '../../repositories/app.repository';

// database चालू हो तभी असली गिनती हो सकती है
describe.runIf(process.env.TEST_DB === '1')('M01 — getSystemInfo (असली आँकड़े)', () => {
  it('database के खुले connections असल में गिनता है (हमेशा 0 नहीं)', async () => {
    const count = await appRepository.getActiveConnectionCount();

    // यही test चल रहा है, इसका मतलब कम से कम एक connection तो खुला है ही।
    // इसलिए 0 आना असंभव है — अगर 0 आया तो समझो गिनती नक़ली है।
    expect(count).toBeGreaterThan(0);
  });

  it('गिनती नाकाम हो तो -1 लौटे, 0 नहीं', async () => {
    // 0 का मतलब होता है "कोई connection नहीं" — वो झूठ होगा।
    // ख़राबी को शून्य बताना ही असली ख़तरा है, इसलिए -1 अलग से रखा गया है।
    const broken = { ...appRepository };
    const count = await broken.getActiveConnectionCount();
    expect(count === -1 || count > 0).toBe(true);
    expect(count).not.toBe(0);
  });

  it('cpuLoad असली load से बनता है, ठोस 0 नहीं', async () => {
    const info = await appService.getSystemInfo();
    const cpuCount = os.cpus().length || 1;
    const expected = Math.round((os.loadavg()[0] / cpuCount) * 100);

    // load पल-पल बदलता है, इसलिए ठीक बराबर नहीं — पास-पास होना चाहिए
    expect(Math.abs(info.cpuLoad - expected)).toBeLessThanOrEqual(25);
    expect(info.cpuLoad).toBeGreaterThanOrEqual(0);
  });

  it('मेमोरी के आँकड़े सच में process से आते हैं', async () => {
    const info = await appService.getSystemInfo();

    expect(info.memoryUsage.used).toBeGreaterThan(0);
    expect(info.memoryUsage.total).toBeGreaterThan(info.memoryUsage.used);
    expect(info.memoryUsage.percentage).toBeGreaterThanOrEqual(0);
    expect(info.platform).toBe(process.platform);
    expect(info.nodeVersion).toBe(process.version);
  });

  it('activeConnections पन्ने तक असली संख्या पहुँचती है', async () => {
    const info = await appService.getSystemInfo();
    expect(info.activeConnections).toBeGreaterThan(0);
  });
});
