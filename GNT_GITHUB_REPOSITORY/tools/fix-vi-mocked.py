#!/usr/bin/env python3
"""टास्क #024 F1 — vitest 3.x में vi.Mocked/vi.MockedClass नहीं — named types से बदलो।"""
import re
from pathlib import Path

for p in Path('backend/src').rglob('*.test.ts'):
    t = p.read_text()
    orig = t
    needs_mocked = 'vi.Mocked<' in t
    needs_mocked_class = 'vi.MockedClass<' in t
    t = t.replace('vi.MockedClass<', 'MockedClass<')
    t = t.replace('vi.Mocked<', 'Mocked<')
    if t != orig and "from 'vitest'" in t:
        adds = []
        if needs_mocked:
            adds.append('type Mocked')
        if needs_mocked_class:
            adds.append('type MockedClass')
        if adds:
            t = re.sub(
                r"import \{ ([^}]*)\} from 'vitest';",
                lambda m: "import { " + m.group(1) + ', ' + ', '.join(adds) + " } from 'vitest';",
                t,
                count=1,
            )
    if t != orig:
        p.write_text(t)
        print('fixed:', p)
