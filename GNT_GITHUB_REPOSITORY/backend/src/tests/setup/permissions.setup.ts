// ============================================================================
// tests के लिए: test user को असली भूमिका देना
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
// अनुमति खुद की जाँच अलग फ़ाइल में है: m02 tests/api/permission.enforcement.db.test.ts
// ============================================================================

import { beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS, ROLE_OWNER, ROLE_TEMPLATES } from '@/common/auth/permission-catalog';

const TEST_COMPANY_ID = '00000000-0000-4000-8000-000000000001';
const TEST_USER_ID = '00000000-0000-4000-8000-000000000002';

beforeAll(async () => {
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

    // अनुमतियाँ (permission_master) — seed script जैसी ही, पर tests अपने आप में पूरी हों
    for (const p of ALL_PERMISSIONS) {
      await prisma.permission_master.upsert({
        where: { module_action_resource: { module: p.module, action: p.action, resource: p.resource } },
        update: {},
        create: { module: p.module, action: p.action, resource: p.resource, description: p.description },
      });
    }

    for (const tpl of ROLE_TEMPLATES) {
      let role = await prisma.role_master.findFirst({ where: { company_id: TEST_COMPANY_ID, name: tpl.name } });
      if (!role) {
        role = await prisma.role_master.create({
          data: { company_id: TEST_COMPANY_ID, name: tpl.name, description: tpl.description, is_system_role: true },
        });
      }
      for (const key of tpl.permissions) {
        const [module, action] = key.split(':');
        const perm = await prisma.permission_master.findFirst({ where: { module, action } });
        if (!perm) continue;
        const exists = await prisma.role_permission.findFirst({ where: { role_id: role.id, permission_id: perm.id } });
        if (!exists) await prisma.role_permission.create({ data: { role_id: role.id, permission_id: perm.id } });
      }
    }

    const ownerRole = await prisma.role_master.findFirst({ where: { company_id: TEST_COMPANY_ID, name: ROLE_OWNER } });
    if (ownerRole) {
      const has = await prisma.user_role.findFirst({ where: { user_id: TEST_USER_ID, role_id: ownerRole.id } });
      if (!has) await prisma.user_role.create({ data: { user_id: TEST_USER_ID, role_id: ownerRole.id } });
    }
  } finally {
    await prisma.$disconnect();
  }
}, 60_000);
