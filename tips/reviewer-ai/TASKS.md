# GNT — बाक़ी सारे काम की पूरी सूची (M01–M20)

**बनाई:** समीक्षक AI (Claude) · **तारीख़:** 2026-09-02
**यह फाइल तीन जगह एक जैसी रखी गई है** — `tips/owner-puran-singh/OWNER_TASKS.md`,
`tips/reviewer-ai/CLAUDE_TASKS.md`, `tips/reviewer-ai/TASKS.md` — ताकि session बदलने पर काम न छूटे।

**हालत (2026-09-02 रात):** मुहर लगे काम **7** · backend errors **994 → 767** · M16/M18/M19/M20 सब **0**
**अब तक जो verified है:** #002 (Prisma baseline), #003 (Team A backend), #004 (Team A frontend)
**चालू साबित पर locked नहीं:** #005 backend bootstrap, #006 frontend shell

---

# भाग 1 — काम का क्रम (यही ऊपर से नीचे चलेगा)

| क्रम | टास्क | किसका | हालत |
|---|---|---|---|
| ✅ | **#013** M18 सुरक्षा | DeepSeek | 🟢 **VERIFIED** (`verified/013`) |
| ✅ | **#011** M16 Notification | DeepSeek | 🟢 **VERIFIED** (`verified/011`) |
| ✅ | **#014** M19 Audit trail | DeepSeek | 🟢 **VERIFIED** (`verified/014`) |
| ✅ | **#015** M20 Customs duty | DeepSeek | 🟢 **VERIFIED** (`verified/015`) |
| 1 | **#012** M17 Reporting — बचे 25 errors | DeepSeek | 🔧 **चल रहा** (blocker मैंने खोल दिया) |
| 2 | **#009** 🔴 **Tenant सुरक्षा** — कंपनी की पहचान header से नहीं, token से | DeepSeek | 📋 **फाइल तैयार — P0** |
| 3 | **#008** M11/M12/M14/M15 schema merge (~530 errors) | DeepSeek | 📋 **फाइल तैयार** |
| 4 | **#016** M06–M10 green + mount (62 errors) | DeepSeek | 📋 **फाइल तैयार** |
| 5 | **#007** M05 Party Management — पूरा module | दोनों | ⬜ rough ढाँचा Claude देगा |
| — | — | — | — |
| 6 | **#010** M13 + tsconfig के exclude हटाना | DeepSeek | ⬜ मालिक का फ़ैसला चाहिए (3 schema) |
| 7 | **#017** Tests चालू करना | दोनों | ⬜ |
| 8 | **#018+** Subscription (Phase 0→4) | दोनों | ⬜ owner के फ़ैसलों के बाद |

---

# भाग 2 — मॉड्यूल-दर-मॉड्यूल बाक़ी काम

### M01 — Foundation 🔧
- [ ] tests लिखना/चलाना (अभी tsconfig से बाहर हैं) → lock की शर्त
- [ ] `common/logging/audit-logger` को M19 से जोड़ना (अभी सिर्फ़ console पर छापता है) → #014
- [ ] `app.repository` का redis इस्तेमाल common/cache-config से सही करना
- [ ] module lock certificate (FE+BE+API+DB+Tests पूरे होने पर)

### M02 — Core Architecture 🔧
- [ ] `company_master.code` जोड़कर login को GSTIN से हटाना → **CERT-003 की शर्त 1** (Phase 0)
- [ ] auth middleware हर सुरक्षित route पर (अभी 41 में से 4) → #009
- [ ] tests (auth/permission/session) → lock की शर्त
- [ ] module lock certificate

### M03 — Device & Platform 🔧
- [ ] tests (device/session/platform)
- [ ] `active_session` की सफ़ाई (expired sessions) का job
- [ ] module lock certificate

### M04 — Company Management 🔧
- [ ] `express.d.ts` की typing सुधारना (`req.tenant` अभी required है पर middleware 1 ही route पर) → **CERT-003 शर्त 2**
- [ ] वह global typing `common/types/` में ले जाना → **CERT-003 शर्त 3**
- [ ] `financial_year` का EXCLUDE constraint raw SQL migration में जोड़ना
- [ ] API contract (`M04-company.contract.yaml`) को कोड से मिलाना — response shape बदला है
- [ ] tests + module lock certificate

### M05 — Party Management ⬜ **(पूरा module खाली — सिर्फ़ .gitkeep)**
- [ ] backend: controllers/services/repositories/models/validators/routes/events/types — सब बनाना
- [ ] frontend: PartyListPage, PartyEntryDrawer, PartyDetailHubPage
- [ ] schema: `party_master` + outstanding/credit-limit/aging से जुड़े models
- [ ] `M05-party.contract.yaml` (अभी है ही नहीं)
- [ ] app.ts में mount (`/api/v1/parties`)
- [ ] ⚠️ **यह Class B का दरवाज़ा है** — M06→M10 इसी के public contract पर टिके हैं
- [ ] tests + lock

### M06 — Inventory ⬜
- [ ] backend के 12 + frontend के 9 tsc errors → 0
- [ ] app.ts में mount (`/api/v1/inventory`) — frontend पहले से यही path बुलाता है
- [ ] `index.ts` से **repositories का export हटाना** (blueprint में forbidden)
- [ ] tests + lock

### M07 — Purchase ⬜
- [ ] backend के 27 errors → 0
- [ ] `createPurchaseRouter(controller, poController)` की composition बनाकर mount करना
      *(टूटा `export default router` हटाया जा चुका है)*
- [ ] frontend पूरा बनाना (अभी सिर्फ़ 1 खाली फाइल — 5 पेज blueprint में लिखे हैं)
- [ ] `M07-purchase.contract.yaml` (अभी नहीं है)
- [ ] `index.ts` खाली stub है — public contract बनाना
- [ ] tests + lock

### M08 — Sales & Billing ⬜
- [ ] backend 19 + frontend 1 errors → 0
- [ ] `index.ts` खाली stub — public contract बनाना (M17 को इसकी ज़रूरत है)
- [ ] frontend के बाक़ी पेज (blueprint में 6, अभी 6 फाइलें कुल)
- [ ] tests + lock

### M09 — GST & Compliance ⬜
- [ ] backend 2 errors → 0 · mount (`/api/v1/gst`)
- [ ] `index.ts` खाली stub — public contract
- [ ] ⚠️ `hsn_master` **M09 का ही रहेगा** — M20 इसे नहीं छुएगा (फ़ैसला दर्ज)
- [ ] tests + lock

### M10 — Accounting ⬜
- [ ] backend 6 + frontend 2 errors → 0 · mount (`/api/v1/accounting`)
- [ ] `index.ts` खाली stub — public contract
- [ ] tests + lock

### M11 — Payment & Communication ⬜
- [ ] **9 models schema में जोड़ना** (`database/schema/M11_Payment.prisma` से) → #008
- [ ] backend 203 + frontend 27 errors → 0 *(सबसे ज़्यादा errors वाला module)*
- [ ] अपना अलग event bus हटाकर साझा bus पर लाना (अभी 12 जगह अलग bus)
- [ ] ⚠️ subscription का पैसा M11 से **नहीं** जाएगा (फ़ैसला दर्ज — ग्राहक का ledger गंदा होता)
- [ ] tests + lock

### M12 — Employee & HR ⬜
- [ ] **11 models जोड़ना** (`M12_HR.prisma` से) → #008
- [ ] backend 60 + frontend 20 errors → 0
- [ ] tests + lock

### M13 — Smart Automation ⬜ **(app में चढ़ते ही गिरता है)**
- [ ] गायब फाइलें: `queue/queue.names`, `queue/queue.setup`, `engine/WorkflowEngine`
- [ ] phantom imports हटाना: `m04-events`, `m06-notifications` (ये modules blueprint में हैं ही नहीं)
- [ ] `../../src/...` वाले 44 टूटे imports GNT ढाँचे में लाना
- [ ] **tsconfig से M13 की 8 exclude lines हटाना** (छिपाई गई गलतियाँ खोलना)
- [ ] **3 टकराती schema परिभाषाओं में से एक चुनना** — owner का फ़ैसला चाहिए
- [ ] tests + lock

### M14 — Import/Export ⬜
- [ ] **7 models जोड़ना** (`M14_ImportExport.prisma`) → #008
- [ ] backend 149 + frontend 102 errors → 0 *(frontend में सबसे ज़्यादा)*
- [ ] index router नहीं लौटाता — mount ठीक करना
- [ ] 15 placeholder फाइलें भरना
- [ ] tests + lock

### M15 — Data Storage & Sync ⬜
- [ ] **7 models जोड़ना** (`M15_Sync.prisma`) → #008
- [ ] backend 183 + frontend 32 errors → 0
- [ ] **57 placeholder फाइलें** — इनमें M11/M12/M18 के नाम की ग़लत जगह पड़ी फाइलें भी हैं
- [ ] tests + lock

### M16 — Notification Engine 🔧 → **टास्क #011**
- [ ] `NotificationMaster` + `NotificationDeliveryLog` models (`team-d/M16-*/database/*.sql` से)
- [ ] तीनों channel (WhatsApp/SMS/Email) को M18 gateway से जोड़ना — अभी fail-closed
- [ ] `to:` में userId की जगह असली पता
- [ ] mount `/api/v1/notifications` · backend 50 + frontend 2 errors → 0
- [ ] ⚠️ subscription के WhatsApp reminder इसी पर टिके हैं
- [ ] tests + lock

### M17 — Reporting & BI 🔧 → **टास्क #012**
- [ ] `ReportConfig` + `ReportTemplate` models
- [ ] 6 modules की internal services सीधे import करना बंद (blueprint HARD BOUNDARY)
- [ ] अपनी repository का public export हटाना
- [ ] mount `/api/v1/reports` · backend 60 + frontend 13 errors → 0
- [ ] ✅ PDF/Excel export का कोड असली है — उसे बदलना नहीं, सिर्फ़ चलाने लायक करना
- [ ] tests + lock

### M18 — External Integration 🔧 → **टास्क #013 (सबसे पहले)**
- [ ] 3 models: `integration_config`, `api_key_registry`, `webhook_log`
- [ ] 🔴 twilio वाला बिना-शर्त `return true` हटाना (auth bypass)
- [ ] 🔴 secret न हो तो webhook **मना** करना (अभी बिना जाँच स्वीकार)
- [ ] 🔴 असली raw body इस्तेमाल करना *(app.ts में `express.raw` Claude लगा चुका है)*
- [ ] Stripe की गणना + timestamp tolerance; constant-time तुलना
- [ ] सही HTTP codes (अभी हर हाल में 200) · webhook idempotency
- [ ] backend 38 + frontend 14 errors → 0 · tests + lock

### M19 — Production & Monitoring 🔧 → **टास्क #014**
- [ ] 4 models: `AuditLog`, `LoginHistory`, `SecurityEvent`, `SystemHealth`
- [ ] 🔴 `common/audit-logger` (सिर्फ़ console) को M19 से जोड़ना — **अभी कोई audit trail नहीं है**
- [ ] audit_log को append-only बनाना (UPDATE/DELETE का अधिकार हटाने वाली migration)
- [ ] mount `/api/v1/monitoring` · backend 33 + frontend 22 errors → 0
- [ ] tests + lock

### M20 — International Trade 🔧 → **टास्क #015**
- [ ] 4 models + **नई `customs_tariff` table** (M09 का `hsn_master` छूना मना)
- [ ] 🔴 Social Welfare Surcharge (BCD का 10%) जोड़ना — अभी पूरी तरह गायब
- [ ] 🔴 ACD का विरोधाभास (IGST base में नहीं, total में है)
- [ ] `cess = 0` हटाकर असली दर से
- [ ] पैसा float की जगह Decimal/पैसे में; रुपये पर rounding
- [ ] FX में bill-of-entry की तारीख़ वाली दर
- [ ] backend 77 + frontend 5 errors → 0 · tests + lock

---

# भाग 3 — पूरे सिस्टम के साझा काम (किसी एक module के नहीं)

| # | काम | क्यों |
|---|---|---|
| S1 | **58 गायब models** canonical schema में लाना | कोड 96 models बुलाता है, schema में 45 |
| S2 | **Security/tenant middleware हर route पर** | अभी 41 में से auth 4 पर, tenant 1 पर — multi-tenant अलगाव लागू ही नहीं |
| S3 | **Event bus एक करना + handlers register करना** | अभी सारे event handlers dead code हैं; M11 का अपना अलग bus |
| S4 | **Public contract (index.ts)** — M05/M07/M08/M09/M10 खाली stubs | दूसरे modules को अंदर घुसना पड़ता है |
| S5 | **Repository के public export हटाना** (M06, M17) | blueprint में साफ़ forbidden |
| S6 | **Tests चालू करना** | अभी `**/tests/**` tsconfig से बाहर — एक भी test type-check नहीं होता |
| S7 | **बचे 11 modules mount करना** | अभी 9/20 चढ़ते हैं |
| S8 | **api-contracts बनाना** — M05, M07, M16, M17, M18, M19, M20 | 20 में से 13 के ही हैं |
| S9 | `database/views/` फोल्डर | blueprint की सूची में है, मौजूद नहीं |
| S10 | `package.json` से फ़र्ज़ी `"fs"` dependency हटाना | npm का खाली stub package |
| S11 | **94 placeholder फाइलें** भरना (M15:57, M13:22, M14:15) | फाइल गिनती से प्रगति नापना ग़लत नतीजे देता है |
| S12 | CI/CD + migrations का क्रम तय करना | अभी सब हाथ से |

---

# भाग 4 — Pricing / Subscription (owner का blueprint)

| Phase | काम | कब |
|---|---|---|
| **0** | `company_master.code` + login GSTIN से हटाना | अभी हो सकता है (छोटा) |
| **1** | 7 tables + `effectiveStatus` + `subscriptionGuard` + ग्राहक वाले GET APIs | #005/#006 lock होने के बाद |
| **2** | Owner control panel + `subscription_event` + M13 का रोज़ का job + M16 reminder | #011/#014 के बाद |
| **3** | Razorpay (M18 connector) + `platform_invoice`/`platform_payment` + GST बिल | Phase 2 के बाद |
| **4** | Referral + Founding-100 की गिनती + आँकड़े | अंत में |
| — | **Onboarding deadline** (owner का "1 महीने का warning" वाला विचार) — `platform_policy` + `onboarding_item` | Phase 1 के साथ |

---

# भाग 5 — owner (पूरन सिंह) के फ़ैसले जिनका इंतज़ार है

**Pricing से जुड़े (9):**
1. ₹299 में GST शामिल है या ऊपर से? 2. "Lifetime lock" की लिखित परिभाषा?
3. Trial सच में 6 महीने? *(सुझाव: 3 महीने + 1 महीना read-only)* 4. Blocked पर data export खुला रखें? *(सुझाव: हाँ)*
5. एक मालिक की कई companies — बिल अलग या एक साथ? 6. Founding-100 की गिनती signup से या पहली payment से?
7. Enterprise की कीमत कौन तय करेगा? 8. Razorpay या PayU? *(सुझाव: Razorpay)* 9. WhatsApp किस provider से?

**Onboarding से जुड़े (3):**
10. "wiring/setup पूरा" का मतलब क्या-क्या? 11. `party_id` या `company_id`? *(मैं company मान रहा हूँ)*
12. Blocked ग्राहक का डेटा कितने समय बाद archive?

**तकनीकी (2):**
13. **M13 की 3 टकराती schema परिभाषाओं में से कौन सी सही?**
14. पुराना + नया दोनों GitHub token **revoke** करना बाक़ी है ⚠️

---

# भाग 6 — session बदलने पर काम कैसे उठाएँ

1. यह फाइल पढ़ो → **भाग 1** का सबसे ऊपर वाला अधूरा काम उठाओ
2. `tips/reviewer-ai/log.md` का आख़िरी **सत्र नोट** पढ़ो — वहाँ लिखा है कौन कहाँ छोड़कर गया
3. `tips/reviewer-ai/CERTIFICATES.md` देखो — **जो वहाँ नहीं है वो verified नहीं**, चाहे GitHub पर हो
4. task फाइलें `tips/coder-ai/tasks/` में हैं (#011–#015 तैयार पड़ी हैं)
5. **रुकना नहीं** — ढाँचा न मिले तो नोट लिखकर अगले हिस्से पर लग जाओ
