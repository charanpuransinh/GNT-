// ============================================================================
// M02 — JWT की चाबियाँ सच में मौजूद हैं या नहीं
//
// 2026-09-05 को पकड़ा गया एक P0: `ACCESS_TOKEN_PRIVATE_KEY` वग़ैरह **कभी बनाई ही
// नहीं गई थीं**, इसलिए इस server पर **कोई भी login नहीं कर सकता था** — हर कोशिश
// 500 देती थी।
//
// यह गड़बड़ी tests से क्यों नहीं पकड़ी गई: `auth.internal.ts` में लिखा है कि
// `NODE_ENV=test` हो तो चाबी **अपने आप बना लो**। यानी tests अपनी चाबी ख़ुद बनाकर
// हरी होती रहीं, जबकि असली चलने पर वहाँ कुछ था ही नहीं।
//
// इसलिए यह test जान-बूझकर test वाली छूट के **बाहर** जाकर देखती है कि असली env में
// चारों चाबियाँ हैं या नहीं। यह वही अंतर पकड़ती है जो पहले किसी ने नहीं पकड़ा।
// ============================================================================

import { describe, it, expect } from 'vitest';
import { createPrivateKey, createPublicKey } from 'node:crypto';

const KEYS = [
  'ACCESS_TOKEN_PRIVATE_KEY',
  'ACCESS_TOKEN_PUBLIC_KEY',
  'REFRESH_TOKEN_PRIVATE_KEY',
  'REFRESH_TOKEN_PUBLIC_KEY',
] as const;

/** .env को tests अपने आप नहीं पढ़तीं — इसलिए यहीं पढ़ा जाता है */
function envFileKeys(): Set<string> {
  const found = new Set<string>();
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const envPath = path.resolve(process.cwd(), '../.env');
    const text = fs.readFileSync(envPath, 'utf8');
    for (const key of KEYS) {
      if (new RegExp(`^${key}\\s*=\\s*\\S`, 'm').test(text)) found.add(key);
    }
  } catch {
    // .env ही न मिले — नीचे test उसी को फ़ेल कर देगी
  }
  return found;
}

describe.runIf(process.env.TEST_DB === '1')('M02 — JWT की चाबियाँ (असली env में)', () => {
  const present = envFileKeys();

  for (const key of KEYS) {
    it(`${key} .env में मौजूद है`, () => {
      expect(
        present.has(key) || Boolean(process.env[key]),
        `${key} कहीं नहीं है — इसके बिना असली login 500 देगा (tests फिर भी हरी रहेंगी, क्योंकि वे अपनी चाबी ख़ुद बना लेती हैं)`,
      ).toBe(true);
    });
  }

  it('चाबियाँ सच में इस्तेमाल लायक़ हैं (सिर्फ़ मौजूद होना काफ़ी नहीं)', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    let text = '';
    try { text = fs.readFileSync(path.resolve(process.cwd(), '../.env'), 'utf8'); } catch { /* नीचे fail होगा */ }

    const read = (key: string): string => {
      const m = text.match(new RegExp(`^${key}\\s*=\\s*"([\\s\\S]*?)"\\s*$`, 'm'));
      const raw = m?.[1] ?? process.env[key] ?? '';
      return raw.replace(/\\n/g, '\n');
    };

    // ग़लत/अधूरी चाबी यहीं फट जाएगी — यही असली जाँच है
    expect(() => createPrivateKey(read('ACCESS_TOKEN_PRIVATE_KEY'))).not.toThrow();
    expect(() => createPublicKey(read('ACCESS_TOKEN_PUBLIC_KEY'))).not.toThrow();
    expect(() => createPrivateKey(read('REFRESH_TOKEN_PRIVATE_KEY'))).not.toThrow();
    expect(() => createPublicKey(read('REFRESH_TOKEN_PUBLIC_KEY'))).not.toThrow();
  });

  it('access और refresh की चाबियाँ अलग-अलग हों (एक ही हो तो token आपस में बदले जा सकते हैं)', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    let text = '';
    try { text = fs.readFileSync(path.resolve(process.cwd(), '../.env'), 'utf8'); } catch { /* ऊपर वाली test पकड़ेगी */ }
    const read = (key: string): string => text.match(new RegExp(`^${key}\\s*=\\s*"([\\s\\S]*?)"\\s*$`, 'm'))?.[1] ?? process.env[key] ?? '';

    const access = read('ACCESS_TOKEN_PRIVATE_KEY');
    const refresh = read('REFRESH_TOKEN_PRIVATE_KEY');
    expect(access.length).toBeGreaterThan(0);
    expect(access).not.toBe(refresh);
  });
});
