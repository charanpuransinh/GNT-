#!/usr/bin/env python3
"""टास्क #024 F2 — node:test से लिखे मेरे tests को vitest runner पर लाओ:
import { describe, it } from 'node:test' → from 'vitest' (assert node का vitest में भी चलता है)।"""
import re
from pathlib import Path

for p in Path('backend/src').rglob('*.test.ts'):
    t = p.read_text()
    t2 = t.replace("from 'node:test'", "from 'vitest'")
    if t2 != t:
        p.write_text(t2)
        print('vitest:', p)
