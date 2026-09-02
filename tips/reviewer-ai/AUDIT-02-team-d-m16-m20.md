# AUDIT #02 — Team D (M16–M20) की कोड-समीक्षा

**किसने की:** समीक्षक AI (Claude) · **तारीख:** 2026-09-02
**क्यों:** पूरन सिंह ने M16–M20 का काम शुरू करने को कहा (File 11–15)
**तरीका:** read-only। DeepSeek समानांतर में टास्क #004 चला रहा है — उसका कुछ नहीं छुआ।

---

## पहले एक ज़रूरी बात (मेरी अपनी गलती का सुधार)

**AUDIT-01 में मैंने लिखा था "21 models schema में गायब हैं"। असली गिनती 58 है।**

वजह: मेरा scan सिर्फ़ `prisma.snake_case` वाले calls पढ़ता था। M12–M20 का कोड
`prisma.notificationMaster`, `prisma.auditLog` जैसे **camelCase** नाम बुलाता है —
वो सब मेरी गिनती से बाहर रह गए। दोबारा सही scan चलाया:

```
कोड 96 models बुलाता है · canonical schema में 45 हैं · ❌ 58 गायब
```

**Team D के पाँचों modules के सारे tables गायब हैं** — यानी इनमें से कोई भी module
आज चल ही नहीं सकता, चाहे उसका कोड कितना भी सही हो।

---

## सबसे ऊपर की बात: पाँचों modules की हालत एक जैसी है

| Module | कोड | app.ts में mount | अपने tables schema में | tsc errors (be/fe) |
|---|---|---|---|---|
| M16 Notification | 1,382 lines, कोई placeholder नहीं | ❌ **नहीं** | ❌ 0/2 | 50 / 8 |
| M17 Reporting | 2,144 lines | ❌ **नहीं** | ❌ 0/2 | 60 / 13 |
| M18 Integration | 1,359 lines | ✅ हाँ | ❌ 0/3 | 39 / 14 |
| M19 Monitoring | 822 lines | ❌ **नहीं** | ❌ 0/4 | 33 / 22 |
| M20 Intl. Trade | 1,750 lines | ❌ **नहीं** | ❌ 0/4 | 77 / 5 |

**अच्छी खबर:** इन पाँचों में **एक भी `STRUCTURE_PLACEHOLDER` फाइल नहीं** — यह असली, लिखा हुआ कोड है
(M13/M14/M15 की तरह खाली ढाँचा नहीं)। मेहनत हुई है, बस जुड़ी नहीं है।

**दूसरी अच्छी खबर:** इनके tables की **असली definition `team-d/` फोल्डर में मौजूद है** —
16 models/tables, हर module की अपनी। यानी #003 की तरह यहाँ भी "source of truth" मिल गया,
अंदाज़े से कुछ नहीं बनाना पड़ेगा।
⚠️ पर ध्यान दें: `team-d/` **tsconfig के `exclude` में है** — इसीलिए वहाँ का कुछ भी आज तक जाँचा नहीं गया।

---

# File 11 — M16 Notification Engine

### 🔴 M16-1 (P0): एक भी notification आज नहीं जा सकता — तीनों channel जान-बूझकर बंद हैं
`whatsapp.service.ts:26`, और वैसे ही sms/email में:
```ts
throw new Error('M18 gateway adapter is not bound for whatsapp; configure an active M18 provider before enabling delivery');
```
यह **गलती नहीं, सोच-समझकर लिया गया "fail-closed" फ़ैसला है** — और वो सही है
(चुपचाप गिरा देने से बेहतर है साफ़ मना करना)। पर नतीजा यह कि **M16 आज कुछ नहीं भेज सकता।**
आपकी pricing strategy का WhatsApp reminder इसी पर टिका है — इसलिए यह अब सिर्फ़ M16 की नहीं,
subscription की भी शर्त है।

### 🔴 M16-2 (P0): दोनों tables गायब
कोड `prisma.notificationMaster` और `prisma.notificationDeliveryLog` बुलाता है — canonical schema में नहीं।
**Source मौजूद:** `team-d/M16-Notification-Engine/database/notification_master.sql` + `notification_delivery_log.sql`
⚠️ कोड **camelCase** से बुलाता है, इसलिए Prisma model का नाम `NotificationMaster` रखना होगा
और नीचे `@@map("notification_master")` — तभी दोनों मिलेंगे।

### 🟠 M16-3 (P1): `to:` में फ़ोन नंबर नहीं, userId जा रहा है
`whatsapp.service.ts:15` — `to: payload.userId` और साथ में comment: *"Would resolve to phone via M05 party.service.ts"*।
**M05 पूरी तरह खाली है** (AUDIT-01 F3)। यानी जब gateway जुड़ भी जाए, संदेश ग़लत पते पर जाएगा।

### 🟡 M16-4 (P2): DI का तरीका बाकी modules से अलग
M16 `notificationRepository` को module-level singleton के रूप में import करता है, जबकि
M18/M19/M20 constructor में `PrismaClient` लेते हैं। इससे M16 का unit test लिखना मुश्किल होगा।

---

# File 12 — M17 Reporting & BI (PDF export जाँच)

### ✅ M17-1: PDF/Excel export का कोड **असली है** — यह अच्छी खबर है
`report.generator.ts` (458 lines) में `pdfkit` और `exceljs` दोनों सही से इस्तेमाल हुए हैं,
और छहों रिपोर्ट के अलग-अलग renderer मौजूद हैं (Sales, Purchase, Inventory, GST, Accounting, HR)।
अनजाना format आने पर साफ़ error फेंकता है। **यहाँ कोई नकली/खाली implementation नहीं मिली।**

### 🔴 M17-2 (P0): पर वो चल नहीं सकता — 4 टूटे imports + दोनों tables गायब
`reportConfig` और `reportTemplate` schema में नहीं
(source: `team-d/M17-Reporting/database/report_config.sql`, `report_template.sql`)।

### 🔴 M17-3 (P0): blueprint की सबसे साफ़ सीमा यहीं टूटती है
`routes/report.routes.ts:13–18` — M17 सीधे **छह modules की internal services** import करता है:
```ts
import { InventoryService } from '../../m06-inventory/services/inventory.service';
// वैसे ही m07, m08, m09, m10, m12
```
Master wiring map साफ़ कहता है: *FORBIDDEN — Module A → Module B internal file*.
सही रास्ता: हर module के `index.ts` (public contract) से, या event/report contract से।
⚠️ पर उन 6 में से **M08/M09/M10 के `index.ts` खाली stubs हैं** (AUDIT-01 F10) —
इसलिए यह अकेले M17 की गलती नहीं; पहले उन modules का public contract बनाना पड़ेगा।

### 🟠 M17-4 (P1): M17 अपनी repository public export करता है
`index.ts` में `ReportRepository` और `ReportQueryBuilder` (`report.internal`) बाहर खुले हैं —
यानी कोई और module सीधे DB तक पहुँच सकता है। Blueprint में यह forbidden है।

---

# File 13 — M18 External Integration (gateway hardening)

**यह पाँचों में सबसे ख़तरनाक निकला — और यही अकेला module app.ts में mount भी है।**

### 🔴 M18-1 (P0, security): "twilio" नाम आते ही signature जाँच पूरी तरह बंद
`gateway.service.ts:294-297`:
```ts
if (p.includes('twilio')) {
  return true; // Implement Twilio-specific validation if needed
}
```
`provider` URL से आता है (`req.params.provider`)। यानी **`/webhooks/twilio` पर भेजा गया कोई भी
जाली (forged) webhook बिना जाँच के "valid" मान लिया जाएगा।** यह hardcoded auth-bypass है।

### 🔴 M18-2 (P0, security): secret न हो तो कोई जाँच ही नहीं होती
`webhook.service.ts:54` — `if (cfg.webhook_secret) { ...जाँचो... }`
यानी जिस integration में secret सेट नहीं है, उसका webhook **बिना किसी जाँच के स्वीकार** होता है।
**नियम उल्टा होना चाहिए:** secret न मिले तो **मना करो** (default-deny), स्वीकार मत करो।

### 🔴 M18-3 (P0): raw body दोबारा बनाया जा रहा है — इसलिए असली signature कभी मैच नहीं करेगा
`webhook.controller.ts:19` — `const rawBody = JSON.stringify(req.body);`
Signature गेटवे ने **मूल bytes** पर बनाया था; `express.json()` उसे parse कर चुका है और
`JSON.stringify` दोबारा बनाता है — key का क्रम, spacing, unicode escaping सब बदल सकते हैं।
**हल:** उस एक route पर `express.raw({type:'*/*'})` (या `verify` callback से `req.rawBody` सुरक्षित रखना)।

### 🟠 M18-4 (P1): Stripe वाली गणना ही ग़लत है
Stripe का header `t=…,v1=…` होता है और signature `${t}.${rawBody}` पर बनता है।
कोड सीधे HMAC(rawBody) की हेक्स से `===` तुलना करता है — यह **कभी सही नहीं होगा**,
और timestamp की जाँच न होने से **replay attack** भी खुला है।

### 🟠 M18-5 (P1): `timingSafeEqual` लंबाई अलग हो तो exception फेंकता है
`gateway.service.ts:288` — छोटा/कचरा signature आने पर `false` नहीं, **exception** आएगा।
पहले लंबाई मिलाओ, फिर तुलना। और बाकी शाखाओं में `===` है — वो timing leak है।

### 🟠 M18-6 (P1): हर हाल में HTTP 200
`webhook.controller.ts:29-31` — comment कहता है *"Always return 200 to external webhooks to avoid retries"*.
इससे signature-fail भी बाहर से **सफल** दिखता है; निगरानी में हमले कभी नहीं दिखेंगे,
और असली गड़बड़ पर gateway दोबारा भेजेगा भी नहीं। सही: 2xx सिर्फ़ स्वीकार पर, बाक़ी 400/401।

### 🟠 M18-7 (P1): एक ही webhook दो बार आए तो दो बार चलेगा
कोई idempotency key नहीं। Gateways बार-बार भेजते ही हैं — इससे दोहरी entry बन सकती है।

### 🔴 M18-8 (P0): तीनों tables गायब
`integration_config`, `api_key_registry`, `webhook_log` — source: `team-d/M18-External-Integration/database/m18-schema.prisma` ✅

---

# File 14 — M19 Audit & Compliance (trail verification)

### 🔴 M19-1 (P0): **इस वक़्त कोई audit trail है ही नहीं** — और दो अधूरे सिस्टम आपस में जुड़े नहीं हैं

**सिस्टम A —** `common/logging/audit-logger.ts`, जिसे M01/M02/M03/M04 (यानी वही modules जो
सच में चलते हैं) इस्तेमाल करते हैं। उसका पूरा कोड यह है:
```ts
log(entry: AuditEntry): void { console.info(JSON.stringify({ type:'audit', ...entry, timestamp: ... })); }
```
**यह सिर्फ़ console पर छापता है — कहीं save नहीं होता।** process restart हुआ, trail ख़त्म।
इसमें company_id / user_id / IP / पहले-बाद का डेटा — कुछ भी अनिवार्य नहीं।

**सिस्टम B —** M19 का `audit.repository.ts`, जो **सही ढंग से** `auditLog` में
companyId, userId, action, module, resource, beforeData, afterData, ipAddress, userAgent लिखता है।
**पर:** `auditLog` table schema में है ही नहीं, M19 app.ts में mount नहीं है, और
**कोई भी module M19 की audit service को बुलाता ही नहीं।**

नतीजा: जो modules log करते हैं वो कहीं नहीं लिखते; जो लिख सकता है वो पहुँच से बाहर है।
Blueprint की GLOBAL CALL CHAIN का आख़िरी पड़ाव ("Audit Logger") और
*"M19 ← audit/security/health events from all modules"* — दोनों टूटे हुए हैं।

### 🔴 M19-2 (P0): चारों tables गायब
`auditLog`, `loginHistory`, `securityEvent`, `systemHealth` —
source: `team-d/M19-Production-Monitoring/database/schema.prisma` ✅ (नाम PascalCase + `@@map` snake_case — कोड से मेल खाता है)

### 🟠 M19-3 (P1): audit trail को बदलने/मिटाने से कोई रोक नहीं
`audit_log` एक साधारण table है। Compliance के लिए इसे **append-only** होना चाहिए —
DB user को UPDATE/DELETE का अधिकार ही न हो (या hash-chain हो)। अभी कुछ भी नहीं है।
अगर कोई अंदर से कुछ ग़लत करे, तो वो अपना निशान मिटा भी सकता है।

---

# File 15 — M20 International Trade (tariff logic)

### ✅ M20-1: 8-अंकों वाली HSN की जाँच सही है
`validators/trade.schema.ts:15,34` — `/^\d{8}$/` — module का नाम ही "8-Digit HSN" है, और यह सही लगा है।

### 🔴 M20-2 (P0): **Social Welfare Surcharge (SWS) पूरी तरह गायब है**
भारत में customs duty का क्रम है: BCD → **SWS = BCD का 10%** → फिर IGST।
पूरे module में `sws` / `social welfare` / `surcharge` शब्द **एक बार भी नहीं** (grep से पक्का किया)।
यानी **लगभग हर import पर duty कम गिनी जाएगी**, और IGST का आधार भी कम बनेगा।
यह अंदाज़े की बात नहीं — यह हर bill of entry पर लगने वाला शुल्क है।

### 🔴 M20-3 (P0): ACD जोड़ी तो जाती है, पर IGST के आधार से बाहर रह गई
`customs.service.ts:68` —
```ts
const igstBase = valueInr + bcd + sad + cvd + antiDumping + safeguard;   // ← acd नहीं है
...
const totalDuty = bcd + acd + sad + cvd + antiDumping + safeguard + igst + cess;  // ← यहाँ acd है
```
एक ही राशि एक जगह गिनी जा रही है, दूसरी जगह नहीं — दोनों में से एक ग़लत है।

### 🟠 M20-4 (P1): `cess = 0` कोड में जमा दिया गया है
`customs.service.ts:77`. Compensation cess कुछ HSN पर लगता ही है (तंबाकू, कोयला, बड़ी गाड़ियाँ)।
`hsn_master.cess_rate` column मौजूद है, पर इस्तेमाल नहीं हो रहा।

### 🟠 M20-5 (P1): पैसा floating-point में गिना जा रहा है
`Number(rule.bcd_rate)` से Decimal को float बनाया जाता है, और
`round(n) = Math.round(n*100)/100` दो दशमलव पर काटता है।
Customs duty भारत में **नज़दीकी रुपये** पर round होती है, पैसे पर नहीं — और float में
हर line पर थोड़ी-थोड़ी त्रुटि जुड़ती जाती है। पैसे का हिसाब Decimal (या पूर्णांक पैसे) में होना चाहिए।

### 🟠 M20-6 (P1): FX की तारीख़ का इस्तेमाल नहीं हो रहा
`fx.repository.ts` में `effective_date` सही से रखा जाता है (`orderBy: desc`) — **पर**
`fx.service.getFXRate(companyId, base, target)` में तारीख़ का parameter ही नहीं है,
इसलिए हमेशा **सबसे नई दर** उठती है। Customs में **bill of entry की तारीख़ वाली अधिसूचित दर**
लगती है। यानी पुराना document दोबारा गिनने पर हर बार अलग जवाब आएगा।

### 🔴 M20-7 (P0, टकराव): `hsn_master` दो अलग रूपों में मौजूद है — यह सबसे नाज़ुक फ़ैसला है
| | canonical `prisma/schema.prisma` (M09 GST का) | `team-d/…/m20-schema.prisma` (M20 का) |
|---|---|---|
| पहचान | `hsn_code`, `type` | `code`, `chapter`, `heading`, `subheading`, `tariff_item` |
| दरें | `gst_rate`, `cess_rate` | `gst_rate`, `cess_rate`, **`igst_rate`** |
| दायरा | `company_id` (हर कंपनी का अपना) | **कोई company_id नहीं** (राष्ट्रीय डेटा) |

और M20 का कोड `hsn.code`, `hsn.chapter`, `hsn.tariff_item`, `hsn.igst_rate` पढ़ता है —
यानी वो **team-d वाला रूप** माँगता है, जो canonical में है ही नहीं।

**⚠️ अगर team-d वाला `hsn_master` सीधे canonical में merge कर दिया गया, तो M09 (GST) का
मौजूदा hsn_master टूट जाएगा** — GST की गणना पूरे repo में उसी पर टिकी है।

**मेरा फ़ैसला:** `hsn_master` **M09 का ही रहेगा** (blueprint में साफ़ लिखा है: M09 owns `hsn_master`)।
M20 उसे **छुएगा नहीं**; M20 के लिए अलग table बनेगी — `customs_tariff` (8-अंकों का tariff item,
राष्ट्रीय डेटा, कोई company_id नहीं), और M20 का कोड `prisma.hsn_master` → `prisma.customs_tariff` करेगा।
**वजह:** (1) blueprint की ownership, (2) GST का HSN हर कंपनी का अपना config है जबकि customs tariff
पूरे देश का साझा डेटा — दोनों को एक table में ठूँसने पर `company_id` को nullable करना पड़ता और
दोनों तरफ़ का मतलब बिगड़ जाता, (3) HARD BOUNDARY: कोई module दूसरे की table दोबारा परिभाषित नहीं करेगा।

---

## कुल जोड़ (13 findings)

| गंभीरता | कितने | कौन से |
|---|---|---|
| 🔴 **P0** | **8** | M16-1, M16-2, M17-2, M17-3, M18-1, M18-2, M18-3, M18-8, M19-1, M19-2, M20-2, M20-3, M20-7 |
| 🟠 P1 | 9 | M16-3, M17-4, M18-4/5/6/7, M19-3, M20-4/5/6 |
| 🟡 P2 | 1 | M16-4 |
| ✅ अच्छा | 3 | M17 का PDF/Excel असली है · M20 की 8-अंक जाँच सही · पाँचों में कोई placeholder नहीं |

## काम का क्रम (मेरा फ़ैसला)

| क्रम | टास्क | क्यों यह पहले |
|---|---|---|
| **#013** | **M18 security fixes** | यह अकेला module **mount है** — यानी इसका छेद आज भी खुला है। बाक़ी चारों तो पहुँच से बाहर हैं, उनका ख़तरा कल का है, M18 का आज का |
| **#011** | M16 — models + gateway binding | pricing/subscription के WhatsApp reminder इसी पर टिके हैं |
| **#014** | M19 — audit trail को असली में जोड़ना | जितनी देर यह नहीं है, उतनी देर बाक़ी सब काम बिना निशान के हो रहा है |
| **#015** | M20 — SWS + ACD + hsn/customs_tariff अलगाव | पैसे की सीधी गणना; ग़लत duty = ग्राहक पर जुर्माना |
| **#012** | M17 — models + public contract से जोड़ना | सबसे ज़्यादा दूसरों पर निर्भर (6 modules के index.ts पहले चाहिए) |

**हर टास्क का पहला कदम एक ही है:** उस module के अपने tables `team-d/` वाले source से
canonical schema में जोड़ना — क्योंकि उसके बिना बाक़ी कुछ भी चलाकर जाँचा नहीं जा सकता।

— समीक्षक AI (Claude), 2026-09-02
