#!/usr/bin/env python3
"""टास्क #025 B3 — m15 के backup/conflict/integration routes में static controller methods को
arrow-handler में लपेटो (express 5 का this-binding/type issue)।"""
import re
from pathlib import Path

files = [
    'backend/src/modules/m15-sync/routes/backup.routes.ts',
    'backend/src/modules/m15-sync/routes/conflict.routes.ts',
    'backend/src/modules/m15-sync/routes/integration.routes.ts',
]

PAT = re.compile(r"router\.(\w+)\('([^']*)',\s*(\w+)\.(\w+)\)")

for f in files:
    p = Path(f)
    t = p.read_text()
    orig = t
    t = PAT.sub(lambda m: f"router.{m.group(1)}('{m.group(2)}', (req: Request, res: Response) => {m.group(3)}.{m.group(4)}(req, res))", t)
    if t != orig:
        # Request/Response import जोड़ो (अगर नहीं)
        if "from 'express'" not in t:
            t = "import { Router, Request, Response } from 'express';\n" + t
        elif "Request" not in t.split("from 'express'")[0]:
            t = t.replace("from 'express';", "from 'express';\n", 1)
            # सरल: Router import line बदलो
            t = re.sub(r"import \{ Router \} from 'express';", "import { Router, Request, Response } from 'express';", t, count=1)
        p.write_text(t)
        print('wrapped:', f)
