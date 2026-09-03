#!/usr/bin/env python3
"""टास्क #024 F1 — (1) `as Mocked<X>;` → `as unknown as Mocked<X>;`
(2) जिन files में Mocked/MockedClass use होता है पर import में नहीं → vitest import में जोड़ो।"""
import re
from pathlib import Path

for p in Path('backend/src').rglob('*.test.ts'):
    t = p.read_text()
    orig = t
    t = t.replace('as Mocked<', 'as unknown as Mocked<')
    if re.search(r'\bMocked(Class)?\b', t) and "from 'vitest'" in t:
        if not re.search(r'\btype Mocked\b', t):
            # किसी भी vitest import line में जोड़ो (single-line import मानकर)
            t = re.sub(
                r"import \{ ([^}]*)\} from 'vitest';",
                lambda m: "import { " + m.group(1) + ", type Mocked, type MockedClass } from 'vitest';",
                t,
                count=1,
            )
    if t != orig:
        p.write_text(t)
        print('fixed:', p)
