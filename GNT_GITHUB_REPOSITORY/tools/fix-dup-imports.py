#!/usr/bin/env python3
"""टास्क #024 F1 — vitest import में duplicate type Mocked/MockedClass हटाओ।"""
import re
from pathlib import Path

for p in Path('backend/src').rglob('*.test.ts'):
    t = p.read_text()
    if 'MockedClass' not in t and 'type Mocked' not in t:
        continue
    def dedupe(m: re.Match) -> str:
        items = [x.strip() for x in m.group(1).split(',') if x.strip()]
        seen = set()
        out = []
        for x in items:
            if x in seen:
                continue
            seen.add(x)
            out.append(x)
        return "import { " + ', '.join(out) + " } from 'vitest';"
    t2 = re.sub(r"import \{ ([^}]*)\} from 'vitest';", dedupe, t)
    if t2 != t:
        p.write_text(t2)
        print('dedup:', p)
