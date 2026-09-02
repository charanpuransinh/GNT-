# टास्क #011 — M16 Notification Engine: models + gateway binding

**प्राथमिकता:** P0 (Team D में #013 के बाद दूसरा) · **दायरा:** `backend/src/modules/m16-notification/` + `prisma/schema.prisma` (सिर्फ़ M16 के 2 models) + `app.ts` में M16 का mount
पूरी समीक्षा: `tips/reviewer-ai/AUDIT-02-team-d-m16-m20.md` → **File 11**

**यह क्यों ज़रूरी:** pricing/subscription के सारे WhatsApp reminder (15/7/1 दिन) इसी पर टिके हैं।
आज M16 **एक भी संदेश नहीं भेज सकता**।

## Step 1 — 2 models जोड़ो
Source: `team-d/M16-Notification-Engine/database/notification_master.sql` + `notification_delivery_log.sql`
⚠️ **नाम का ध्यान:** कोड `prisma.notificationMaster` / `prisma.notificationDeliveryLog` (camelCase) बुलाता है,
इसलिए Prisma model का नाम **`NotificationMaster`** / **`NotificationDeliveryLog`** रखो और नीचे
`@@map("notification_master")` / `@@map("notification_delivery_log")` लगाओ — तभी दोनों मिलेंगे।
(यही तरीक़ा `team-d/M19-.../schema.prisma` में पहले से इस्तेमाल हुआ है — वहाँ से देख लो।)

## Step 2 — M18 gateway से असली binding
तीनों channel (`whatsapp/sms/email.service.ts`) अभी जान-बूझकर `throw` करते हैं
(*"M18 gateway adapter is not bound"*). यह fail-closed सोच **सही थी** — इसे हटाना नहीं,
**पूरा करना** है: M18 का `GatewayService` constructor से लो और उसी से भेजो।
⚠️ M18 की **internal service सीधे import मत करना** — `m18-external-integration/index.ts`
(public contract) से लो। अगर वहाँ export नहीं है, तो पहले वहाँ export जोड़ो।
अगर कोई active provider configured न हो, तब भी **fail-closed ही रहे** (चुपचाप गिराना मना)।

## Step 3 — 🟠 `to:` में फ़ोन नंबर जाए, userId नहीं
`whatsapp.service.ts:15` अभी `to: payload.userId` भेजता है (comment ख़ुद कहता है कि M05 से फ़ोन चाहिए)।
**M05 अभी पूरी तरह खाली है** — इसलिए अभी यह मत मान लेना कि M05 से मिल जाएगा।
अभी करो: notification भेजने वाला ही recipient का असली पता (`to_address`) दे, और M16 उसे
`notification_master` में सहेजे। **अंदाज़े से userId को फ़ोन मत मानना।** अगर पता न मिले → fail-closed।

## Step 4 — app.ts में mount
`app.use('/api/v1/notifications', notificationRouter);` — frontend पहले से यही path बुलाता है
(AUDIT-01 F11)। M16 का router `index.ts` से लेना।

## जो नहीं करना
❌ दूसरे modules की फाइलें · ❌ `as any`/`@ts-ignore` · ❌ मौजूदा models के field बदलना
❌ कोई नया npm package · ❌ चुपचाप fail होना (हमेशा delivery log में दर्ज हो)

## पास/फेल
```
npx prisma validate --schema prisma/schema.prisma
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -c "m16-notification"   # → 0
```
रिपोर्ट दोनों जगह; commit करके रुकना, push मैं करूँगा।
— समीक्षक AI (Claude)
