/**
 * अनुमति-व्यवस्था का CLI — seed करना, मालिक बनाना, extra विभाग देना, और जाँचना।
 *
 * मालिक पूरन सिंह का फ़ैसला (2026-09-05) यहीं लागू होता है। कौन सी भूमिका को क्या
 * मिलेगा, यह इस फ़ाइल में नहीं — `common/auth/permission-catalog.ts` में तय है।
 *
 *   npm run perms:seed                      — अनुमतियाँ + चारों भूमिकाएँ + पुराने users
 *   npm run perms:create-owner -- …         — असली कंपनी + मालिक का खाता बनाओ (पहली बार)
 *   npm run perms:grant-owner -- <email>    — मौजूद user को "Owner" बनाओ
 *   npm run perms:grant-bundle -- "<भूमिका>" <bundle>   — extra विभाग खोलो
 *   npm run perms:show -- <email>           — किसी user के पास इस वक़्त क्या-क्या है
 *
 * हर command दोबारा चलाई जा सकती है — कुछ दोहराया नहीं जाएगा (idempotent)।
 */

import { prisma } from '@/common/config/prisma';
import { authInternal } from '@/modules/m02-core-architecture/services/auth.internal';
import {
  ALL_PERMISSIONS,
  ROLE_TEMPLATES,
  DEFAULT_ROLE_FOR_EXISTING_USERS,
  ROLE_OWNER,
  permKey,
  type PermissionKey,
} from '@/common/auth/permission-catalog';

const log = (...args: unknown[]) => console.log(...args);

/** permission_master — 21 modules × 4 क्रियाएँ। पहले से मौजूद हों तो छोड़ देता है। */
async function seedPermissionMaster(): Promise<Map<PermissionKey, string>> {
  let added = 0;
  for (const p of ALL_PERMISSIONS) {
    const existing = await prisma.permission_master.findUnique({
      where: { module_action_resource: { module: p.module, action: p.action, resource: p.resource } },
    });
    if (!existing) {
      await prisma.permission_master.create({
        data: { module: p.module, action: p.action, resource: p.resource, description: p.description },
      });
      added++;
    }
  }
  const all = await prisma.permission_master.findMany();
  const byKey = new Map<PermissionKey, string>(all.map((p) => [permKey(p.module, p.action as never), p.id]));
  log(`  अनुमतियाँ (permission_master): कुल ${all.length} — नई जोड़ी ${added}`);
  return byKey;
}

/** हर कंपनी में चारों भूमिकाएँ + उनकी अनुमतियाँ */
async function seedRolesForCompany(companyId: string, companyName: string, permIds: Map<PermissionKey, string>) {
  for (const tpl of ROLE_TEMPLATES) {
    let role = await prisma.role_master.findFirst({ where: { company_id: companyId, name: tpl.name } });
    if (!role) {
      role = await prisma.role_master.create({
        data: { company_id: companyId, name: tpl.name, description: tpl.description, is_system_role: true },
      });
    }

    const already = new Set(
      (await prisma.role_permission.findMany({ where: { role_id: role.id } })).map((rp) => rp.permission_id),
    );

    let linked = 0;
    for (const key of tpl.permissions) {
      const permissionId = permIds.get(key);
      if (!permissionId) { log(`  ⚠️  अनुमति नहीं मिली: ${key} (भूमिका ${tpl.name})`); continue; }
      if (already.has(permissionId)) continue;
      await prisma.role_permission.create({ data: { role_id: role.id, permission_id: permissionId } });
      linked++;
    }
    log(`  [${companyName}] ${tpl.name}: ${tpl.permissions.length} अनुमतियाँ (${linked} नई जोड़ी)`);
  }
}

/**
 * मालिक का आदेश: "पुराने सभी existing users को अभी के लिए Sales Manager role दे दो"।
 * सिर्फ़ उन users को जिनके पास **अभी कोई भूमिका नहीं** है — जिन्हें मालिक बाद में सही
 * भूमिका दे चुका होगा, उन्हें दोबारा Sales Manager नहीं बनाया जाएगा।
 */
async function assignExistingUsers() {
  const users = await prisma.user_master.findMany({ include: { user_role: true } });
  const withoutRole = users.filter((u) => u.user_role.length === 0);
  let assigned = 0;

  for (const user of withoutRole) {
    const role = await prisma.role_master.findFirst({
      where: { company_id: user.company_id, name: DEFAULT_ROLE_FOR_EXISTING_USERS },
    });
    if (!role) { log(`  ⚠️  ${user.username}: उसकी कंपनी में "${DEFAULT_ROLE_FOR_EXISTING_USERS}" भूमिका नहीं मिली`); continue; }
    await prisma.user_role.create({ data: { user_id: user.id, role_id: role.id } });
    assigned++;
  }

  log(`  पुराने users: कुल ${users.length}, बिना भूमिका वाले ${withoutRole.length} — ${assigned} को "${DEFAULT_ROLE_FOR_EXISTING_USERS}" दी गई`);
  log(`  (जिनके पास पहले से भूमिका थी, उन्हें छुआ नहीं गया)`);
}

async function seed() {
  log('\n🔐 अनुमति-व्यवस्था seed हो रही है (मालिक का फ़ैसला, 2026-09-05)\n');
  const permIds = await seedPermissionMaster();

  const companies = await prisma.company_master.findMany({ select: { id: true, name: true } });
  log(`\n  कंपनियाँ: ${companies.length}`);
  for (const c of companies) await seedRolesForCompany(c.id, c.name, permIds);

  log('');
  await assignExistingUsers();

  const owners = await prisma.user_role.count({ where: { role_master: { name: ROLE_OWNER } } });
  log(`\n  ⚠️  इस वक़्त "Owner" भूमिका वाले users: ${owners}`);
  if (owners === 0) {
    log('     किसी के पास पूरा access नहीं है। मालिक को यह चलाना होगा:');
    log('     npm run perms:grant-owner -- <अपना-email>');
  }
  log('\n✅ seed पूरा\n');
}

async function findUser(emailOrUsername: string) {
  const user = await prisma.user_master.findFirst({
    where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
    include: { user_role: { include: { role_master: true } } },
  });
  if (!user) throw new Error(`कोई user नहीं मिला: ${emailOrUsername}`);
  return user;
}

async function grantOwner(emailOrUsername: string) {
  const user = await findUser(emailOrUsername);
  const role = await prisma.role_master.findFirst({ where: { company_id: user.company_id, name: ROLE_OWNER } });
  if (!role) throw new Error(`इस कंपनी में "${ROLE_OWNER}" भूमिका नहीं है — पहले npm run perms:seed चलाओ`);

  const existing = await prisma.user_role.findFirst({ where: { user_id: user.id, role_id: role.id } });
  if (existing) { log(`ℹ️  ${user.username} पहले से "${ROLE_OWNER}" है`); return; }

  await prisma.user_role.create({ data: { user_id: user.id, role_id: role.id } });
  log(`✅ ${user.username} (${user.email}) अब "${ROLE_OWNER}" है — पूरा access`);
}

/** मालिक: "owner चाहे तो Production department का access भी extra permission देकर दे सके" */
async function grantBundle(roleName: string, bundleName: string) {
  const tpl = ROLE_TEMPLATES.find((t) => t.name === roleName);
  if (!tpl) throw new Error(`भूमिका नहीं मिली: ${roleName}`);
  const bundle = tpl.optionalBundles?.[bundleName];
  if (!bundle) {
    const available = Object.keys(tpl.optionalBundles ?? {}).join(', ') || '(कोई नहीं)';
    throw new Error(`"${roleName}" के लिए bundle "${bundleName}" नहीं है। मौजूद: ${available}`);
  }

  const roles = await prisma.role_master.findMany({ where: { name: roleName } });
  let linked = 0;
  for (const role of roles) {
    for (const key of bundle) {
      const [module, action] = key.split(':');
      const perm = await prisma.permission_master.findFirst({ where: { module, action } });
      if (!perm) continue;
      const exists = await prisma.role_permission.findFirst({ where: { role_id: role.id, permission_id: perm.id } });
      if (exists) continue;
      await prisma.role_permission.create({ data: { role_id: role.id, permission_id: perm.id } });
      linked++;
    }
  }
  log(`✅ "${roleName}" को "${bundleName}" दिया गया — ${roles.length} कंपनियों में, ${linked} नई अनुमतियाँ`);
}

async function show(emailOrUsername: string) {
  const user = await findUser(emailOrUsername);
  log(`\n👤 ${user.username} (${user.email}) — कंपनी ${user.company_id}`);
  log(`   भूमिकाएँ: ${user.user_role.map((ur) => ur.role_master.name).join(', ') || '(कोई नहीं — यानी कुछ नहीं कर सकता)'}`);

  const perms = await prisma.role_permission.findMany({
    where: { role_id: { in: user.user_role.map((ur) => ur.role_id) } },
    include: { permission_master: true },
  });
  const byModule = new Map<string, string[]>();
  for (const p of perms) {
    const list = byModule.get(p.permission_master.module) ?? [];
    if (!list.includes(p.permission_master.action)) list.push(p.permission_master.action);
    byModule.set(p.permission_master.module, list);
  }
  log(`   अनुमतियाँ (${perms.length}):`);
  for (const [module, actions] of [...byModule.entries()].sort()) log(`     ${module}: ${actions.sort().join(', ')}`);
  log('');
}

/**
 * पहली बार के लिए — असली कंपनी और मालिक का खाता, दोनों एक साथ।
 *
 * क्यों चाहिए: `grant-owner` सिर्फ़ **मौजूद** user को भूमिका देता है। database में
 * अभी कोई असली user है ही नहीं (सिर्फ़ tests के fixtures), इसलिए मालिक को "Owner"
 * बनाने से पहले उनका खाता बनाना ज़रूरी है।
 *
 * दोबारा चलाने पर कुछ दोहराया नहीं जाएगा — कंपनी/user पहले से हों तो उन्हीं पर
 * भूमिका लग जाएगी।
 */
async function createOwner(args: string[]) {
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const companyName = get('--company');
  const companyCode = get('--code');
  const name = get('--name');
  const email = get('--email');
  const username = get('--username');
  const password = get('--password');

  const missing = [
    ['--company', companyName], ['--code', companyCode], ['--name', name],
    ['--email', email], ['--username', username], ['--password', password],
  ].filter(([, v]) => !v).map(([f]) => f);

  if (missing.length) {
    throw new Error(
      `ये चाहिए: ${missing.join(' ')}\n\n` +
      `उदाहरण:\n  npm run perms:create-owner -- --company "मेरी कंपनी" --code MERICO \\\n` +
      `    --name "पूरन सिंह" --email aap@example.com --username puran --password "कोई-मज़बूत-पासवर्ड"`,
    );
  }
  if (password!.length < 8) throw new Error('पासवर्ड कम से कम 8 अक्षर का हो');

  let company = await prisma.company_master.findFirst({ where: { code: companyCode } });
  if (!company) {
    company = await prisma.company_master.create({ data: { name: companyName!, code: companyCode! } });
    log(`✅ कंपनी बनी: ${company.name} (${company.code})`);
  } else {
    log(`ℹ️  कंपनी पहले से है: ${company.name} (${company.code})`);
  }

  // इस नई कंपनी में भी चारों भूमिकाएँ चाहिए
  const permIds = await seedPermissionMaster();
  await seedRolesForCompany(company.id, company.name, permIds);

  let user = await prisma.user_master.findFirst({
    where: { company_id: company.id, OR: [{ email: email! }, { username: username! }] },
  });
  if (!user) {
    user = await prisma.user_master.create({
      data: {
        company_id: company.id,
        name: name!,
        email: email!,
        username: username!,
        password_hash: await authInternal.hashPassword(password!),
      },
    });
    log(`✅ खाता बना: ${user.username} (${user.email})`);
  } else {
    log(`ℹ️  खाता पहले से है: ${user.username} — पासवर्ड बदला नहीं गया`);
  }

  await grantOwner(user.email);
  log(`\n🔑 अब आप इससे login कर सकते हैं:  कंपनी code = ${company.code}, username = ${user.username}`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case 'seed': await seed(); break;
    case 'create-owner': await createOwner(args); break;
    case 'grant-owner': {
      if (!args[0]) throw new Error('email या username दो: npm run perms:grant-owner -- <email>');
      await grantOwner(args[0]); break;
    }
    case 'grant-bundle': {
      if (!args[0] || !args[1]) throw new Error('भूमिका और bundle दो: npm run perms:grant-bundle -- "Sales Manager" production');
      await grantBundle(args[0], args[1]); break;
    }
    case 'show': {
      if (!args[0]) throw new Error('email या username दो');
      await show(args[0]); break;
    }
    default:
      log('commands: seed | create-owner --company … | grant-owner <email> | grant-bundle <role> <bundle> | show <email>');
      process.exitCode = 1;
  }
}

main()
  .catch((err) => { console.error('❌', err instanceof Error ? err.message : err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
