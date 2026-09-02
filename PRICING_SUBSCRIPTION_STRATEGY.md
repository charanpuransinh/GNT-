# RAKSHA — Pricing, Subscription & Trust Strategy
**Group:** मा आदिशक्ति | **Brand:** RAKSHA | **Project:** GARUDA NEXTECH (GNT)
**Document Status:** Owner Blueprint — Claude/DeepSeek इसे पढ़कर अपने सुझाव/setup नीचे जोड़ें

---

## उद्देश्य (Purpose)
यह document owner (Charan Puran Singh) की तरफ़ से एक pricing/subscription/trust strategy का blueprint है। इसका मकसद तीन चीज़ों को साथ लेकर चलना है:

1. **नया client-base बनाना** — अभी market में हमारा कोई ग्राहक नहीं है, शुरुआत से बनाना है
2. **Feature-advantage** — हमारे 20 modules (M01–M20) Vyapar, myBillBook, Marg ERP जैसे competitors से ज़्यादा advanced हैं
3. **Trust पहले, Lock बाद में** — किसी भी party का access अचानक/गलत तरीके से रोकना trust तोड़ता है; block/lock का तरीका इंसानी और पारदर्शी होना चाहिए

---

## 1. Market Research — Competitors की Pricing (2026)

| App | Free Tier | Entry Plan | Mid Plan | बड़ा Plan | Billing Model |
|---|---|---|---|---|---|
| **Vyapar** | Mobile app हमेशा फ्री (basic) | ₹3,400/साल (Desktop Silver) | ₹4,000/साल (Desktop+Mobile) | Gold edition | सिर्फ Yearly |
| **myBillBook** | 7-दिन ट्रायल | ₹349–399/महीना (Silver) | Platinum (ज़्यादा users) | Multi-business + CA access | Monthly + Yearly (yearly पर 20–35% discount) |
| **Marg ERP** | कोई फ्री नहीं | ₹8,000–12,000 one-time + AMC ₹2–5k/साल | ₹13,900 (Silver) | ₹25,000+ (Gold, unlimited users) | One-time + अलग AMC |

**मुख्य सीख:**
- myBillBook का मॉडल हमारे इस्तेमाल-केस (GST छोटे व्यापारी) से सबसे मिलता-जुलता है
- Yearly पर discount (20–35%) industry-standard है
- ऊपर के plans में ज़्यादा users/companies/advanced features मिलते हैं — नीचे के plan में सीमित

---

## 2. हमारी रणनीति

### 2.1 Pricing — Penetration Strategy (नए client base के लिए)
नए product को शुरुआत में जानबूझकर सस्ता रखना है ताकि लोग बिना झिझक अपनाएं, base बने, फिर धीरे-धीरे कीमत सामान्य हो।

| Plan | कीमत | किसके लिए | Lock-in |
|---|---|---|---|
| **Founding Member** | ₹199/महीना | पहले 100 clients | Lifetime lock (कभी नहीं बढ़ेगी) |
| **Basic** | ₹299/महीना या ₹2,999/साल | नए/छोटे व्यापारी | — |
| **Pro** | ₹599/महीना या ₹5,999/साल | बढ़ते व्यापारी, multi-user, automation | — |
| **Enterprise** | Custom | बड़े distributor/wholesaler | Custom |

### 2.2 Feature-Advantage को पहले दिखाओ, फिर बेचो
हमारे पास M13 (Smart Automation), M16 (WhatsApp Notification Engine), M20 (International Trade/HSN) जैसे modules हैं जो competitors के पास नहीं हैं।
- Trial में यह advanced features **खुलकर दिखाएं** (लॉक न करें)
- ग्राहक जब असली फ़ायदा महसूस करे, तभी upgrade खुद मांगेगा

### 2.3 Trust-First Block Policy
- Trial खत्म होते ही access पूरी तरह बंद न करें — पहले **15 दिन Read-only mode** (पुराना डेटा दिखे, नया बिल न बने)
- **डेटा कभी न मिटे/गायब हो** — चाहे payment हो या न हो, ग्राहक का बिल/customer डेटा हमेशा सुरक्षित रहे
- Block से पहले WhatsApp पर इंसानी भाषा में मैसेज — धमकी वाली भाषा नहीं

### 2.4 Loyalty & Referral (Client-Base बनाने के लिए)
- पहले 50–100 clients को स्थायी discount (Founding Member) दें
- Referral incentive — एक ग्राहक दूसरा लाए तो दोनों को 1–2 महीने फ्री

---

## 3. System Requirements (Technical — Claude/DeepSeek के लिए)

### 3.1 Company Code System
- Database में company के लिए एक छोटा unique code column (जैसे `GNT01`, `GNT02`...)
- Login में GSTIN (15 अंक) की जगह यही छोटा code इस्तेमाल हो

### 3.2 Trial / Subscription Status
- Company record में `status` field: `trial | active | blocked | expired`
- `trial_expiry_date` field — trial शुरू होने से **6 महीने बाद** (GST quarterly cycle से मेल खाता है)
- Expiry से पहले 15 / 7 / 1 दिन पर WhatsApp reminder (M16 Notification Engine इस्तेमाल करें)
- कोई response/payment न आने पर 7वें महीने अपने-आप block, पर उससे पहले 15 दिन Read-only mode

### 3.3 Plans / Pricing Table (System में flexible रखें)
- हर plan के लिए: नाम, price (monthly/yearly), कौन-कौन से modules/features शामिल — यह सब बदलने लायक (hardcoded नहीं) होना चाहिए
- Founding Member plan का lifetime-lock price अलग से track हो सके

### 3.4 Owner Control Panel
- Owner (मैं) किसी भी company का status कभी भी manually बदल सके — trial→active, active→blocked, blocked→active
- हर company की history/log दिखे (कब trial शुरू हुआ, कब reminder गया, कब block हुआ)

### 3.5 Payment Integration
- Razorpay/PayU जैसा payment gateway M11 (Payment & Communication) module से जोड़ा जाए ताकि customer खुद online renew कर सके

---

## 4. Claude/DeepSeek के लिए Note
यह document एक **strategy blueprint** है, final locked spec नहीं। कृपया:
1. इसे पढ़कर अपने technical सुझाव/comments नीचे "Suggestions" section में जोड़ें (delete न करें, नीचे जोड़ें)
2. Database schema, API design, और implementation plan अपने हिसाब से प्रस्तावित करें
3. जो भी अस्पष्ट लगे, उसे owner से पूछने के लिए `tips/owner-puran-singh/log.md` में सवाल के तौर पर नोट करें

---

## Suggestions (Claude/DeepSeek यहां लिखें)

_(यहाँ से नीचे अपने सुझाव जोड़ें — ऊपर का content न बदलें)_

---

# Suggestions — समीक्षक AI (Claude), 2026-09-02

## 0. एक वाक्य में मेरा फ़ैसला

Subscription को **M01–M20 के अंदर नहीं**, एक अलग **platform परत** में बनाऊँगा
(नया module `m21-subscription`) — क्योंकि यह ग्राहक का डेटा नहीं, **हमारा कारोबार** है।
Access रोकने का काम **20 modules में नहीं, एक ही जगह** (एक middleware) होगा,
और subscription की हालत **तारीखों से गणना** होगी, किसी cron job के भरोसे नहीं।

---

## 1. सबसे बड़ा ढाँचागत फ़ैसला — यह किस परत में बैठेगा

### ❌ M11 (Payment) में क्यों नहीं — यह सबसे ज़रूरी बात है
दस्तावेज़ की **§3.5** कहती है कि payment gateway M11 से जोड़ा जाए। **मैं इससे असहमत हूँ, और वजह गंभीर है:**

M11 का पैसा **M10 (Accounting) के बही-खाते में जाता है** — यह blueprint में लिखा है
(`M10 → M11`, "Approved transaction → accounting service → ledger")।
M11 ग्राहक (दुकानदार) और **उसके अपने customers** के बीच का पैसा है।

Subscription का पैसा दुकानदार से **हमारे पास** आता है।
अगर वो M11 से गुज़रा, तो **हमारी कमाई ग्राहक के P&L में खर्च/आय बनकर दर्ज हो जाएगी** —
उसका balance sheet, GST return, सब गंदा हो जाएगा। यह ऐसी गलती है जो 6 महीने बाद पकड़ में आती है
और तब तक हज़ारों entries खराब कर चुकी होती है।

**मेरा तरीका:** gateway connector **M18 (External Integration)** में — blueprint में वही
"external connector plumbing" का मालिक है — और पैसे का record **`m21` की अपनी tables** में।
ग्राहक के बही-खाते को छुआ ही नहीं जाएगा।

### ❌ M04 (Company Management) में क्यों नहीं
M04 का API **ग्राहक खुद इस्तेमाल करता है** (company profile, branches, users)।
अगर subscription की row भी उसी module में हुई, तो एक गलत route या भूली हुई permission-जाँच से
**ग्राहक अपना ही status `active` कर सकता है।** पैसा वसूलने वाली चीज़ कभी उस दरवाज़े के पीछे नहीं
रखनी चाहिए जिसकी चाबी ग्राहक के पास है।

### ✅ नया module `m21-subscription` (platform layer)
- master wiring map का नियम: blueprint में जो नहीं है वो **DESIGN-EXPANSION / NEEDS APPROVAL** है।
  यह दस्तावेज़ owner blueprint है, इसलिए मैं इसे **approved DESIGN-EXPANSION** मानकर आगे बढ़ रहा हूँ।
- इसका API **दो साफ़ हिस्सों में** बँटेगा: ग्राहक वाला (सिर्फ़ अपना status देखना/renew करना) और
  **owner-only** वाला (`/api/v1/platform/...`, अलग admin scope) — दोनों कभी मिलेंगे नहीं।
- बाकी modules से रिश्ता सिर्फ़ **public contract** से: M02 (login के वक़्त हालत बताना),
  M13 (रोज़ का scheduler), M16 (WhatsApp reminder), M18 (gateway)। किसी की repository को हाथ नहीं।

---

## 2. Database Schema (canonical शैली — snake_case + `@@map`, जैसा बाकी 41 models में है)

```prisma
// ── plan की परिभाषा (कीमत/सुविधाएँ कोड में नहीं, डेटा में — §3.3) ──
model plan_master {
  id                    String   @id @default(uuid()) @db.Uuid
  code                  String   @unique @db.VarChar(20)   // FOUNDING | BASIC | PRO | ENTERPRISE
  name                  String   @db.VarChar(60)
  description           String?
  price_monthly         Decimal? @db.Decimal(10, 2)
  price_yearly          Decimal? @db.Decimal(10, 2)
  currency              String   @default("INR") @db.VarChar(3)
  is_custom             Boolean  @default(false)  // Enterprise = कीमत हाथ से तय
  is_public             Boolean  @default(true)   // Founding: 100 पूरे होने पर false
  price_locked_for_life Boolean  @default(false)  // Founding Member की lifetime lock
  sort_order            Int      @default(0)
  is_active             Boolean  @default(true)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  plan_entitlement      plan_entitlement[]
  company_subscription  company_subscription[]
  @@map("plan_master")
}

// ── किस plan में क्या मिलेगा (key–value, ताकि नया plan बनाने पर कोड न बदलना पड़े) ──
model plan_entitlement {
  id          String      @id @default(uuid()) @db.Uuid
  plan_id     String      @db.Uuid
  key         String      @db.VarChar(60)  // "module:m13" | "limit:users" | "limit:branches" | "feature:whatsapp"
  value       String      @db.VarChar(60)  // "true" | "5" | "unlimited"
  plan_master plan_master @relation(fields: [plan_id], references: [id], onDelete: Cascade)
  @@unique([plan_id, key])
  @@map("plan_entitlement")
}

// ── हर company की मौजूदा हालत (एक company = एक row) ──
model company_subscription {
  id                    String    @id @default(uuid()) @db.Uuid
  company_id            String    @unique @db.Uuid
  plan_id               String    @db.Uuid
  status                String    @default("trial") @db.VarChar(20)
  // trial | active | grace_readonly | blocked | cancelled
  billing_cycle         String    @default("monthly") @db.VarChar(10) // monthly | yearly | custom
  locked_price          Decimal?  @db.Decimal(10, 2)  // कीमत यहीं जमी — plan की कीमत बदलने से पुराने ग्राहक पर असर नहीं
  locked_price_reason   String?   @db.VarChar(60)     // "founding_member_lifetime"
  trial_started_at      DateTime?
  trial_expiry_at       DateTime?
  period_start          DateTime?
  period_end            DateTime?  // "पैसा कब तक चुका है" — असली सच यही है
  grace_until           DateTime?  // 15-दिन read-only खिड़की का अंत (§2.3)
  auto_renew            Boolean   @default(false)
  manual_override_until DateTime? // owner ने हाथ से खोला हो (§3.4)
  override_reason       String?   @db.VarChar(200)
  cancelled_at          DateTime?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  company_master        company_master @relation(fields: [company_id], references: [id], onDelete: Cascade)
  plan_master           plan_master    @relation(fields: [plan_id], references: [id])
  @@index([status])
  @@index([period_end])
  @@index([trial_expiry_at])
  @@map("company_subscription")
}

// ── पूरा इतिहास (§3.4) — इसमें से कुछ कभी delete नहीं होगा ──
model subscription_event {
  id          String   @id @default(uuid()) @db.Uuid
  company_id  String   @db.Uuid
  event_type  String   @db.VarChar(40)  // trial_started | reminder_sent | status_changed | plan_changed | payment_captured | manual_override
  from_status String?  @db.VarChar(20)
  to_status   String?  @db.VarChar(20)
  actor_type  String   @db.VarChar(20)  // system | owner | payment_gateway
  actor_id    String?  @db.Uuid
  channel     String?  @db.VarChar(20)  // whatsapp | email | inapp
  note        String?
  payload     Json?
  created_at  DateTime @default(now())
  @@index([company_id, created_at])
  @@map("subscription_event")
}

// ── हमारा अपना बिल (ग्राहक के invoice से बिल्कुल अलग table) ──
model platform_invoice {
  id              String    @id @default(uuid()) @db.Uuid
  company_id      String    @db.Uuid
  invoice_no      String    @unique @db.VarChar(30)
  plan_id         String?   @db.Uuid
  billing_cycle   String    @db.VarChar(10)
  period_start    DateTime
  period_end      DateTime
  amount_base     Decimal   @db.Decimal(10, 2)
  gst_rate        Decimal   @default(18.00) @db.Decimal(5, 2)
  gst_amount      Decimal   @db.Decimal(10, 2)
  amount_total    Decimal   @db.Decimal(10, 2)
  place_of_supply String?   @db.VarChar(2)   // GST राज्य कोड — IGST/CGST तय करता है
  sac_code        String    @default("997331") @db.VarChar(10) // software as a service
  status          String    @default("issued") @db.VarChar(10) // draft|issued|paid|void
  issued_at       DateTime  @default(now())
  due_at          DateTime?
  paid_at         DateTime?
  @@index([company_id, issued_at])
  @@map("platform_invoice")
}

// ── gateway से आया पैसा ──
model platform_payment {
  id                 String    @id @default(uuid()) @db.Uuid
  company_id         String    @db.Uuid
  invoice_id         String?   @db.Uuid
  gateway            String    @db.VarChar(20)  // razorpay | payu | manual
  gateway_order_id   String?   @db.VarChar(80)
  gateway_payment_id String?   @unique @db.VarChar(80)
  idempotency_key    String    @unique @db.VarChar(120) // एक ही webhook दो बार आए तो दोबारा पैसा न चढ़े
  amount             Decimal   @db.Decimal(10, 2)
  currency           String    @default("INR") @db.VarChar(3)
  status             String    @db.VarChar(20)  // created | captured | failed | refunded
  raw_payload        Json?
  created_at         DateTime  @default(now())
  captured_at        DateTime?
  @@index([company_id])
  @@map("platform_payment")
}

// ── Referral (§2.4) ──
model referral {
  id                  String    @id @default(uuid()) @db.Uuid
  referrer_company_id String    @db.Uuid
  referred_company_id String    @unique @db.Uuid
  code                String    @db.VarChar(20)
  reward_months       Int       @default(1)
  status              String    @default("pending") @db.VarChar(20) // pending|qualified|granted|rejected
  qualified_at        DateTime?
  granted_at          DateTime?
  created_at          DateTime  @default(now())
  @@index([referrer_company_id])
  @@map("referral")
}
```

**साथ में एक छोटा बदलाव (§3.1):** `company_master` में
`code String @unique @db.VarChar(20)` जोड़ना है, और login में GSTIN की जगह वही चलेगा।
यह टास्क #003 में दर्ज की गई **शर्त 1 को बंद कर देता है** (अभी login अस्थायी तौर पर GSTIN माँगता है)।
⚠️ यह बदलाव **तीन जगह एक साथ** होगा: `prisma/schema.prisma`, `database/schema/m04/m04_schema.sql`,
और एक SQL migration — वरना schema और असली database अलग हो जाएंगे।

---

## 3. हालत (status) का असली नियम — यही पूरे सिस्टम की जान है

```
effectiveStatus(sub, now):
  1. manual_override_until > now        → active        (owner ने हाथ से खोला है)
  2. status ∈ {blocked, cancelled}      → वही
  3. paidUntil = period_end ?? trial_expiry_at
  4. paidUntil >= now                   → active (या trial, अगर अभी trial चल रहा है)
  5. now <= paidUntil + 15 दिन          → grace_readonly
  6. वरना                                → blocked
```

**यह गणना हर request पर होगी — सिर्फ़ cron के लिखे हुए status पर भरोसा नहीं।**

**क्यों (यह दस्तावेज़ में नहीं था, पर ज़रूरी है):** अगर हालत सिर्फ़ रोज़ चलने वाली job से बदलती,
तो job एक दिन न चली (server बंद, error, deploy) तो **expired ग्राहक महीनों मुफ़्त चलता रहता** —
और यह किसी को पता भी न चलता। दूसरी तरफ़, job दो बार चल जाती तो किसी का access **ग़लती से बंद**
हो जाता। तारीख़ से गणना करने पर दोनों ख़तरे एक साथ ख़त्म हो जाते हैं।
Cron का काम सिर्फ़ **reminder भेजना और इतिहास लिखना** रह जाता है — पैसे का फ़ैसला नहीं।

---

## 4. Access रोकने का तरीका — 20 modules में नहीं, एक ही जगह

```
request → authMiddleware → tenantMiddleware → subscriptionGuard → module route
```

`subscriptionGuard` एक ही middleware है जो `req.access = { mode, plan, entitlements }` भर देता है:

| हालत | क्या चलेगा |
|---|---|
| **active / trial** | सब कुछ |
| **grace_readonly** (15 दिन) | `GET`/`HEAD` सब चलेंगे (पुराना डेटा दिखेगा), पर `POST/PUT/PATCH/DELETE` पर **402** + साफ़ संदेश। छूट: login, subscription/billing, और **data export** |
| **blocked** | सिर्फ़ login (ताकि संदेश दिख सके), subscription/billing, और **data export** |

**यह एक जगह क्यों:** अगर हर module अपने-आप जाँचता, तो 20 modules × 41 route फाइलें = 
किसी एक जगह भूल होना तय था — और वही एक छेद पूरे pricing को बेकार कर देता।
एक middleware में यह जाँच **या तो सब जगह है, या कहीं नहीं** — भूलने की गुंजाइश ही नहीं बचती।

**Plan की सीमाएँ (users/branches/modules):** दो स्तर पर —
`requireEntitlement('module:m13')` route पर, और `limit:users` जैसी गिनती **service** में
(जहाँ नया user बनता है), क्योंकि सीमा "कितने बने हैं" पर निर्भर करती है, request पर नहीं।

---

## 5. API की रूपरेखा

**ग्राहक के लिए** (`/api/v1/subscription/…`)
- `GET /me` — मेरी हालत, plan, कब तक चलेगा, कितने दिन बचे
- `GET /plans` — सार्वजनिक plans (Founding तभी दिखे जब जगह बची हो)
- `POST /checkout` `{plan_code, cycle}` → gateway order बनाकर लौटाना
- `GET /invoices`, `GET /invoices/:id/pdf` — GST वाला बिल

**सिर्फ़ owner के लिए** (`/api/v1/platform/…`, अलग admin scope — ग्राहक का token यहाँ कभी नहीं चलेगा)
- `GET /companies?status=` — सारी companies एक नज़र में (§3.4 का control panel)
- `POST /companies/:id/status` `{to, reason, until?}` — हाथ से trial↔active↔blocked
- `POST /companies/:id/plan` — plan बदलना / lifetime lock देना
- `GET /companies/:id/events` — पूरा इतिहास
- `CRUD /plans`, `/plans/:id/entitlements` — कीमत/सुविधाएँ बदलना (कोड छुए बिना)

**Webhook** (M18 के ज़रिए): `POST /api/v1/integrations/webhooks/razorpay`
→ signature जाँचो → `platform_payment` लिखो (idempotency key से) → invoice `paid` →
`period_end` आगे बढ़ाओ → `subscription_event` लिखो।
**कभी भी frontend के "payment हो गया" कहने पर भरोसा नहीं** — सिर्फ़ verified webhook पर।

**रोज़ की job** (M13 scheduler → M16 WhatsApp): expiry से **15 / 7 / 1 दिन** पहले reminder,
फिर `grace_readonly`, फिर `blocked` — हर कदम `subscription_event` में दर्ज, और
"आज इस company को यह reminder जा चुका है" की जाँच के साथ (एक ही संदेश दो बार न जाए)।

---

## 6. जहाँ मैंने आपके दस्तावेज़ से हटकर फ़ैसला लिया (6 जगह — हर एक की वजह)

| # | दस्तावेज़ में | मेरा फ़ैसला | वजह |
|---|---|---|---|
| 1 | §3.5 — gateway M11 से जोड़ें | **M18 connector + m21 के अपने records** | M11 का पैसा M10 के बही-खाते में जाता है — हमारी कमाई ग्राहक के P&L/GST में घुस जाती |
| 2 | §3.2 — status: trial/active/blocked/expired | **`grace_readonly` और `cancelled` जोड़े** | §2.3 का "15 दिन read-only" इनके बिना सिस्टम में दर्ज ही नहीं हो सकता था |
| 3 | (नहीं था) | **हालत तारीख़ से गणना, cron से नहीं** | cron एक दिन न चले तो expired ग्राहक मुफ़्त चलता रहता, और किसी को पता न चलता |
| 4 | §3.3 — plans flexible रखें | **key–value entitlements table** | "hardcoded नहीं" इसी से सच होता है — नया plan बनाने पर एक भी लाइन कोड नहीं बदलेगी |
| 5 | §2.3 — डेटा कभी न मिटे | **blocked होने पर भी data export खुला** | "डेटा सुरक्षित है" तब तक अधूरा है जब तक ग्राहक उसे निकाल न सके; भारत में उसका GST डेटा रोकना क़ानूनी झंझट भी बन सकता है |
| 6 | (नहीं था) | **GST 18% + SAC 997331 + place of supply** | भारत में subscription पर GST देना और GST-invoice बनाना अनिवार्य है; बाद में जोड़ने पर पुराने बिल दोबारा बनाने पड़ते |

---

## 7. कब क्या बनेगा (AUDIT-01 की हक़ीक़त के साथ)

⚠️ **ज़रूरी सच:** AUDIT-01 में मापा गया कि अभी **backend चालू ही नहीं होता** (कोई `app.listen` नहीं),
**frontend खुलता ही नहीं**, और M16/M11/M13 के schemas canonical फाइल में हैं ही नहीं।
इसलिए subscription को अभी पूरा बना देना **रेत पर नींव** होगी — बना तो लेंगे, चलाकर देख नहीं पाएंगे।

| Phase | क्या | कब |
|---|---|---|
| **0** | `company_master.code` + login को GSTIN से हटाकर code पर लाना | **अभी हो सकता है** — छोटा है और #003 की शर्त 1 बंद करता है |
| **1** | ऊपर का पूरा schema + plans का seed + `effectiveStatus` + `subscriptionGuard` + ग्राहक वाले GET APIs | #005 (server चालू) + #006 (frontend shell) के बाद |
| **2** | Owner control panel APIs + `subscription_event` + M13 की रोज़ की job + M16 WhatsApp reminder | #008 (M11–M16 schema merge) के बाद |
| **3** | Razorpay (M18) + `platform_invoice`/`platform_payment` + GST बिल PDF + auto-renew | Phase 2 के बाद |
| **4** | Referral + Founding Member की 100 की गिनती + आमदनी के आंकड़े | अंत में |

**Phase 0 अभी क्यों:** login इस वक़्त 15-अंकों का GSTIN माँगता है (टास्क #003 की मजबूरी थी)।
यह अकेला बदलाव उस अस्थायी जुगाड़ को हटा देता है — और आपकी §3.1 यही कहती भी है।

---

## 8. owner से 9 सवाल

पूरी सूची और उनका असर `tips/owner-puran-singh/log.md` में लिखा है (आसान भाषा में)।
संक्षेप में: GST कीमत में शामिल है या ऊपर? · "lifetime lock" की क़ानूनी परिभाषा? ·
trial सच में 6 महीने? · blocked पर export खुला रखें? · एक मालिक की कई companies का बिल एक या अलग? ·
Founding 100 की गिनती signup से या पहली payment से? · Enterprise की कीमत कौन तय करेगा? ·
Razorpay या PayU? · WhatsApp किस provider से?

**अभी कोई कोड नहीं लिखा गया** — यह सिर्फ़ design का प्रस्ताव है। आपके हाँ कहने पर,
और #004 पूरा होने के बाद, मैं Phase 0 का टास्क DeepSeek के फ़ोल्डर में डालूँगा।

— समीक्षक AI (Claude)

---

# परिशिष्ट (Addendum) — "1 महीने का Warning + Auto-Close" पर समीक्षक AI का फ़ैसला
*(owner ने 2026-09-02 को एक bash/sqlite script के रूप में यह विचार भेजा)*

## पहले साफ़ बात: विचार सही है, बर्तन ग़लत है

आपके script में **तीन चीज़ें बिल्कुल सही** पकड़ी गई हैं, और मैं तीनों रख रहा हूँ:
1. **एक timer** जो किसी तारीख़ पर लगता है (`+1 month`)
2. **warning की हालत में सब काम चलता रहे** (`active_with_warning` — काम रोका नहीं)
3. **रोज़ एक जाँच** जो समय पूरा होने पर अगला कदम उठाए (cron)

**पर इसे bash + sqlite के रूप में लगाना नहीं चाहिए।** नीचे हर वजह अलग से:

| # | दिक्कत | असर |
|---|---|---|
| 1 | **`gnt.db` (sqlite) एक दूसरा database बन जाएगा** — असली डेटा PostgreSQL में है (`schema.prisma` का `datasource` यही कहता है), और पूरे repo में sqlite कहीं इस्तेमाल नहीं होता | ऐप Postgres देखकर access देगा, script sqlite में status बदलेगा — **दोनों कभी मेल नहीं खाएंगे।** ग्राहक बंद दिखेगा पर चलता रहेगा (या उल्टा) |
| 2 | **कोई इतिहास दर्ज नहीं** — `UPDATE ... SET status=...` पुरानी हालत मिटा देता है | आपकी अपनी **§3.4** माँगती है कि हर company की पूरी history दिखे (कब trial शुरू, कब reminder गया, कब block हुआ)। इस script के बाद यह बताना नामुमकिन होगा कि किसी को बंद **क्यों** किया गया |
| 3 | **cron ही सच बन जाता है** | job एक दिन न चली (server बंद/deploy/error) → **समय पूरा हो चुका ग्राहक मुफ़्त चलता रहेगा**, किसी को पता भी नहीं चलेगा। इसीलिए मेरे design में हालत **तारीख़ से गणना** होती है, cron सिर्फ़ reminder भेजता है |
| 4 | **सीधे `closed_wiring_failed` — बीच का पड़ाव ही नहीं** | यह आपकी अपनी **§2.3 (Trust-First)** के ख़िलाफ़ है: "trial ख़त्म होते ही access पूरी तरह बंद न करें — पहले 15 दिन Read-only, और block से पहले इंसानी WhatsApp संदेश।" script सीधे बंद कर देता है, न read-only, न कोई संदेश |
| 5 | **`party_id` ग़लत जगह है** | GNT में **party (M05) = आपके ग्राहक का अपना ग्राहक/सप्लायर**। Subscription तो **company (दुकानदार)** की होती है, party की नहीं। (और अभी `party_master` schema में मौजूद ही नहीं है — M05 पूरा खाली है, देखें AUDIT-01 F3) |
| 6 | `sqlite3 "... party_id=$1"` में value सीधे SQL में जुड़ती है | कल यही function किसी API/form से बुलाया गया तो **SQL injection** का रास्ता खुला रहेगा |
| 7 | `date -d "+1 month"` server की timezone से चलेगा | server UTC पर हो और कारोबार Asia/Kolkata पर — तो कुछ ग्राहक **एक दिन पहले** बंद हो जाएंगे |

## जो मैं बना रहा हूँ (वही इरादा, सही तरीके से)

### 1. "1 महीना" कोड में नहीं, **बदलने लायक policy** में
```prisma
model platform_policy {          // owner control panel से बदलने लायक — deploy की ज़रूरत नहीं
  key        String   @id @db.VarChar(60)  // "onboarding_days" | "grace_days" | "reminder_days"
  value      String   @db.VarChar(120)     // "30" | "15" | "15,7,1"
  updated_by String?  @db.Uuid
  updated_at DateTime @updatedAt
  @@map("platform_policy")
}
```
कल "1 महीना" को 45 दिन करना हो तो **एक row बदलेगी**, कोई कोड नहीं।

### 2. "wiring पूरी हुई या नहीं" — यह भी data होगा, कोड नहीं
```prisma
model onboarding_item {
  id           String    @id @default(uuid()) @db.Uuid
  company_id   String    @db.Uuid
  item_key     String    @db.VarChar(60)  // "company_profile" | "gst_setup" | "device_registered" | "first_invoice"
  status       String    @default("pending") @db.VarChar(20) // pending | done | waived
  completed_at DateTime?
  waived_by    String?   @db.Uuid         // owner ने छूट दी हो
  @@unique([company_id, item_key])
  @@map("onboarding_item")
}
```
और `company_subscription` में दो field जुड़ेंगे: `onboarding_status`, `onboarding_deadline_at`।
**"wiring पूरी" का मतलब = इस सूची के सारे ज़रूरी item `done` हैं** — सूची owner बदल सकता है।

### 3. समय का रास्ता (आपका इरादा + आपकी §2.3, दोनों एक साथ)
```
दिन 0      → deadline = आज + onboarding_days (30)। हालत active रहेगी — सब काम चलेगा  ← आपका "active_with_warning"
T-15/7/1   → WhatsApp reminder (M16), हर एक subscription_event में दर्ज (एक ही संदेश दो बार नहीं)
T+0        → grace_readonly (15 दिन): पुराना डेटा दिखेगा, नया बिल नहीं बनेगा            ← §2.3
T+15       → blocked: डेटा सुरक्षित, export फिर भी खुला
कभी भी पूरा → वापस active, deadline हटी, event दर्ज
```
**"closed" शब्द मैं जान-बूझकर नहीं रख रहा** — वो "खाता ख़त्म/डेटा गया" जैसा लगता है।
हालत `blocked` रहेगी और आपकी §2.3 के मुताबिक **डेटा कभी नहीं मिटेगा।**

### 4. रोज़ की job क्या करेगी (और क्या नहीं)
**करेगी:** reminder भेजना, इतिहास लिखना, dashboard के आंकड़े ताज़ा करना।
**नहीं करेगी:** access का फ़ैसला। वो हर request पर तारीख़ से गिना जाएगा — इसलिए job एक हफ़्ता न चले
तब भी हिसाब सही रहेगा, और दो बार चल जाए तब भी किसी का access ग़लती से बंद नहीं होगा।

### 5. आपका command वैसा ही रहेगा, बस नीचे का इंजन बदलेगा
```
POST /api/v1/platform/companies/:id/onboarding-deadline   { days: 30, reason: "..." }
POST /api/v1/platform/companies/:id/onboarding-complete
POST /api/v1/platform/companies/:id/status                { to: "active", until: "...", reason: "..." }
```
यानी आपको वही एक-कमांड वाली आसानी मिलेगी (control panel के बटन या CLI से) —
पर हर कदम **इतिहास में दर्ज**, **एक ही database में**, और **आपकी trust policy का पालन करते हुए।**

— समीक्षक AI (Claude), 2026-09-02
