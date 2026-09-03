#!/usr/bin/env python3
"""टास्क #024 F1 — test files में `as unknown as XRepository/...Service` mock objects को
vitest 3 के `Mocked<T>` type पर लाओ (ताकि mockResolvedValue आदि typed चलें)।"""
import re
from pathlib import Path

PAT = re.compile(r'as unknown as (\w+);')

for p in Path('backend/src').rglob('*.test.ts'):
    t = p.read_text()
    if 'as unknown as ' not in t:
        continue
    hits = PAT.findall(t)
    if not hits:
        continue
    t2 = PAT.sub(r'as Mocked<\1>;', t)
    if "from 'vitest'" in t2:
        t2 = re.sub(
            r"import \{ ([^}]*)\} from 'vitest';",
            lambda m: "import { " + m.group(1) + ", type Mocked } from 'vitest';"
            if 'Mocked' not in m.group(1)
            else m.group(0),
            t2,
            count=1,
        )
    if t2 != t:
        p.write_text(t2)
        print('mocked:', p)
