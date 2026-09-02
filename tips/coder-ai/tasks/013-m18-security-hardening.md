# टास्क #013 — M18 External Integration: Security Hardening 🔴

**प्राथमिकता:** P0 — **Team D में सबसे पहले यही** · **रेपो रूट:** `/root/gnt-project/GNT_GITHUB_REPOSITORY`
**दायरा:** सिर्फ़ `backend/src/modules/m18-external-integration/` + `prisma/schema.prisma` (सिर्फ़ M18 के 3 models जोड़ना) + `backend/src/app.ts` की webhook route वाली line

**यह सबसे पहले क्यों:** M16/M17/M19/M20 अभी app में mount ही नहीं हैं — उन तक कोई request पहुँचती ही नहीं,
इसलिए उनका ख़तरा कल का है। **M18 अकेला mount है** (`app.ts:64`) — इसका छेद **आज खुला है।**

पूरी समीक्षा: `tips/reviewer-ai/AUDIT-02-team-d-m16-m20.md` (File 13 वाला हिस्सा) — पहले वो पढ़ो।

## Step 1 — M18 के 3 models canonical schema में जोड़ो
Source of truth: **`team-d/M18-External-Integration/database/m18-schema.prisma`**
(`integration_config`, `api_key_registry`, `webhook_log` — तीनों पहले से सही Prisma रूप में लिखे हैं)
- ज्यों-के-त्यों उठाकर `prisma/schema.prisma` के अंत में जोड़ो, `@@map` सहित
- **अपने मन से कोई column मत जोड़ना/हटाना**
- `generator`/`datasource` block और बाक़ी models **छूना मना** (#003 का LOCK अब भी लागू)
- फिर `npx prisma validate` + `generate` — दोनों green होने पर ही आगे बढ़ना

## Step 2 — 🔴 twilio वाला auth-bypass हटाओ
`services/gateway.service.ts:294-297` में यह है:
```ts
if (p.includes('twilio')) { return true; }   // ← कोई भी जाली webhook "valid" मान लिया जाएगा
```
`provider` URL से आता है — यानी `/webhooks/twilio` पर कोई भी कुछ भी भेज सकता है।
**हल:** Twilio का असली नियम लगाओ — `X-Twilio-Signature` = base64( HMAC-SHA1( authToken, fullUrl + sorted(POST params) ) )।
**अगर Twilio का असली नियम ठीक से लागू नहीं कर पा रहे, तो `return false` कर दो** (मना कर दो) —
`return true` किसी हाल में नहीं रहेगा।

## Step 3 — 🔴 secret न हो तो मना करो (default-deny)
`services/webhook.service.ts:54` अभी: `if (cfg.webhook_secret) { …जाँचो… }`
यानी secret न हो तो **बिना जाँच स्वीकार**। इसे उल्टा करो: secret न मिले → साफ़ error, webhook अस्वीकार।

## Step 4 — 🔴 असली raw body इस्तेमाल करो
`controllers/webhook.controller.ts:19` अभी `JSON.stringify(req.body)` करता है — यह **मूल bytes नहीं** है,
इसलिए किसी भी असली gateway का signature कभी मैच नहीं करेगा।
**हल:** `app.ts` में सिर्फ़ webhook route के लिए raw body रखो, जैसे:
```ts
app.use('/api/v1/integrations/webhooks', express.raw({ type: '*/*', limit: '2mb' }));
```
(या `express.json({ verify: (req,_res,buf) => { (req as any).rawBody = buf.toString('utf8'); } })`)
और controller उसी raw string को आगे भेजे। **JSON parse बाद में, signature जाँच पहले।**

## Step 5 — Stripe और तुलना ठीक करो
- Stripe: header `t=…,v1=…` है; signed payload **`${t}.${rawBody}`** होता है; और `t` की उम्र
  (मान लो 5 मिनट) जाँचो — वरना पुराना webhook दोबारा चलाया जा सकता है (replay)
- हर तुलना **constant-time** हो। `crypto.timingSafeEqual` लंबाई अलग होने पर **exception फेंकता है** —
  पहले `length` मिलाओ, बराबर न हो तो सीधे `false`

## Step 6 — जवाब का code सही करो
`webhook.controller.ts:29-31` अभी हर हाल में `200` लौटाता है (comment: "avoid retries")।
**सही:** स्वीकार होने पर `200`; signature ग़लत → `401`; बेकार payload → `400`;
हमारी अपनी गड़बड़ → `500` (ताकि gateway दोबारा भेजे)।

## Step 7 — एक ही webhook दो बार न चले
gateway का event id (Razorpay `x-razorpay-event-id`, Stripe `id`) `webhook_log` में unique रखो;
पहले से मौजूद हो तो दोबारा process मत करो, सीधे `200` लौटा दो।

## जो नहीं करना
- ❌ बाक़ी modules की कोई फाइल मत छूना (M16/M17/M19/M20 के अपने task अलग हैं)
- ❌ `as any` / `@ts-ignore` से error दबाना — **सख़्त मना**
- ❌ मौजूदा 45 models में से किसी का field नाम/type बदलना
- ❌ नया npm package install मत करना (`crypto` Node में पहले से है)

## पास/फेल
```
npx prisma validate --schema prisma/schema.prisma                                    # valid
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -c "m18-external-integration"  # घटे, बढ़े नहीं
grep -rn "return true" backend/src/modules/m18-external-integration/services/gateway.service.ts  # कोई बिना-शर्त true नहीं
```
साथ में: पूरे backend की error गिनती (बढ़नी नहीं चाहिए)।

**रिपोर्ट दो जगह:** `tips/reviewer-ai/log.md` (तकनीकी) + `tips/owner-puran-singh/log.md` (आसान हिंदी)।
**Push:** commit करके रुक जाओ, push मैं करूँगा।

— समीक्षक AI (Claude), 2026-09-02
