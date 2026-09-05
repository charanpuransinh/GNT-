// ============================================================================
// अनुमति-व्यवस्था की इकलौती जगह (permission catalog)
//
// मालिक पूरन सिंह का फ़ैसला, 2026-09-05 — चार भूमिकाएँ:
//   1. Owner          — पूरा access (सब कुछ देख/एडिट/डिलीट)
//   2. Sales Manager  — Sales विभाग; मालिक चाहे तो Production विभाग extra दे सके
//   3. Accountant     — सिर्फ़ Billing और Payment (देख + एडिट)
//   4. Supervisor     — सिर्फ़ नई entry डालना; edit/delete नहीं, दूसरों का data देखना नहीं
//
// ⚠️ इस फ़ाइल के बाहर कहीं भी अनुमतियाँ हार्ड-कोड नहीं हैं। किसी भूमिका को घटाना/बढ़ाना
// हो तो सिर्फ़ यहीं बदलो और `npm run seed:permissions` दोबारा चलाओ।
// ============================================================================

/** मालिक की चार क्रियाएँ — इससे बाहर कोई पाँचवीं नहीं */
export const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

/** विभाग — मालिक ने इन्हीं शब्दों में बाँटा था */
export type Department = 'sales' | 'production' | 'billing_payment' | 'admin';

export interface ModuleDef {
  /** module code — `permission_master.module` में यही जाता है (VarChar(10)) */
  code: string;
  /** app.ts में इसी पते पर चढ़ा है */
  path: string;
  /** `permission_master.resource` (VarChar(50)) */
  resource: string;
  department: Department;
  /** मालिक की रिपोर्ट में दिखाने के लिए */
  label: string;
}

// ── हर mounted module, उसका पता और विभाग ───────────────────────────────────
// पते module-registry.ts से लिए गए हैं (अंदाज़े से नहीं) — वहाँ बदलें तो यहाँ भी बदलें।
export const MODULES: readonly ModuleDef[] = [
  { code: 'M01', path: '/api/v1/foundation',    resource: 'foundation',    department: 'admin',           label: 'नींव / system' },
  { code: 'M02', path: '/api/v1/auth',          resource: 'user_admin',    department: 'admin',           label: 'users और भूमिकाएँ' },
  { code: 'M03', path: '/api/v1/device',        resource: 'device',        department: 'admin',           label: 'डिवाइस' },
  { code: 'M04', path: '/api/v1/company',       resource: 'company',       department: 'admin',           label: 'कंपनी सेटिंग' },
  { code: 'M05', path: '/api/v1/parties',       resource: 'party',         department: 'sales',           label: 'पार्टी (ग्राहक/सप्लायर)' },
  { code: 'M06', path: '/api/v1/inventory',     resource: 'inventory',     department: 'production',      label: 'माल-गोदाम' },
  { code: 'M07', path: '/api/v1/purchase',      resource: 'purchase',      department: 'production',      label: 'ख़रीद' },
  { code: 'M08', path: '/api/v1/sales',         resource: 'sales',         department: 'sales',           label: 'बिक्री / बिलिंग' },
  { code: 'M09', path: '/api/v1/gst',           resource: 'gst',           department: 'billing_payment', label: 'GST' },
  { code: 'M10', path: '/api/v1/accounting',    resource: 'accounting',    department: 'billing_payment', label: 'खाता-बही' },
  { code: 'M11', path: '/api/v1/payments',      resource: 'payment',       department: 'billing_payment', label: 'भुगतान' },
  { code: 'M12', path: '/api/v1/hr',            resource: 'hr',            department: 'admin',           label: 'HR' },
  { code: 'M13', path: '/api/v1/automation',    resource: 'automation',    department: 'admin',           label: 'automation' },
  { code: 'M14', path: '/api/v1/imports',       resource: 'import_export', department: 'admin',           label: 'import/export' },
  { code: 'M15', path: '/api/v1/sync',          resource: 'sync',          department: 'admin',           label: 'sync' },
  { code: 'M16', path: '/api/v1/notifications', resource: 'notification',  department: 'admin',           label: 'सूचनाएँ' },
  { code: 'M17', path: '/api/v1/reports',       resource: 'report',        department: 'admin',           label: 'रिपोर्ट' },
  { code: 'M18', path: '/api/v1/integrations',  resource: 'integration',   department: 'admin',           label: 'बाहरी जुड़ाव' },
  { code: 'M19', path: '/api/v1/monitoring',    resource: 'monitoring',    department: 'admin',           label: 'निगरानी' },
  { code: 'M20', path: '/api/v1/trade',         resource: 'trade',         department: 'admin',           label: 'विदेश व्यापार' },
  { code: 'M21', path: '/api/v1/data-sense',    resource: 'data_sense',    department: 'admin',           label: 'DataSense' },
] as const;

/** `module:action` — यही string भूमिका के पास होती है और यही जाँची जाती है */
export type PermissionKey = string;
export const permKey = (moduleCode: string, action: Action): PermissionKey => `${moduleCode}:${action}`;

/** पूरी सूची — permission_master में यही 84 पंक्तियाँ जाती हैं (21 modules × 4 क्रियाएँ) */
export interface PermissionDef { module: string; action: Action; resource: string; description: string }
export const ALL_PERMISSIONS: readonly PermissionDef[] = MODULES.flatMap((m) =>
  ACTIONS.map((action): PermissionDef => ({
    module: m.code,
    action,
    resource: m.resource,
    description: `${m.label} — ${({ view: 'देखना', create: 'नया बनाना', edit: 'बदलना', delete: 'मिटाना' } as const)[action]}`,
  })),
);

const modulesOf = (department: Department): string[] =>
  MODULES.filter((m) => m.department === department).map((m) => m.code);

const grant = (moduleCodes: string[], actions: readonly Action[]): PermissionKey[] =>
  moduleCodes.flatMap((code) => actions.map((a) => permKey(code, a)));

// ── चार भूमिकाएँ ────────────────────────────────────────────────────────────

export const ROLE_OWNER = 'Owner';
export const ROLE_SALES_MANAGER = 'Sales Manager';
export const ROLE_ACCOUNTANT = 'Accountant';
export const ROLE_SUPERVISOR = 'Supervisor';

export interface RoleTemplate {
  name: string;
  description: string;
  /** शुरुआत में मिलने वाली अनुमतियाँ */
  permissions: PermissionKey[];
  /**
   * मालिक चाहे तो बाद में यह गुच्छा जोड़ सकता है — `npm run grant:department` से।
   * (मालिक: "owner चाहे तो Production department का access भी extra permission देकर दे सके")
   */
  optionalBundles?: Record<string, PermissionKey[]>;
}

/** Owner — हर module, हर क्रिया। कोई शर्त नहीं। */
const ownerPermissions = (): PermissionKey[] => MODULES.flatMap((m) => ACTIONS.map((a) => permKey(m.code, a)));

export const ROLE_TEMPLATES: readonly RoleTemplate[] = [
  {
    name: ROLE_OWNER,
    description: 'मालिक — पूरा access, सब कुछ देख/एडिट/डिलीट',
    permissions: ownerPermissions(),
  },
  {
    name: ROLE_SALES_MANAGER,
    description: 'बिक्री प्रबंधक — Sales विभाग पूरा; Production मालिक की मर्ज़ी से अलग से',
    permissions: [
      // Sales विभाग — पूरा हक़ (M05 पार्टी + M08 बिक्री)
      ...grant(modulesOf('sales'), ACTIONS),
      // बिक्री करने के लिए ज़रूरी "पढ़ने" का हक़ — माल कितना है, और बिल पर GST क्या लगेगा।
      // यह अलग से दिया गया है, पूरा विभाग नहीं — यानी स्टॉक बदल/मिटा नहीं सकता।
      permKey('M06', 'view'),
      permKey('M09', 'view'),
    ],
    optionalBundles: {
      // मालिक इसे चालू करेगा तो Production विभाग (M06 माल + M07 ख़रीद) पूरा खुल जाएगा
      production: grant(modulesOf('production'), ACTIONS),
    },
  },
  {
    name: ROLE_ACCOUNTANT,
    description: 'लेखाकार — सिर्फ़ Billing और Payment: देख + एडिट (नया बनाना/मिटाना नहीं)',
    permissions: [
      // मालिक के शब्द: "सिर्फ Billing और Payment module का access (देख + एडिट)"
      // Billing = M08 (बिल), Payment = M11 (भुगतान)। create/delete जान-बूझकर नहीं दिए।
      ...grant(['M08', 'M11'], ['view', 'edit']),
    ],
    optionalBundles: {
      // ⚠️ मालिक से पूछा गया है: लेखाकार को खाता-बही (M10) और GST (M09) चाहिए या नहीं।
      // मालिक ने "सिर्फ़ Billing और Payment" कहा था, इसलिए यह **बंद** है — माँगने पर चालू होगा।
      accounting_ledger: grant(['M09', 'M10'], ['view', 'edit']),
    },
  },
  {
    name: ROLE_SUPERVISOR,
    description: 'सुपरवाइज़र — सिर्फ़ नई entry डालना; बदलना/मिटाना नहीं, दूसरों का data देखना नहीं',
    permissions: [
      // सिर्फ़ "नई entry" — माल, ख़रीद, बिक्री तीनों में create
      ...grant(['M06', 'M07', 'M08'], ['create']),
      // entry भरने के लिए जितना देखना ज़रूरी है, उतना ही: पार्टी की सूची और माल की सूची।
      // बिल/ख़रीद की सूचियाँ (यानी दूसरों की entries) पर `view` जान-बूझकर नहीं दिया गया।
      permKey('M05', 'view'),
      permKey('M06', 'view'),
    ],
  },
] as const;

/** नए/पुराने users को शुरुआत में यही भूमिका मिलती है — मालिक का आदेश (2026-09-05) */
export const DEFAULT_ROLE_FOR_EXISTING_USERS = ROLE_SALES_MANAGER;

// ── रास्ते से अनुमति निकालना ────────────────────────────────────────────────

/** HTTP method का सीधा अर्थ */
const METHOD_ACTION: Record<string, Action> = {
  GET: 'view',
  HEAD: 'view',
  POST: 'create',
  PUT: 'edit',
  PATCH: 'edit',
  DELETE: 'delete',
};

/**
 * वे रास्ते जहाँ method का सीधा अर्थ **ग़लत** है।
 * जैसे `POST /invoices/:id/approve` नया बिल नहीं बनाता — बने हुए बिल की हालत बदलता है,
 * इसलिए वह `edit` है। और `POST /stock/check` कुछ बनाता ही नहीं — वह `view` है।
 * अगर यह सूची न होती तो सुपरवाइज़र (जिसे सिर्फ़ create मिला है) बिल approve/post कर पाता।
 */
interface ActionOverride { method: string; test: RegExp; action: Action }
const ACTION_OVERRIDES: readonly ActionOverride[] = [
  // हालत बदलना = edit
  { method: 'POST', test: /\/(approve|post|cancel|reject|submit|unlock|activate|deactivate|reconcile)$/, action: 'edit' },
  // सिर्फ़ पढ़ना/छापना = view
  { method: 'POST', test: /\/(print|share|export|download|preview|search|check|validate|calculate)$/, action: 'view' },
  { method: 'POST', test: /^\/stock\/check$/, action: 'view' },
  // बदलकर नया दस्तावेज़ बनाना = create
  { method: 'POST', test: /\/convert$/, action: 'create' },
  { method: 'POST', test: /\/(bulk-import|import)$/, action: 'create' },
] as const;

/**
 * ये रास्ते हर logged-in user के अपने बारे में हैं — इन पर अनुमति की जाँच नहीं लगती,
 * वरना अपनी ही profile देखने के लिए भी अनुमति चाहिए होती और कोई logout तक न कर पाता।
 */
const SELF_SERVICE_PATHS: readonly string[] = [
  '/api/v1/auth/me',
  '/api/v1/auth/logout',
  '/api/v1/auth/unlock',
  '/api/v1/auth/refresh',
] as const;

export interface RequiredPermission {
  module: string;
  action: Action;
  resource: string;
  key: PermissionKey;
}

/** पते में से query-string और आख़िरी `/` हटाकर साफ़ path */
const cleanPath = (originalUrl: string): string => {
  const noQuery = originalUrl.split('?')[0] ?? '';
  return noQuery.length > 1 && noQuery.endsWith('/') ? noQuery.slice(0, -1) : noQuery;
};

const matchModule = (path: string): ModuleDef | undefined =>
  MODULES.find((m) => path === m.path || path.startsWith(`${m.path}/`));

/**
 * इस request के लिए कौन सी अनुमति चाहिए।
 * `null` = इस रास्ते पर अनुमति की जाँच नहीं (self-service, या कोई module नहीं मिला)।
 */
export function resolveRequiredPermission(method: string, originalUrl: string): RequiredPermission | null {
  const path = cleanPath(originalUrl);
  if (SELF_SERVICE_PATHS.includes(path)) return null;

  const mod = matchModule(path);
  if (!mod) return null;

  const subPath = path.slice(mod.path.length) || '/';
  const upperMethod = method.toUpperCase();

  const override = ACTION_OVERRIDES.find((o) => o.method === upperMethod && o.test.test(subPath));
  const action = override?.action ?? METHOD_ACTION[upperMethod];
  if (!action) return null;

  return { module: mod.code, action, resource: mod.resource, key: permKey(mod.code, action) };
}
