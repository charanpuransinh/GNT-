# टास्क #009 — Multi-tenant सुरक्षा: एक कंपनी का डेटा दूसरी को न दिखे 🔴

**प्राथमिकता:** **P0 — सुरक्षा** · **रेपो रूट:** `/root/gnt-project/GNT_GITHUB_REPOSITORY`
**दायरा:** `common/middleware/`, `app.ts`, और सभी modules के controllers/routes

> ⚠️ यह टास्क बाक़ी सबसे अलग है। यहाँ की एक गलती **एक ग्राहक का डेटा दूसरे ग्राहक को दिखा देती है** —
> GST वाले कारोबार में यह सबसे भारी नुक़सान है, और भरोसा एक बार टूटे तो वापस नहीं आता।
> इसलिए यहाँ **रफ़्तार से ज़्यादा सावधानी** चाहिए।

---

## 🔴 असली समस्या — मैंने नाप कर देखी है

### समस्या 1: कंपनी की पहचान **ग्राहक के भेजे header पर** टिकी है

`common/middleware/tenant-middleware.ts:4`
```ts
const companyId = (req as any).user?.companyId || req.header('x-company-id');
//                                              ↑↑ यहीं छेद है
```

**इसका सीधा मतलब:** जिस request में token से कंपनी नहीं मिली, वो बस
`x-company-id: <किसी और कंपनी का id>` भेजकर **उस कंपनी का पूरा डेटा** पढ़/बदल सकती है।

और यह अकेली जगह नहीं — **पूरे repo में 75 जगह** यही तरीक़ा है:
```ts
req.body.company_id || req.headers['x-company-id']   // m07, m18, m04 … सब जगह
```

**नियम जो अब पक्का होगा:** कंपनी की पहचान **सिर्फ़ और सिर्फ़ verified token** से आएगी।
`x-company-id` और `body.company_id` पर **कभी भरोसा नहीं** — वो client के भेजे हुए हैं,
और client झूठ बोल सकता है।

### समस्या 2: 41 में से सिर्फ़ 5 routes पर auth, 2 पर tenant

बाक़ी 36 route फाइलें **खुली पड़ी हैं** — बिना login के भी पहुँचा जा सकता है
(जो modules mount हैं, उन पर यह आज सच में खुला है)।

---

## Step 1 — `tenant-middleware` से छेद बंद करो

```ts
// सिर्फ़ verified token से — कोई header/body fallback नहीं
const companyId = (req as any).user?.companyId;
if (!companyId) return res.status(403).json({ success: false, error: 'FORBIDDEN_NO_TENANT' });
```
**`x-company-id` वाली line पूरी तरह हटा दो।** `branchId` के साथ भी यही — token से ही।

## Step 2 — हर request पर auth+tenant, एक ही जगह से

`app.ts` में module routes चढ़ने से **पहले** एक ही जगह लगाओ:
```
/api/v1/* → auditContext → authMiddleware → tenantMiddleware → module routes
```
**छूट सिर्फ़ इन्हें (सूची यहीं लिखी रहेगी, इससे बाहर कुछ नहीं):**
- `/api/v1/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/otp/*`
- `/api/v1/integrations/webhooks/*` (बाहरी gateway — उसकी अपनी signature-जाँच है, #013)
- `/healthz`, `/readyz`

**यह एक जगह क्यों:** 41 फाइलों में अलग-अलग लगाने पर एक जगह भूलना तय है — और वही एक छेद
पूरी सुरक्षा बेकार कर देता है। एक जगह होने पर यह **या तो सब जगह है, या कहीं नहीं**।

## Step 3 — controllers से `x-company-id` वाला तरीक़ा हटाओ (75 जगह)

हर जगह यह:
```ts
const company_id = req.body.company_id || req.headers['x-company-id'];   // ❌
```
इससे बदलो:
```ts
const company_id = req.tenant.companyId;                                  // ✅
```
`req.tenant` अब हर सुरक्षित route पर पक्का मौजूद रहेगा (Step 2 की वजह से)।

⚠️ **सावधानी:** `company_id` को **request body से हटाना ही है** — अगर वो body में रहा,
तो कोई भी उसे बदलकर भेज सकता है। Zod validators में से भी `company_id` निकाल दो
(जहाँ वो client से आ रहा था)।

## Step 4 — `express.d.ts` का झूठ ठीक करो

अभी `req.tenant` **required** घोषित है (टास्क #003 की शर्त 2) जबकि middleware हर जगह नहीं था।
Step 2 के बाद वो सच हो जाएगा — पर उसे **सही जगह** ले जाओ:
`m04-company-management/types/express.d.ts` → **`common/types/express.d.ts`**
(यह global declaration है, एक module के अंदर नहीं होनी चाहिए — शर्त 3)।

## Step 5 — repository की परत पर दूसरा ताला (सबसे ज़रूरी सुरक्षा-कवच)

middleware भूलना इंसानी गलती है। इसलिए **आख़िरी बचाव** repository में हो:
हर उस query में जो `company_id` वाली table पर चलती है, `where: { company_id }` **अनिवार्य** हो।

इस टास्क में इतना करो: एक छोटी जाँच-script लिखो
(`tools/check-tenant-scope.mjs`) जो सारे repository फाइलों में
`findMany`/`findFirst`/`updateMany`/`deleteMany` ढूँढे और बताए **किनमें `company_id` नहीं है**।
उसकी पूरी सूची log में दो — **ठीक अगले टास्क में करेंगे**, यहाँ सिर्फ़ गिनती चाहिए।

---

## जो नहीं करना
- ❌ `x-company-id` को "बस अभी के लिए" रहने देना — यही पूरा छेद है
- ❌ किसी route को छूट-सूची में जोड़ना जो ऊपर लिखी नहीं है (जोड़ना ही पड़े तो पहले पूछो)
- ❌ `as any` से `req.tenant` निकालना — typing Step 4 में सही हो रही है
- ❌ business logic बदलना

## पास/फेल
```
grep -rn "x-company-id" backend/src --include=*.ts | wc -l      # → 0 (या सिर्फ़ webhook वाली जगह)
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -cE "error TS"   # बढ़े नहीं
npx tsx --tsconfig tsconfig.backend.json backend/src/server.ts   # चले
```
+ ये तीन curl करके status दो (**यही असली सबूत है**):
```
curl -i /api/v1/company                                  # → 401 (बिना token)
curl -i -H "x-company-id: <कोई भी id>" /api/v1/company    # → 401  ⬅ छेद बंद होने का सबूत
curl -i /api/v1/auth/login -d '{}'                       # → 400/401, 401-सिर्फ़-auth नहीं (छूट काम कर रही)
```
+ Step 5 वाली सूची: कितनी queries में `company_id` नहीं मिला।

## रिपोर्ट
दोनों जगह + सत्र नोट। **यह सुरक्षा का टास्क है — जो न कर पाओ वो साफ़ लिखना, छिपाना नहीं।**

— समीक्षक AI (Claude), 2026-09-02
