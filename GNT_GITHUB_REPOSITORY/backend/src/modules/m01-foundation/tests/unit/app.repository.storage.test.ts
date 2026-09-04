// ============================================================================
// M01 — storage health check के असली tests
//
// क्यों बने: पहले `checkStorageConnection()` कुछ जाँचता ही नहीं था — हमेशा
// `true` लौटाता था ("Simplified for M01 — would check actual storage in
// production")। यानी storage पूरी तरह मरा हो तब भी health check "ठीक है"
// बताता। नक़ली जाँच असली ख़राबी से भी ज़्यादा ख़तरनाक है, क्योंकि उस पर भरोसा
// करके कोई देखने ही नहीं जाता।
//
// ये tests पक्का करते हैं कि जाँच सच में होती है — और नक़ली `true` दोबारा
// लौटाया गया तो ये फ़ेल हो जाएँगे।
// ============================================================================

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { appRepository } from '../../repositories/app.repository';

const ORIGINAL = process.env.STORAGE_PATH;
let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'm01-storage-'));
});

afterEach(async () => {
  if (ORIGINAL === undefined) delete process.env.STORAGE_PATH;
  else process.env.STORAGE_PATH = ORIGINAL;
  await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
});

describe('appRepository.checkStorageConnection', () => {
  it('storage में लिखा-पढ़ा जा सके तो true', async () => {
    process.env.STORAGE_PATH = path.join(tmpRoot, 'ok');
    await expect(appRepository.checkStorageConnection()).resolves.toBe(true);
  });

  it('फ़ोल्डर न हो तो ख़ुद बना ले और true', async () => {
    // तैनाती के वक़्त पहली बार चलने पर फ़ोल्डर मौजूद नहीं होता — यह हालत सामान्य है
    const dir = path.join(tmpRoot, 'nested', 'deep', 'storage');
    process.env.STORAGE_PATH = dir;

    await expect(appRepository.checkStorageConnection()).resolves.toBe(true);
    await expect(fs.stat(dir)).resolves.toBeDefined();
  });

  it('storage तक पहुँचा ही न जा सके तो false — यही असली जाँच है', async () => {
    // ख़राबी ऐसे बनाई है कि STORAGE_PATH के रास्ते में फ़ोल्डर की जगह एक फ़ाइल पड़ी है,
    // इसलिए न फ़ोल्डर बन सकता है न उसमें लिखा जा सकता है (ENOTDIR)।
    //
    // यहाँ chmod से "लिखने की अनुमति हटाना" जान-बूझकर नहीं चुना: ये tests root
    // के तौर पर चलते हैं, और root permission की रोक लाँघ जाता है — इसलिए वैसा
    // test इस माहौल में झूठा पास हो जाता (हमने चलाकर देखा, वो पास हो गया था)।
    const blocker = path.join(tmpRoot, 'यह-फ़ाइल-है-फ़ोल्डर-नहीं');
    await fs.writeFile(blocker, 'x');
    process.env.STORAGE_PATH = path.join(blocker, 'storage');

    await expect(appRepository.checkStorageConnection()).resolves.toBe(false);
  });

  it('जाँच अपनी probe फ़ाइल पीछे नहीं छोड़ती', async () => {
    const dir = path.join(tmpRoot, 'clean');
    process.env.STORAGE_PATH = dir;

    await appRepository.checkStorageConnection();
    await appRepository.checkStorageConnection();

    // सिर्फ़ फ़ोल्डर बचे, कोई .health-* कूड़ा नहीं
    await expect(fs.readdir(dir)).resolves.toEqual([]);
  });
});
