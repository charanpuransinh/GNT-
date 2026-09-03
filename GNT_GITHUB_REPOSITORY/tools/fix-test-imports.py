#!/usr/bin/env python3
"""टास्क #024 F1 — test files की सफाई:
1. perl की गलती से डाला गया कचरा ('use strict; my ="..."; import') हटाओ
2. जहाँ describe/it/expect use होता है पर कोई runner import नहीं → vitest import जोड़ो (ऊपर)
3. jest. → vi. (vitest का alias)
"""
import re
import sys
from pathlib import Path

JUNK_RE = re.compile(r'use strict; my ="[^"]*"; import\s', re.S)
VITEST_IMPORT = "import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';\n"
USES_RUNNER = re.compile(r'\b(describe|it|test|expect|beforeAll|afterAll|beforeEach|afterEach)\s*\(')

root = Path('backend/src')
changed = []
for p in root.rglob('*.test.ts'):
    text = p.read_text()
    orig = text
    # 1) कचरा हटाओ
    text = JUNK_RE.sub('import ', text)
    # 2) runner import चाहिए?
    has_runner = "from 'vitest'" in text or "from 'node:test'" in text or 'from "vitest"' in text or 'from "node:test"' in text
    if USES_RUNNER.search(text) and not has_runner:
        # सबसे ऊपर (किसी भी टिप्पणी से पहले) import डालो
        text = VITEST_IMPORT + '\n' + text
    # 3) jest → vi
    text = text.replace('jest.', 'vi.')
    if text != orig:
        p.write_text(text)
        changed.append(str(p))

print(f'बदली गईं: {len(changed)}')
for c in changed:
    print(' -', c)
