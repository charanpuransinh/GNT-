#!/usr/bin/env python3
"""टास्क #024 F1 — vitest import में vi जोड़ो जहाँ vi.* use होता है पर import में vi नहीं।"""
import re
from pathlib import Path

for p in Path('backend/src').rglob('*.test.ts'):
    t = p.read_text()
    if "from 'vitest'" not in t:
        continue
    if not re.search(r'\bvi\.', t):
        continue
    t2 = re.sub(
        r"import \{ ([^}]*)\} from 'vitest';",
        lambda m: m.group(0) if re.search(r'\bvi\b', m.group(1)) else "import { vi, " + m.group(1) + " } from 'vitest';",
        t,
    )
    if t2 != t:
        p.write_text(t2)
        print('vi add:', p)
