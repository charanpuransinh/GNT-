# टास्क #016 — M06–M10 (Class B) को GREEN करके ऐप से जोड़ना

**प्राथमिकता:** P1 · **रेपो रूट:** `/root/gnt-project/GNT_GITHUB_REPOSITORY`
**दायरा:** `backend/src/modules/m06…m10` + `module-registry.ts` + हर module का `index.ts`

**कुल बचे errors: 62** — पूरे repo में सबसे "सस्ता" हिस्सा, क्योंकि इनके सारे tables
canonical schema में **पहले से मौजूद हैं** (M11–M15 की तरह गायब नहीं)।

| Module | errors | अभी mount? |
|---|---|---|
| M06 Inventory | 12 | ❌ |
| M07 Purchase | 23 | ❌ composition चाहिए |
| M08 Sales | 19 | ✅ चढ़ा है |
| M09 GST | 2 | ❌ |
| M10 Accounting | 6 | ❌ |

**errors का सबसे बड़ा हिस्सा एक ही तरह का है:** `TS2345` (46 में से) — यानी function को
जो चीज़ दी जा रही है और जो वो माँगता है, दोनों का आकार मेल नहीं खाता।
**हर एक की असली type पढ़कर ठीक करना है** — `as any` से दबाना **सख़्त मना**।

---

## Step 1 — पाँचों के errors 0 करो (एक-एक module, क्रम से)

**क्रम:** M09 (2) → M10 (6) → M06 (12) → M08 (19) → M07 (23)
*(सबसे छोटे से शुरू — जल्दी हरा दिखेगा और तरीका पकड़ में आएगा)*

हर module के बाद उसका count log में लिखो।

## Step 2 — जिनके `index.ts` खाली हैं, उनका public contract बनाओ

M07, M08, M09, M10 के `index.ts` अभी सिर्फ़ एक comment हैं
(`// Public module exports are defined here.`)। हर एक में **सिर्फ़ वही चीज़ें** export करो
जो दूसरे modules को सच में चाहिए:

- ✅ services (जैसे `SalesService`, `GSTService`)
- ✅ types / validators
- ✅ routes (mount के लिए)
- ❌ **repositories कभी नहीं** — यह blueprint में साफ़ मना है
  *(M06 और M17 में यह गलती पहले से है; M06 का `index.ts` भी ठीक करो — तीनों repository export हटाओ,
  और अगर कोई उन्हें इस्तेमाल कर रहा हो तो log में बताओ, ख़ुद मत बदलना)*

## Step 3 — M07 का router ठीक से बनाओ

`purchase.routes.ts` में `createPurchaseRouter(controller, poController)` एक **factory** है
(पहले वहाँ टूटा `export default router` था, मैंने हटा दिया था)।
M18 की तरह इसकी composition `module-registry.ts` के `load()` में लिखो —
controller/service/repository बनाकर factory को दो। **M18 का `load()` देखकर वही तरीक़ा अपनाओ।**

## Step 4 — पाँचों को mount करो

`module-registry.ts` में इनकी lines `mounted: false` → `true` करो और `load()` भरो:

| Module | path | ध्यान |
|---|---|---|
| M06 | `/api/v1/inventory` | frontend पहले से यही बुलाता है |
| M07 | `/api/v1/purchase` | Step 3 वाली composition |
| M09 | `/api/v1/gst` | frontend यही बुलाता है |
| M10 | `/api/v1/accounting` | frontend यही बुलाता है |

**⚠️ नियम:** किसी module को तभी `mounted: true` करना जब उसका **tsc 0** हो चुका हो।
वरना ऐप चलते वक़्त गिरेगा — और registry का पूरा मक़सद यही है कि सच लिखा हो।

## Step 5 — चलाकर देखो (यह सबसे ज़रूरी step है)

```
npx tsx --tsconfig tsconfig.backend.json backend/src/server.ts
```
startup पर जो लाइन आती है (`modules — चढ़े: X | गिरे: Y | बाक़ी: Z`) उसे **ज्यों-का-त्यों**
log में paste करो। अभी 9 चढ़ते हैं — इसके बाद **13** चढ़ने चाहिए।
फिर हर नए path पर `curl` करके status code भी दे दो:
```
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/v1/inventory
```
(401 आना अच्छी बात है — इसका मतलब route चढ़ा और सुरक्षा-जाँच चली।)

---

## जो नहीं करना
- ❌ किसी भी module की **repository public export** मत करना
- ❌ `as any` / `@ts-ignore` / `@ts-expect-error`
- ❌ business logic बदलना — सिर्फ़ type-level गड़बड़ें ठीक करनी हैं
- ❌ M11–M15 को छूना (वो #008 में है)
- ❌ `prisma/schema.prisma` छूना — **इन पाँचों के सारे models पहले से मौजूद हैं**।
  अगर कोई सच में गायब लगे तो **रुककर log में लिखो**, ख़ुद मत जोड़ो

## पास/फेल
```
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -cE "modules/m0[6-9]|modules/m10"   # → 0
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -cE "error TS"                      # कुल घटे
```
+ Step 5 वाला startup output और curl के status codes।

## रिपोर्ट
दोनों जगह + सत्र नोट। हर module अलग commit।

— समीक्षक AI (Claude), 2026-09-02
