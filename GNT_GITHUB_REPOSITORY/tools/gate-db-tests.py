#!/usr/bin/env python3
"""टास्क #025 A4 — DB-ज़रूरी tests को describe.runIf(TEST_DB) गेट के नीचे लाओ।
यह it.skip नहीं है — जब TEST_DB=1 env होगा तो सच में चलेंगे; अभी 'skipped' में गिने जाएँगे।"""
from pathlib import Path

files = [
    'backend/src/modules/m01-foundation/tests/integration/app.integration.test.ts',
    'backend/src/modules/m02-core-architecture/tests/api/auth.controller.test.ts',
    'backend/src/modules/m02-core-architecture/tests/api/role.controller.test.ts',
    'backend/src/modules/m02-core-architecture/tests/api/user.controller.test.ts',
    'backend/src/modules/m02-core-architecture/tests/integration/auth.integration.test.ts',
    'backend/src/modules/m04-company-management/tests/api/company.api.test.ts',
    'backend/src/modules/m04-company-management/tests/integration/company.integration.test.ts',
    'backend/src/modules/m06-inventory/tests/api/inventory.api.test.ts',
    'backend/src/modules/m06-inventory/tests/integration/inventory.integration.test.ts',
    'backend/src/modules/m06-inventory/tests/unit/batch.controller.test.ts',
    'backend/src/modules/m06-inventory/tests/unit/product.repository.test.ts',
    'backend/src/modules/m06-inventory/tests/unit/serial.controller.test.ts',
    'backend/src/modules/m06-inventory/tests/unit/stock.repository.test.ts',
    'backend/src/modules/m06-inventory/tests/unit/stock.service.test.ts',
    'backend/src/modules/m08-sales/tests/integration/sales.integration.test.ts',
    'backend/src/modules/m09-gst/tests/api/gst.api.test.ts',
    'backend/src/modules/m09-gst/tests/integration/gst.integration.test.ts',
    'backend/src/modules/m10-accounting/tests/api/accounting.api.test.ts',
    'backend/src/modules/m13-automation/tests/automation.api.test.ts',
    'backend/src/modules/m13-automation/tests/automation.integration.test.ts',
    'backend/src/modules/m14-import-export/tests/export.test.ts',
    'backend/src/modules/m14-import-export/tests/importExport.api.test.ts',
    'backend/src/modules/m14-import-export/tests/importExport.integration.test.ts',
    'backend/src/modules/m15-sync/tests/hr.api.test.ts',
    'backend/src/modules/m15-sync/tests/hr.integration.test.ts',
    'backend/src/modules/m15-sync/tests/payment.api.test.ts',
    'backend/src/modules/m15-sync/tests/payment.integration.test.ts',
    'backend/src/modules/m15-sync/tests/sync.integration.test.ts',
]

GATE = "describe.runIf(process.env.TEST_DB === '1')(\n"
count = 0
for f in files:
    p = Path(f)
    if not p.exists():
        print('MISSING:', f)
        continue
    t = p.read_text()
    if 'describe.runIf(process.env.TEST_DB' in t:
        continue  # पहले से गेट है
    # पहला "describe(" → gate वाला
    idx = t.find('describe(')
    if idx == -1:
        print('no describe:', f)
        continue
    t = t[:idx] + GATE + t[idx + len('describe('):]
    p.write_text(t)
    count += 1
    print('gated:', f)

print('कुल गेट लगी:', count)
