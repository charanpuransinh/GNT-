// ============================================================================
// अनुमति-व्यवस्था — असली DB, असली HTTP requests पर जाँच
//
// मालिक पूरन सिंह का फ़ैसला (2026-09-05): चार भूमिकाएँ —
//   Owner (सब कुछ) · Sales Manager (Sales; Production अलग से) ·
//   Accountant (सिर्फ़ Billing+Payment, देख+एडिट) · Supervisor (सिर्फ़ नई entry)
//
// यह फ़ाइल mock पर नहीं चलती। हर test असली token बनाकर असली app पर request भेजता है
// और असली database की भूमिकाएँ पढ़ी जाती हैं — क्योंकि इस project में mock वाली
// "API tests" पहले भी टूटी सुविधाओं को हरा दिखा चुकी हैं।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app, registerModules } from '@/app';
import { authInternal } from '@/modules/m02-core-architecture/services/auth.internal';
import { permissionService } from '@/modules/m02-core-architecture/services/permission.service';
import {
  ALL_PERMISSIONS, ROLE_TEMPLATES,
  ROLE_OWNER, ROLE_SALES_MANAGER, ROLE_ACCOUNTANT, ROLE_SUPERVISOR,
} from '@/common/auth/permission-catalog';

const prisma = new PrismaClient();
const COMPANY_ID = '00000000-0000-4000-8000-0000000002f1';
const stamp = Date.now();

/** हर भूमिका के लिए एक असली user */
const users: Record<string, string> = {};
/** किसी भूमिका में न होने वाला user — इसे कहीं कुछ नहीं मिलना चाहिए */
let noRoleUserId = '';

const bearer = (userId: string) =>
  `Bearer ${authInternal.generateTokenPair({ userId, companyId: COMPANY_ID, roles: [] }).accessToken}`;

async function makeUser(tag: string): Promise<string> {
  const user = await prisma.user_master.create({
    data: {
      company_id: COMPANY_ID,
      name: tag,
      email: `${tag}-${stamp}@perm.test`,
      username: `${tag}-${stamp}`,
      password_hash: 'x',
    },
  });
  return user.id;
}

describe.runIf(process.env.TEST_DB === '1')('अनुमति-व्यवस्था — असली DB पर', () => {
  beforeAll(async () => {
    await registerModules();

    await prisma.company_master.upsert({
      where: { id: COMPANY_ID },
      update: {},
      create: { id: COMPANY_ID, name: 'Permission Test Co', code: `PERMCO${stamp}` },
    });

    for (const p of ALL_PERMISSIONS) {
      await prisma.permission_master.upsert({
        where: { module_action_resource: { module: p.module, action: p.action, resource: p.resource } },
        update: {},
        create: { module: p.module, action: p.action, resource: p.resource, description: p.description },
      });
    }

    for (const tpl of ROLE_TEMPLATES) {
      const role = await prisma.role_master.create({
        data: { company_id: COMPANY_ID, name: tpl.name, description: tpl.description, is_system_role: true },
      });
      for (const key of tpl.permissions) {
        const [module, action] = key.split(':');
        const perm = await prisma.permission_master.findFirst({ where: { module, action } });
        if (perm) await prisma.role_permission.create({ data: { role_id: role.id, permission_id: perm.id } });
      }
      const userId = await makeUser(tpl.name.replace(/\s+/g, '-').toLowerCase());
      await prisma.user_role.create({ data: { user_id: userId, role_id: role.id } });
      users[tpl.name] = userId;
    }

    noRoleUserId = await makeUser('bina-bhoomika');
    permissionService.invalidateAll();
  }, 60_000);

  afterAll(async () => {
    const userIds = [...Object.values(users), noRoleUserId];
    await prisma.user_role.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.user_master.deleteMany({ where: { id: { in: userIds } } });
    const roles = await prisma.role_master.findMany({ where: { company_id: COMPANY_ID } });
    await prisma.role_permission.deleteMany({ where: { role_id: { in: roles.map((r) => r.id) } } });
    await prisma.role_master.deleteMany({ where: { company_id: COMPANY_ID } });
    await prisma.company_master.deleteMany({ where: { id: COMPANY_ID } });
    await prisma.$disconnect();
  });

  // ── सबसे बड़ा छेद जो बंद हुआ ────────────────────────────────────────────
  describe('🛑 वह छेद जिस पर P0 उठा था', () => {
    it('बिना भूमिका वाला user users की सूची नहीं देख सकता (पहले हर login वाला देख लेता था)', async () => {
      const res = await request(app).get('/api/v1/auth/users').set('Authorization', bearer(noRoleUserId));
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN_NO_PERMISSION');
    });

    it('बिना भूमिका वाला user नई भूमिका नहीं बना सकता', async () => {
      const res = await request(app).post('/api/v1/auth/roles')
        .set('Authorization', bearer(noRoleUserId))
        .send({ name: 'हैक-भूमिका' });
      expect(res.status).toBe(403);
    });

    it('बिना भूमिका वाला user किसी को मिटा नहीं सकता', async () => {
      const res = await request(app).delete(`/api/v1/auth/users/${noRoleUserId}`)
        .set('Authorization', bearer(noRoleUserId));
      expect(res.status).toBe(403);
    });
  });

  // ── 1. Owner ────────────────────────────────────────────────────────────
  describe('1️⃣ Owner — पूरा access', () => {
    it('users की सूची देख सकता है', async () => {
      const res = await request(app).get('/api/v1/auth/users').set('Authorization', bearer(users[ROLE_OWNER]));
      expect(res.status).not.toBe(403);
    });

    it('खाता-बही (M10) तक पहुँच सकता है', async () => {
      const res = await request(app).get('/api/v1/accounting/ledger').set('Authorization', bearer(users[ROLE_OWNER]));
      expect(res.status).not.toBe(403);
    });

    it('मिटाने का हक़ भी है (delete पर 403 नहीं)', async () => {
      const res = await request(app).delete('/api/v1/sales/invoices/00000000-0000-4000-8000-00000000dead')
        .set('Authorization', bearer(users[ROLE_OWNER]));
      expect(res.status).not.toBe(403);
    });
  });

  // ── 2. Sales Manager ────────────────────────────────────────────────────
  describe('2️⃣ Sales Manager — Sales विभाग', () => {
    it('बिक्री के बिल देख सकता है', async () => {
      const res = await request(app).get('/api/v1/sales/invoices').set('Authorization', bearer(users[ROLE_SALES_MANAGER]));
      expect(res.status).not.toBe(403);
    });

    it('पार्टी बना सकता है', async () => {
      const res = await request(app).post('/api/v1/parties').set('Authorization', bearer(users[ROLE_SALES_MANAGER])).send({});
      expect(res.status).not.toBe(403);
    });

    it('माल कितना है यह देख सकता है (बेचने के लिए ज़रूरी)', async () => {
      const res = await request(app).get('/api/v1/inventory/stock').set('Authorization', bearer(users[ROLE_SALES_MANAGER]));
      expect(res.status).not.toBe(403);
    });

    it('🔒 पर माल बदल नहीं सकता — Production विभाग उसका नहीं है', async () => {
      const res = await request(app).post('/api/v1/inventory/products')
        .set('Authorization', bearer(users[ROLE_SALES_MANAGER])).send({ name: 'x' });
      expect(res.status).toBe(403);
    });

    it('🔒 ख़रीद (M07) पर कोई हक़ नहीं', async () => {
      const res = await request(app).get('/api/v1/purchase/orders').set('Authorization', bearer(users[ROLE_SALES_MANAGER]));
      expect(res.status).toBe(403);
    });

    it('🔒 users नहीं बना सकता (यह सिर्फ़ मालिक का काम है)', async () => {
      const res = await request(app).post('/api/v1/auth/users')
        .set('Authorization', bearer(users[ROLE_SALES_MANAGER])).send({});
      expect(res.status).toBe(403);
    });
  });

  // ── 3. Accountant ───────────────────────────────────────────────────────
  describe('3️⃣ Accountant — सिर्फ़ Billing और Payment, देख + एडिट', () => {
    it('बिल देख सकता है', async () => {
      const res = await request(app).get('/api/v1/sales/invoices').set('Authorization', bearer(users[ROLE_ACCOUNTANT]));
      expect(res.status).not.toBe(403);
    });

    it('बिल बदल सकता है', async () => {
      const res = await request(app).put('/api/v1/sales/invoices/00000000-0000-4000-8000-00000000dead')
        .set('Authorization', bearer(users[ROLE_ACCOUNTANT])).send({});
      expect(res.status).not.toBe(403);
    });

    it('भुगतान (M11) देख सकता है', async () => {
      const res = await request(app).get('/api/v1/payments').set('Authorization', bearer(users[ROLE_ACCOUNTANT]));
      expect(res.status).not.toBe(403);
    });

    it('🔒 नया बिल नहीं बना सकता (मालिक ने सिर्फ़ "देख + एडिट" कहा था)', async () => {
      const res = await request(app).post('/api/v1/sales/invoices')
        .set('Authorization', bearer(users[ROLE_ACCOUNTANT])).send({});
      expect(res.status).toBe(403);
    });

    it('🔒 बिल मिटा नहीं सकता', async () => {
      const res = await request(app).delete('/api/v1/sales/invoices/00000000-0000-4000-8000-00000000dead')
        .set('Authorization', bearer(users[ROLE_ACCOUNTANT]));
      expect(res.status).toBe(403);
    });

    it('🔒 माल-गोदाम उसका नहीं', async () => {
      const res = await request(app).get('/api/v1/inventory/stock').set('Authorization', bearer(users[ROLE_ACCOUNTANT]));
      expect(res.status).toBe(403);
    });

    // 2026-09-05 — blueprint से तय (§7.8, §7.11): M08 USES M09+M10, M11 USES M10।
    // यानी बिल और भुगतान का मिलान इनके बिना हो ही नहीं सकता।
    it('खाता-बही (M10) देख सकता है — blueprint के अनुसार', async () => {
      const res = await request(app).get('/api/v1/accounting/ledger').set('Authorization', bearer(users[ROLE_ACCOUNTANT]));
      expect(res.status).not.toBe(403);
    });

    it('GST (M09) देख सकता है — blueprint के अनुसार', async () => {
      const res = await request(app).get('/api/v1/gst/returns').set('Authorization', bearer(users[ROLE_ACCOUNTANT]));
      expect(res.status).not.toBe(403);
    });

    it('🔒 फिर भी खाता-बही में कुछ मिटा नहीं सकता (देख + एडिट ही, मालिक की शर्त)', async () => {
      const res = await request(app).delete('/api/v1/accounting/vouchers/00000000-0000-4000-8000-00000000dead')
        .set('Authorization', bearer(users[ROLE_ACCOUNTANT]));
      expect(res.status).toBe(403);
    });
  });

  // ── 4. Supervisor ───────────────────────────────────────────────────────
  describe('4️⃣ Supervisor — सिर्फ़ नई entry', () => {
    it('नई बिक्री entry डाल सकता है', async () => {
      const res = await request(app).post('/api/v1/sales/invoices')
        .set('Authorization', bearer(users[ROLE_SUPERVISOR])).send({});
      expect(res.status).not.toBe(403);
    });

    it('entry भरने के लिए पार्टी और माल की सूची देख सकता है', async () => {
      const parties = await request(app).get('/api/v1/parties').set('Authorization', bearer(users[ROLE_SUPERVISOR]));
      const products = await request(app).get('/api/v1/inventory/products').set('Authorization', bearer(users[ROLE_SUPERVISOR]));
      expect(parties.status).not.toBe(403);
      expect(products.status).not.toBe(403);
    });

    it('🔒 दूसरों के बिल की सूची नहीं देख सकता', async () => {
      const res = await request(app).get('/api/v1/sales/invoices').set('Authorization', bearer(users[ROLE_SUPERVISOR]));
      expect(res.status).toBe(403);
    });

    it('🔒 बना हुआ बिल बदल नहीं सकता', async () => {
      const res = await request(app).put('/api/v1/sales/invoices/00000000-0000-4000-8000-00000000dead')
        .set('Authorization', bearer(users[ROLE_SUPERVISOR])).send({});
      expect(res.status).toBe(403);
    });

    it('🔒 कुछ मिटा नहीं सकता', async () => {
      const res = await request(app).delete('/api/v1/sales/invoices/00000000-0000-4000-8000-00000000dead')
        .set('Authorization', bearer(users[ROLE_SUPERVISOR]));
      expect(res.status).toBe(403);
    });

    // यह सबसे नाज़ुक जाँच है: POST दिखने में "नया बनाना" है, पर approve/post असल में
    // बने हुए बिल की हालत बदलते हैं। override table न होती तो सुपरवाइज़र सिर्फ़ `create`
    // के दम पर बिल approve और post कर लेता।
    it('🔒 बिल approve नहीं कर सकता — POST होते हुए भी वह "बदलना" है', async () => {
      const res = await request(app).post('/api/v1/sales/invoices/00000000-0000-4000-8000-00000000dead/approve')
        .set('Authorization', bearer(users[ROLE_SUPERVISOR])).send({});
      expect(res.status).toBe(403);
    });

    it('🔒 बिल post (पक्का) नहीं कर सकता', async () => {
      const res = await request(app).post('/api/v1/sales/invoices/00000000-0000-4000-8000-00000000dead/post')
        .set('Authorization', bearer(users[ROLE_SUPERVISOR])).send({});
      expect(res.status).toBe(403);
    });

    it('🔒 खाता-बही उसकी नहीं', async () => {
      const res = await request(app).get('/api/v1/accounting/ledger').set('Authorization', bearer(users[ROLE_SUPERVISOR]));
      expect(res.status).toBe(403);
    });
  });

  // ── अपनी profile हर किसी की अपनी है ─────────────────────────────────────
  describe('अपने बारे में', () => {
    it('सुपरवाइज़र भी /auth/me देख सकता है (यह अनुमति का विषय नहीं)', async () => {
      const res = await request(app).get('/api/v1/auth/me').set('Authorization', bearer(users[ROLE_SUPERVISOR]));
      expect(res.status).not.toBe(403);
    });

    it('logout हर कोई कर सकता है', async () => {
      const res = await request(app).post('/api/v1/auth/logout').set('Authorization', bearer(users[ROLE_SUPERVISOR]));
      expect(res.status).not.toBe(403);
    });
  });

  // ── भूमिका बदलते ही असर तुरंत ───────────────────────────────────────────
  it('भूमिका हटते ही access भी हटता है (30 सेकंड की याददाश्त अटकाती नहीं)', async () => {
    const userId = users[ROLE_SALES_MANAGER];
    const pehle = await request(app).get('/api/v1/sales/invoices').set('Authorization', bearer(userId));
    expect(pehle.status).not.toBe(403);

    await prisma.user_role.deleteMany({ where: { user_id: userId } });
    permissionService.invalidateUser(userId);

    const baad = await request(app).get('/api/v1/sales/invoices').set('Authorization', bearer(userId));
    expect(baad.status).toBe(403);
  });
});
