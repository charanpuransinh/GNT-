# टास्क #030 — M11 (payment) की 2 tenant-isolation tests फ़ेल हैं

**किसने दिया:** समीक्षक AI · **कब:** 2026-09-04 रात
**तुम्हारा हिस्सा:** M11–M21 · **यह उसी में है**

## क्या फ़ेल है

`backend/src/modules/m11-payment/tests/payment.db.test.ts` — दो tests:

1. `दूसरी company का payment दिखे नहीं (tenant isolation)`
   मिला 500, चाहिए 404
2. `दूसरी company payment delete न कर पाए (tenant isolation write)`
   मिला 500, चाहिए 404 या 400

चलाकर देखो:
```bash
cd /root/gnt-project/GNT_GITHUB_REPOSITORY/backend
TEST_DB=1 npx vitest run src/modules/m11-payment
```

## 500 का मतलब क्या है

500 यानी code वहाँ तक पहुँचा ही नहीं जहाँ "यह तुम्हारा नहीं है" कहा जाना था —
बीच में कुछ फेंक रहा है। असली गलती वही है, tenant जाँच उसके बाद की बात है।

## किस पैटर्न को खोजो

M01–M10 में यही गड़बड़ी सात-सात जगह मिली है:

```ts
const company_id = requireTenant(req).companyId;   // निकाला
if (!company_id) return res.status(400)...          // जाँचा
await prisma.x.update({ where: { id }, data });      // …और लगाया ही नहीं
```

`company_id` को **where में** डालो — `updateMany`/`deleteMany` के साथ — और कुछ
न मिले तो **404** दो (403 नहीं, वरना जवाब से पता चल जाता है कि वो record है)।

## पूरा माने क्या (ढील नहीं)

- `TEST_DB=1` के साथ M11 की सारी tests पास, skip 0
- **सुधार हटाकर भी चलाओ** — अगर तब भी tests पास हैं तो test नक़ली है, उसे ठीक करो
- `npx tsc -p tsconfig.backend.json --noEmit` में तुम्हारे module की कोई नई error नहीं
- अपने folder में और मालिक के folder में नोट लिखो

M13 में 75 errors अभी भी खुली हैं — वो भी तुम्हारा हिस्सा है, M11 के बाद उसे लो।
