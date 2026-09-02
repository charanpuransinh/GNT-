# AUDIT #01 — पूरे सिस्टम की Wiring / Blueprint जांच

**किसने की:** समीक्षक AI (Claude) · **तारीख:** 2026-09-02
**दायरा:** पूरा `GNT_GITHUB_REPOSITORY` — backend, frontend, prisma, database, api-contracts
**तरीका:** सिर्फ पढ़ा गया (read-only)। कोई कोड फाइल नहीं छुई — DeepSeek समानांतर में टास्क #003 चला रहा है।
**मापदंड (कसौटी):** `docs/01_GNT_MASTER_WIRING_MAP.md`, `docs/02_GNT_ABCD_TEAM_WIRING_MAP.md`,
`docs/03_GNT_MODULE_FILE_FUNCTION_MAPPING.md`

---

## एक लाइन में नतीजा

**tsc के 1490 errors असली समस्या नहीं हैं — वो लक्षण हैं।** असली बात यह है कि
**सिस्टम कभी जोड़ा ही नहीं गया** (never wired): backend का कोई startup नहीं, frontend का कोई
app shell नहीं, 20 में से 8 modules app में mount ही नहीं हैं, और एक पूरा module (M05) खाली है।
अगर आज सारे 1490 errors ठीक हो जाएं, तब भी `npm run dev` से कुछ नहीं चलेगा।

**कुल 13 findings — 4 × P0 (चलने ही नहीं देंगे), 5 × P1, 4 × P2.**

---

# P0 — इनके बिना सिस्टम चल ही नहीं सकता

## F1 — कोई server bootstrap नहीं है (कोई `app.listen` नहीं)
**सबूत:** `grep -rn "\.listen(" --include=*.ts backend/src` → **0 results**
`backend/src/app.ts` सिर्फ `export const app = express()` करता है; कोई `server.ts`/`index.ts`
entry point नहीं है जो उसे सुनाए (listen कराए)।
**Blueprint:** MASTER WIRING MAP → RUNTIME ROAD: `Startup → Entry Point → App Shell → Routes`.
यह chain **पहले ही कदम पर टूटी है।**
**मतलब:** backend प्रक्रिया कभी शुरू नहीं हो सकती — port पर कुछ नहीं सुन रहा।

## F2 — 20 में से 8 modules app में wired ही नहीं हैं
`backend/src/app.ts` में सिर्फ 12 mount हैं: M01, M02, M03, M04, M07, M08, M11, M12, M13, M14, M15, M18.

| Module | routes फाइल है? | app.ts में mount? |
|---|---|---|
| M05 Party | ❌ कोई routes नहीं | ❌ |
| M06 Inventory | ✔ है | ❌ **mount नहीं** |
| M09 GST | ✔ है | ❌ **mount नहीं** |
| M10 Accounting | ✔ है | ❌ **mount नहीं** |
| M16 Notification | ✔ है | ❌ **mount नहीं** |
| M17 Reporting | ✔ है | ❌ **mount नहीं** |
| M19 Monitoring | ✔ है | ❌ **mount नहीं** |
| M20 Intl. Trade | ✔ है | ❌ **mount नहीं** |

7 modules का पूरा कोड लिखा हुआ है पर एक भी request उस तक कभी नहीं पहुँचेगी — यानी वो कोड मरा हुआ (dead) है।
**Blueprint:** GLOBAL CALL CHAIN `... → Module Route → Middleware → Controller ...` इन 8 के लिए मौजूद ही नहीं।

## F3 — M05 (Party Management) पूरी तरह खाली है ⚠️ मेरी अपनी चूक
`backend/src/modules/m05-party-management/` → सिर्फ `.gitkeep` और एक stub `index.ts`।
सारे 9 फोल्डर (controllers/services/repositories/models/validators/routes/events/types/tests) **खाली।**
`frontend/src/modules/m05-party-management/` → वही हाल (1 फाइल)।

**यह गंभीर क्यों है:**
1. Blueprint में **CLASS A = M01–M05** है, M01–M04 नहीं। मैंने टास्क #003 में "Team A" को
   M01–M04 मान लिया था — **क्योंकि M05 का error count 0 था।** पर वो 0 सेहत नहीं, **अनुपस्थिति** थी।
   खाली फोल्डर में errors आते ही नहीं। यह मेरी माप की चूक है, दर्ज कर रहा हूँ।
2. Blueprint: `M05 → M06 (public contract only)` — M05 ही पूरे CLASS B का दरवाज़ा है।
   M05 के बिना Team B शुरू करना बेकार है।
3. यानी **टास्क #003 + #004 पूरे होने पर भी CLASS A "पूरा" नहीं कहलाएगा।**

## F4 — Frontend का कोई app shell / router नहीं है
`frontend/src/` में **न `App.tsx`, न `main.tsx`, न कोई router फाइल।**
`grep -rn "modules/m" frontend/src/core` → 0 — यानी 20 में से **एक भी frontend module कहीं register नहीं** है।
**Blueprint:** GLOBAL CALL CHAIN की शुरुआत ही `USER → Frontend Page → ...` से होती है — वो शुरुआत मौजूद नहीं।
314 frontend फाइलें लिखी हैं, पर उन्हें खोलने का कोई रास्ता नहीं है।

---

# P1 — कोड compile/भरोसेमंद नहीं होगा

## F5 — 21 prisma models कोड इस्तेमाल करता है, canonical schema में हैं ही नहीं
टास्क #003 वाले 4 models इस समस्या का **सिर्फ 19% हिस्सा** थे। पूरी सूची (module सहित):

| Module | schema में गायब models |
|---|---|
| M03 | `device_registry`, `active_session`, `deployment_settings` ← #003 में |
| M04 | `financial_year` ← #003 में |
| M11 | `payment`, `invoice`, `refund`, `reconciliation` |
| M12 | `employee`, `attendance`, `leave`, `payroll`, `department` |
| M13 | `workflow` |
| M18 | `integration_config`, `webhook_log`, `api_key_registry` |
| M20 | `trade_document`, `trade_job`, `fx_rate`, `customs_rule` |

**कमांड:** कोड के 47 `prisma.<model>` calls बनाम schema के 41 models (case-insensitive मिलान)।
(`quotation` पहले गायब लगा था — वो case का भ्रम था, canonical में `model Quotation` मौजूद है। सही किया।)

**जड़ यह है:** M11–M15 के schemas **कभी canonical schema.prisma में merge हुए ही नहीं।**
वो 7 अलग-अलग फाइलों में पड़े हैं और Prisma generator उन्हें पढ़ता ही नहीं:

| फाइल | models | canonical में गायब |
|---|---|---|
| `database/schema/M11_Payment.prisma` | 9 | **9** |
| `database/schema/M12_HR.prisma` | 11 | **11** |
| `database/schema/M13_Automation.prisma` | 9 | **9** |
| `database/schema/M14_ImportExport.prisma` | 7 | **7** |
| `database/schema/M15_Sync.prisma` | 7 | **7** |
| `database/schema/04_DATABASE_SCHEMA.prisma` | 6 | 6 (M13 की **दूसरी, टकराती** परिभाषा) |
| `database/schema/schema.prisma` | 6 | 6 (M13 की **तीसरी** प्रति) |
| `prisma/m07-purchase.schema.prisma` / `m08-sales.prisma` / `schema__M09M10.prisma` | 28 | 0 ✅ (ये merge हो चुके हैं) |

⚠️ **M13 की तीन अलग-अलग परिभाषाएँ हैं और वो आपस में मेल नहीं खातीं**
(एक में `WorkflowStepExecution`+`WorkflowTrigger`, दूसरी में `WorkflowStep`+`WorkflowStepLog`)।
merge करने से पहले तय करना पड़ेगा कि कौन सी सही है — वरना गलत सच repo में लॉक हो जाएगा।

⚠️ **नाम की टकराहट:** side फाइलें PascalCase हैं (`Employee`, `PaymentTransaction`), canonical
ज़्यादातर snake_case (31 snake_case बनाम 10 PascalCase — canonical खुद भी एक-सा नहीं है)।
कोड `prisma.employee`, `prisma.payment` बुलाता है — merge करते वक्त `@@map` से यह मिलाना पड़ेगा।

## F6 — M13 (Automation) किसी और repo के ढांचे के लिए लिखा गया है
पूरे backend में **71 टूटे हुए imports** हैं (जिनकी फाइल मौजूद ही नहीं), उनमें **44 अकेले M13 में**:

- `../../../m04-events/src/EventBus` और `../../../m06-notifications/src/NotificationService`
  → **ये modules GNT blueprint में हैं ही नहीं** (M04 = Company, M06 = Inventory; notification M16 है)।
- `../../../m01-foundation/src/Logger` → हमारे यहाँ `modules/m01-foundation/` के अंदर कोई `src/` है ही नहीं।
- `../../src/services/...`, `../queue/queue.setup`, `../engine/WorkflowEngine` → कोई फाइल नहीं।

module-wise टूटे imports: **M13:44, M14:8, M15:6, M17:4, M11:3, M02:2, M03/M04/M16/M18:1-1**

फिर भी `app.ts` **M13 को mount करता है** (`initM13Module()`) — यानी entry point ही एक ऐसे module पर
टिका है जो resolve नहीं होता।

## F7 — errors दबाए गए हैं (tsconfig के ज़रिए), ठीक नहीं किए गए
`tsconfig.json` के `exclude` में **M13 की 8 फाइलें नाम लेकर** बाहर कर दी गई हैं
(`WorkflowEngine.ts`, `SendEmailAction.ts`, `routes/index.ts`, दोनों controllers, आदि),
साथ ही `**/tests/**` भी।

**इसका सीधा मतलब:**
1. **1490 का baseline असल से कम है** — M13 की सबसे टूटी फाइलें गिनी ही नहीं गईं।
2. **कोई भी test कभी type-check नहीं होता।**
3. यह वही चीज़ है जो मैंने टास्क #003 में `as any` / `@ts-ignore` के नाम पर सख़्ती से मना किया था —
   बस config के स्तर पर। **नियम एक ही होना चाहिए।**

## F8 — Security/Tenant wiring लगभग नदारद है
| middleware | कितनी जगह लगा |
|---|---|
| `auth-middleware` | 41 route फाइलों में से **4** |
| `tenant-middleware` | **1** |
| `validation-middleware` | **2** |

`helmet` और `cors` dependencies में मौजूद हैं पर `app.ts` में **इस्तेमाल ही नहीं** — पूरे app पर
कोई security header नहीं, कोई CORS नीति नहीं, कोई error handler नहीं, कोई global auth नहीं।

**Blueprint:** GLOBAL CALL CHAIN में `Route → Security / Tenant / Validation Middleware → Controller`
अनिवार्य है। **multi-tenant isolation अभी लागू ही नहीं है** — यह एक ऐसे ERP में सबसे भारी जोखिम है
जहाँ हर row `company_id` से बंधी होनी चाहिए।

## F9 — Event Bus टुकड़ों में बँटा है और handlers कभी चालू नहीं होते
4 event-bus फाइलें मिलीं, पर असल में **2 अलग implementations** हैं:
- `common/events/event-bus.ts` (7 lines, in-memory) — `core/event-bus.ts` और `shared/events/event-bus.ts`
  सिर्फ इसी के re-export shim हैं (यह ठीक है, नकल नहीं)
- `modules/m11-payment/events/event.bus.ts` (46 lines) — **M11 का अपना अलग bus, 12 जगह इस्तेमाल**

→ M11 जो events छोड़ेगा वो global bus तक कभी नहीं पहुँचेंगे। Blueprint का
`M10 → M11` और `Event Bus → Registered Event Handler` रास्ता M11 के लिए टूटा हुआ है।

**इससे भी बड़ी बात:** startup पर **कोई भी handler subscribe नहीं होता** —
`app.ts` में एक भी `.subscribe()` / handler registration नहीं है। यानी हर module की
`events/*.handlers.ts` फाइलें लिखी तो हैं, पर **सब dead code हैं।**

---

# P2 — ढांचे/अनुशासन की खामियाँ

## F10 — PUBLIC CONTRACT का नियम दोनों दिशाओं में टूटा है
**(क) 5 modules का कोई public surface है ही नहीं** — `index.ts` सिर्फ एक comment है:
M05, M07, M08, M09, M10 → `// Public module exports are defined here.`
इसलिए कोई दूसरा module इन्हें "सही तरीके" से बुला ही नहीं सकता।

**(ख) उल्टी तरफ, M06 और M17 अपने repositories तक public export कर रहे हैं:**
`m06-inventory/index.ts` → `ProductRepository`, `StockRepository`, `CategoryRepository`, `StockInternalService`
`m17-reporting/index.ts` → `ReportRepository`, `ReportQueryBuilder` (`report.internal`)
**Blueprint (HARD BOUNDARY):** `FORBIDDEN: Module A → Module B repository`.
Repository public index से export करना = वो दरवाज़ा खुद खोल देना।

**(ग) M17 सीधे 6 modules की internal services import करता है** (`report.routes.ts:13-18`):
`../../m06-inventory/services/inventory.service`, वैसे ही M07, M08, M09, M10, M12 —
public contract से नहीं, relative path से अंदर घुसकर।

## F11 — Frontend जिन API पतों को बुलाता है, backend पर वो हैं ही नहीं
| frontend बुलाता है | backend पर mount |
|---|---|
| `/api/v1/foundation` | ❌ (backend पर `/api/v1/app` है — **नाम अलग**) |
| `/api/v1/inventory` | ❌ mount नहीं |
| `/api/v1/gst` | ❌ mount नहीं |
| `/api/v1/accounting` | ❌ mount नहीं |
| `/api/v1/reports` | ❌ mount नहीं |
| `/api/v1/notifications` | ❌ mount नहीं |
| `/api/v1/sales`, `/payments`, `/device`, `/company`, `/auth` | ✅ मिलते हैं |

## F12 — 94 फाइलें असल में खाली "placeholder" हैं
`STRUCTURE_PLACEHOLDER` लिखी हुई फाइलें: **M15: 57, M13: 22, M14: 15**
(कुल 845 ts/tsx फाइलों में से; इनके अलावा 35 फाइलें 5 लाइन से छोटी हैं।)

**इसका असर:** फाइल-गिनती से प्रगति नापना गलत नतीजे देता है। M15 सबसे बड़ा module दिखता है
(17 services, 10 controllers) — पर उसकी 57 फाइलें खाली ढाँचा हैं।
साथ ही M15 के अंदर **दूसरे modules के नाम की placeholder फाइलें** पड़ी हैं
(`m15-sync/services/payment.service.ts` जिसका header कहता है `GNT TEAM C - M11-PAYMENT`,
वैसे ही `employee.service.ts`, `integration.service.ts`, `webhook.service.ts`) — गलत module में रखी हुई।
(⚠️ ये **नकल किया हुआ business logic नहीं** हैं, सिर्फ गलत जगह रखे खाली ढाँचे — इसलिए यह P2 है, P0 नहीं।)

## F13 — छुटपुट अंतर
- `database/views/` **फोल्डर ही नहीं है** (blueprint की FILE PLACEMENT सूची में है)
- `api-contracts/v1/` में **M05, M07, M16, M17, M18, M19, M20 के contract नहीं हैं** (13/20 मौजूद)
- `common/middleware/rate-limit` **फाइल मौजूद नहीं**, पर M03 और M04 की routes उसे import करती हैं;
  `express-rate-limit` dependency भी `package.json` में नहीं है
  *(यही वो चीज़ है जिस पर DeepSeek अभी टास्क #003 में अटका था)*
- `package.json` की dependencies में **`"fs"`** है — यह Node का builtin है; npm पर इस नाम का
  package एक पुराना खाली stub है। हटाना चाहिए (supply-chain का बेकार जोखिम)।

---

# इसका मौजूदा योजना पर क्या असर है

**टास्क #003 और #004 गलत नहीं हैं — पर वो अकेले काफ़ी नहीं हैं।** दोनों पूरे होने पर
Team A का error count 0 हो जाएगा, फिर भी:
- backend चालू नहीं होगा (F1),
- frontend खुलेगा ही नहीं (F4),
- M05 खाली रहेगा यानी CLASS A अधूरा (F3),
- और Class B का दरवाज़ा (M05 → M06) बंद रहेगा।

## मेरा सुझाया क्रम (आगे के टास्क)

| क्रम | टास्क | क्यों इसी क्रम में |
|---|---|---|
| **#003** (चल रहा) | Team A backend 104 → 0 | पहले से चल रहा है, रोकना नहीं |
| **#004** | Team A frontend 97 → 0 | पहले से तय |
| **#005 (नया, P0)** | Server bootstrap + बाकी 8 modules mount + helmet/cors/error-handler | F1+F2 — इसके बिना "काम करता है" कहना असंभव है |
| **#006 (नया, P0)** | Frontend app shell + router + module registration | F4 |
| **#007 (नया, P0)** | M05 Party Management — पूरा module | F3 — Class A इसके बिना lock नहीं हो सकता |
| **#008 (नया, P1)** | M11–M15 schemas का canonical merge (M13 की 3 प्रतियों का फैसला पहले) | F5 — Class C का पूरा आधार |
| **#009 (नया, P1)** | Security/Tenant middleware हर route पर | F8 |
| **#010 (नया, P1)** | M13 को GNT ढाँचे में लाना + tsconfig के exclude हटाना | F6+F7 |

**#005 और #006 सबसे पहले क्यों:** ये दोनों "पूरे सिस्टम का पहला बार चलना (first light)" देते हैं।
जब तक एक भी request end-to-end नहीं चलती, हर आगे का काम बिना नापे किया गया अंदाज़ा है।

## नियम जो मैं अपने लिए तय कर रहा हूँ (इस audit से सीख)
1. **"0 errors" को कभी सेहत मत मानो** — पहले देखो वहाँ कोड है भी या नहीं। M05 इसी वजह से छूट गया।
2. **किसी भी module को "पूरा" कहने से पहले उसका पूरा रास्ता (route mount → server listen → UI) जांचो**,
   सिर्फ compile होना काफ़ी नहीं।
3. **tsconfig का `exclude` भी suppression है** — `as any` जितना ही गंभीर। अगली बार से टास्क में
   यह भी साफ़ लिखूँगा।

— समीक्षक AI (Claude), 2026-09-02
