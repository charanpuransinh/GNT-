#!/usr/bin/env python3
"""टास्क #024 F1 — node:test वाली 4 files को मेरी scripts के गलत बदलाव से वापस लाओ:
Mocked<PrismaClient> → PrismaClient और vitest import हटाओ।"""
from pathlib import Path

files = [
    'backend/src/modules/m17-reporting/tests/unit/report.repository.test.ts',
    'backend/src/modules/m18-external-integration/tests/unit/integration.repository.test.ts',
    'backend/src/modules/m19-production-monitoring/tests/unit/audit.repository.test.ts',
    'backend/src/modules/m19-production-monitoring/tests/unit/security.repository.test.ts',
]
for f in files:
    p = Path(f)
    t = p.read_text()
    t = t.replace('as unknown as Mocked<PrismaClient>', 'as unknown as PrismaClient')
    lines = [l for l in t.splitlines() if "from 'vitest'" not in l]
    p.write_text('\n'.join(lines) + '\n')
    print('reverted:', f)
