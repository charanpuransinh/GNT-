# टास्क #003 — Team A (M01–M04) Backend को GREEN करना

**प्राथमिकता:** P1 (यही अगला काम है)
**रेपो रूट:** `/root/gnt-project/GNT_GITHUB_REPOSITORY`
**लक्ष्य:** Team A backend के **104 TypeScript errors → 0**
**दायरा:** सिर्फ backend M01–M04 + `prisma/schema.prisma`। **Frontend अभी मत छूना** (उसका टास्क #004 अलग आएगा)।

---

## पृष्ठभूमि — समीक्षक AI ने root cause खुद खोद कर निकाला है

टास्क #002 से पता चला कि पूरे repo में 1490 tsc errors हैं। मैंने Team A के **104 backend errors** को
एक-एक करके पढ़ा और पाया कि ये 104 errors 4 अलग-अलग बग नहीं हैं — **सिर्फ 4 root causes हैं।**
नीचे हर root cause का सबूत भी दिया है। **अंदाज़े से कुछ मत करना, नीचे लिखा हुआ ही करना।**

### Root Cause 1 — canonical schema में Team A के 4 models पूरी तरह गायब हैं ⛔ (सबसे बड़ा)

Code इन models को call करता है, पर `prisma/schema.prisma` में इनका नामो-निशान नहीं:

| Code में call | canonical schema.prisma में | कहां से आया |
|---|---|---|
| `prisma.device_registry` (4 बार) | ❌ MISSING | M03 |
| `prisma.active_session` (6 बार) | ❌ MISSING | M03 |
| `prisma.deployment_settings` (3 बार) | ❌ MISSING | M03 |
| `prisma.financial_year` (4 बार) | ❌ MISSING | M04 |

मैंने पूरे repo में `grep -rn --include=*.prisma "^model active_session"` चलाया — **कहीं भी नहीं मिला।**
यानी M03/M04 के ये tables canonical schema में merge ही नहीं हुए थे।

**पर घबराओ मत — इनकी authoritative definition SQL में मौजूद है:**
- `database/schema/m03/schema.sql` → `device_registry`, `active_session`, `deployment_settings`
- `database/schema/m04/m04_schema.sql` → `financial_year`

इन SQL files को **सच (source of truth) मानो** — अपने मन से कोई column मत जोड़ना, मत हटाना।

### Root Cause 2 — models के बीच relation fields गायब हैं ⛔

Code `include: { user_role: { include: { role_master: true } } }` जैसे nested includes करता है
(देखो `backend/src/modules/m02-core-architecture/repositories/role.repository.ts:7-48`),
पर schema के `user_master`, `user_role`, `role_master`, `role_permission`, `permission_master` में
**एक भी relation field नहीं है** — सिर्फ `user_id`/`role_id` जैसे plain UUID columns हैं।

इसी वजह से error आता है: `Property 'role_master' does not exist on type '{ id: string; user_id: string; ... }'`
और `{ user_role: never }` — `never` का मतलब ही यह है कि relation मौजूद नहीं।

### Root Cause 3 — naming convention का टकराव (28 errors)

Schema के fields **snake_case** में हैं (`company_id`, `is_active`, `password_hash`),
पर code उन्हें **camelCase** में पढ़ता है (`user.companyId`, `user.isActive`, `user.passwordHash`)।
इसलिए errors: `Property 'companyId' does not exist... Did you mean 'company_id'?`

**⚠️ समीक्षक AI का फैसला — इसे कैसे ठीक करना है (इसमें अपनी मर्ज़ी मत चलाना):**

> **Code को बदलो, schema को नहीं।** यानी code में `user.companyId` → `user.company_id` करो।

**वजह (जो मैंने माप कर तय की):**
1. Schema locked और canonical है; DB के असली columns भी snake_case हैं।
2. Schema बदलने पर 274 field lines + 41 models छेड़ने पड़ेंगे, और बाकी 16 modules का जो code
   अभी snake_case पर सही चल रहा है (repo में 409 जगह) वो टूट जाएगा।
3. Code बदलने पर Team A में सिर्फ ~28 जगह बदलनी हैं। जोखिम बहुत कम।

**यह भी माप कर देख लिया:** पूरे repo में उलटी दिशा का एक भी error नहीं है
(`grep -c "TS2551.*Did you mean '[a-z]+[A-Z]'"` → **0**)। यानी कोई भी code camelCase fields पर
सही चल नहीं रहा — इसलिए code बदलने से कुछ टूटेगा नहीं।

### Root Cause 4 — बाकी बचे छुटपुट errors (~15)
- `TS2307` (4) — `Cannot find module` : import path गलत हैं
- `TS2554` (2) — `backend/src/app.ts(59,28)` और `(60,24)`: function call में arguments ही नहीं दिए
- `TS2322` (5) — `Type 'string | null' is not assignable to type 'string | undefined'`
  (Prisma `null` देता है, TS type `undefined` मांगता है)
- `TS2305`/`TS2694` (3) — `cache-config` से `redis` export नहीं हो रहा

---

## करने का काम (इसी क्रम में, एक-एक step)

### Step 1 — `prisma/schema.prisma` में 4 missing models जोड़ो

> **🔓 LOCK खोलने की लिखित अनुमति:** टास्क #002 में मैंने `schema.prisma` का
> `generator`/`datasource` block LOCK किया था। इस टास्क के लिए मैं **सिर्फ नए models और relations
> जोड़ने की अनुमति दे रहा हूँ।**
> **`generator`/`datasource` block को हाथ भी नहीं लगाना।**
> **मौजूदा 41 models के किसी भी field का नाम या type बदलना मना है — सिर्फ relation fields जोड़ सकते हो।**

SQL → Prisma मैपिंग इन नियमों से करो:
- `UUID` → `String @db.Uuid`, PK पर `@id @default(uuid())`
- `VARCHAR(n)` → `String @db.VarChar(n)`
- `TIMESTAMP WITH TIME ZONE`/`TIMESTAMPTZ` → `DateTime`
- `DATE` → `DateTime @db.Date`
- `BOOLEAN DEFAULT x` → `Boolean @default(x)`
- `INTEGER` → `Int`
- `TEXT` → `String`
- `NOT NULL` नहीं है → field के बाद `?` लगाओ
- हर model के अंत में `@@map("वही_table_का_नाम")` ज़रूर लगाओ (बाकी 41 models की तरह)
- `UNIQUE(a, b)` → `@@unique([a, b])`
- SQL के `CHECK` constraints Prisma में नहीं लिखे जा सकते — उनके ऊपर एक comment लिख दो, जैसे
  `// CHECK: platform IN ('ios','android','windows','macos','linux','web') — app layer में validate होगा`
- `ip_address INET` के लिए `String @db.Inet` try करो। अगर `prisma validate` इसे reject करे तो
  `String @db.VarChar(45)` कर दो **और log में साफ़ लिख देना कि तुमने क्या इस्तेमाल किया और क्यों।**
- `financial_year` का `EXCLUDE USING gist (...)` constraint Prisma में लिखा नहीं जा सकता —
  उसके ऊपर comment डाल दो: `// EXCLUDE fy_no_overlap — raw SQL migration में जोड़ना होगा (टास्क में अलग से आएगा)`

### Step 2 — गायब relation fields जोड़ो

Code जिन नामों से relations मांगता है, **बिल्कुल वही नाम** रखने हैं (वरना errors बने रहेंगे):

```
user_master      → user_role[]           (एक user के कई roles)
user_role        → user_master, role_master  (दोनों तरफ)
role_master      → user_role[], role_permission[]
role_permission  → role_master, permission_master
permission_master→ role_permission[]
device_registry  → user_master, active_session[]
active_session   → user_master, device_registry?
company_master   → branch_master[], deployment_settings?, financial_year[]
branch_master    → company_master
deployment_settings → company_master
financial_year   → company_master
```

हर relation पर `@relation(fields: [...], references: [...])` सही से लगाना।
SQL में `ON DELETE CASCADE` लिखा है वहां `onDelete: Cascade`, और `ON DELETE SET NULL` वहां `onDelete: SetNull` लगाओ।

**Relations जोड़ते वक्त मौजूदा `user_id`/`role_id`/`company_id` columns हटाना मत** — वो relation के
`fields: [...]` में इस्तेमाल होंगे।

### Step 3 — validate + generate चलाओ (हर बार, आउटपुट log में paste करो)
```
npx prisma validate --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
```
**दोनों green होने के बाद ही Step 4 पर जाना।** अगर validate fail हो, पहले वो ठीक करो।

### Step 4 — code के camelCase field access को snake_case करो
सिर्फ **prisma से आए objects** पर (Root Cause 3 के फैसले के मुताबिक)।
`companyId` → `company_id`, `isActive` → `is_active`, `passwordHash` → `password_hash`,
`failedLoginAttempts` → `failed_login_attempts`, `twoFactorEnabled` → `two_factor_enabled`,
`lastLoginAt` → `last_login_at`, `branchId` → `branch_id`, `lockedUntil` → `locked_until`

**⚠️ सावधानी — यह अंधाधुंध find-replace से मत करना।** API request/response body,
DTO, Zod validators, और frontend को जाने वाले JSON में camelCase **वैसा ही रहना चाहिए**।
सिर्फ वहां बदलो जहां tsc ने error दिया है — यानी prisma के result object पर।

### Step 5 — बाकी छुटपुट errors ठीक करो (Root Cause 4)
`TS2322 string | null` के लिए `?? undefined` इस्तेमाल करो, `as any` **मत** लगाना।
`as any` या `@ts-ignore` से error दबाना **सख़्त मना है** — पकड़ा गया तो टास्क reject होगा।

### Step 6 — साबित करो कि Team A green है
```
npx tsc -p tsconfig.json --noEmit 2>&1 | grep -E "^backend/src/(app\.ts|modules/m0[1-4])" | wc -l
```
यह **`0`** आना चाहिए। यही इस टास्क का pass/fail टेस्ट है।

फिर पूरे repo का हाल भी दो (कुल गिनती घटनी चाहिए, बढ़नी नहीं):
```
npx tsc -p tsconfig.json --noEmit 2>&1 | grep -cE "error TS[0-9]+"
```

---

## सीमाएं (जो नहीं करना)
- ❌ Frontend की कोई फाइल मत छूना (97 errors — टास्क #004 में आएंगे)
- ❌ M06–M20 की कोई फाइल मत छूना
- ❌ `generator`/`datasource` block मत छूना (LOCKED)
- ❌ मौजूदा 41 models के field नाम/type मत बदलना (सिर्फ relations जोड़ना है)
- ❌ `as any` / `@ts-ignore` / `// @ts-expect-error` से errors मत दबाना
- ❌ `prisma/` की बाकी 3 फाइलें (m07/m08/m09m10) मत छूना
- ❌ Business logic मत बदलना — सिर्फ type-level errors ठीक करने हैं

## पूरा होने पर (रिपोर्ट `tips/coder-ai/log.md` में, हिंदी में)
1. 4 नए models का final Prisma code (ज्यों-का-त्यों paste करो)
2. जोड़े गए relations की लिस्ट
3. `prisma validate` + `prisma generate` का exact output
4. **Step 6 के दोनों commands का exact output** (Team A count = 0, और repo total)
5. कितनी code फाइलें बदलीं, कौन-कौन सी
6. `ip_address` के लिए क्या type इस्तेमाल किया और क्यों
7. अगर 104 में से कोई error ठीक नहीं कर पाए — **उसे छिपाना मत**, साफ़ लिखो कौन सा और क्यों अटका

**टास्क #002 की तरह verbatim output देना — वही तरीका सही था, उसी को दोहराना।**

### ⚠️ रिपोर्ट अब **दो जगह** देनी है (नया नियम, 2026-09-02)
1. `tips/coder-ai/log.md` — ऊपर वाली पूरी तकनीकी रिपोर्ट (commands, output, सब कुछ)
2. `tips/owner-puran-singh/log.md` — **पूरन सिंह के लिए, आसान हिंदी में, तकनीकी भाषा के बिना**:
   समस्या क्या थी → क्या ठीक किया → अब हालत क्या है (पूरा/अटका/चल रहा है) →
   उन्हें कुछ करना है तो क्या

दोनों नोट एक जैसे मत बनाना। विस्तार से नियम `docs/CODER-AI-GUIDE.md` के
"तीन फोल्डर वाला नियम" वाले हिस्से में लिखा है — एक बार पढ़ लेना।

### Push का नियम
- अपने **नोट्स/log की .md फाइलें** push कर सकते हो (मालिक को status तुरंत दिखना चाहिए)
- **कोड (schema.prisma, .ts फाइलें) push मत करना** — सिर्फ commit करो। कोड मेरे verify/OK के बाद ही GitHub जाएगा।

— समीक्षक AI (Claude), 2026-09-02
