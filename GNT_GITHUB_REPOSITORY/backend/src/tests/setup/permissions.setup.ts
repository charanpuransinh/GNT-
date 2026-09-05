// ============================================================================
// tests के लिए: test user को असली भूमिका देना — पूरे रन में **एक बार**
//
// 2026-09-05 से हर `/api/v1` request पर अनुमति की जाँच लगती है। मौजूदा API tests
// `mintBearer()` से token बनाते हैं जिसका user (TEST_USER_ID) database में किसी
// भूमिका में नहीं था — इसलिए वे सब 403 हो जाते।
//
// ⚠️ इसका आसान (और ग़लत) हल होता: tests में `PERMISSIONS_ENFORCED=false` कर देना।
// तब जाँच tests में कभी चलती ही नहीं और हरा रंग झूठा हो जाता। इसलिए वह नहीं किया —
// यहाँ test user को असली "Owner" भूमिका दी जाती है, यानी जाँच पूरी चालू रहते हुए
// tests अपने module का काम जाँचते हैं।
//
// ⚠️ यह `globalSetup` है, `setupFiles` नहीं। पहले इसे setupFiles में रखा था — तब यह
// हर test file में **समानांतर** चलता था और एक ही पंक्तियाँ डालने की होड़ में
// unique-constraint टकराव से कभी-कभी कोई भी file पूरी फ़ेल हो जाती थी (हर बार अलग
// file — यानी असली "flaky" गड़बड़ी, जिसे बाद में "test का मूड" कहकर टाला जा सकता था)।
// globalSetup पूरे रन में एक बार चलता है, इसलिए वह होड़ रहती ही नहीं।
//
// अनुमति की अपनी जाँच अलग फ़ाइल में है: m02 tests/api/permission.enforcement.db.test.ts
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS, ROLE_OWNER, ROLE_TEMPLATES } from '../../common/auth/permission-catalog';

const TEST_COMPANY_ID = '00000000-0000-4000-8000-000000000001';
const TEST_USER_ID = '00000000-0000-4000-8000-000000000002';

export default async function setup() {
  if (process.env.TEST_DB !== '1') return;

  const prisma = new PrismaClient();
  try {
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });

    await prisma.user_master.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: {
        id: TEST_USER_ID,
        company_id: TEST_COMPANY_ID,
        name: 'Test User',
        email: 'testuser@test.com',
        username: 'testuser',
        password_hash: 'x',
      },
    });

    // createMany + skipDuplicates — पहले से मौजूद पंक्तियों पर चुपचाप आगे बढ़ता है
    await prisma.permission_master.createMany({
      data: ALL_PERMISSIONS.map((p) => ({
        module: p.module, action: p.action, resource: p.resource, description: p.description,
      })),
      skipDuplicates: true,
    });

    const allPerms = await prisma.permission_master.findMany();
    const permId = new Map(allPerms.map((p) => [`${p.module}:${p.action}`, p.id]));

    for (const tpl of ROLE_TEMPLATES) {
      let role = await prisma.role_master.findFirst({ where: { company_id: TEST_COMPANY_ID, name: tpl.name } });
      if (!role) {
        role = await prisma.role_master.create({
          data: { company_id: TEST_COMPANY_ID, name: tpl.name, description: tpl.description, is_system_role: true },
        });
      }
      await prisma.role_permission.createMany({
        data: tpl.permissions
          .map((key) => permId.get(key))
          .filter((id): id is string => Boolean(id))
          .map((permission_id) => ({ role_id: role.id, permission_id })),
        skipDuplicates: true,
      });
    }

    const ownerRole = await prisma.role_master.findFirst({ where: { company_id: TEST_COMPANY_ID, name: ROLE_OWNER } });
    if (ownerRole) {
      await prisma.user_role.createMany({
        data: [{ user_id: TEST_USER_ID, role_id: ownerRole.id }],
        skipDuplicates: true,
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}
