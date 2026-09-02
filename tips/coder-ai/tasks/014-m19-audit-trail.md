# टास्क #014 — M19: असली audit trail बनाना 🔴

**प्राथमिकता:** P0 · **दायरा:** `m19-production-monitoring/` + `common/logging/audit-logger.ts` + `prisma/schema.prisma` (M19 के 4 models) + `app.ts` mount
पूरी समीक्षा: `AUDIT-02-team-d-m16-m20.md` → **File 14**

## असली समस्या (यह पहले समझो)
अभी **दो अधूरे सिस्टम हैं जो आपस में जुड़े ही नहीं:**
- `common/logging/audit-logger.ts` — जिसे M01/M02/M03/M04 इस्तेमाल करते हैं — सिर्फ़
  `console.info(...)` करता है। **कहीं save नहीं होता।** restart पर सब ख़त्म।
- M19 का `audit.repository.ts` — सही ढंग से `auditLog` में लिखता है (company/user/action/
  before/after/IP/user-agent) — **पर वो table schema में है ही नहीं और M19 mount भी नहीं है।**

## Step 1 — 4 models जोड़ो
Source: `team-d/M19-Production-Monitoring/database/schema.prisma`
(`AuditLog`, `LoginHistory`, `SecurityEvent`, `SystemHealth` — PascalCase नाम + `@@map` snake_case,
यही कोड की उम्मीद से मेल खाता है)। ज्यों-के-त्यों उठाओ, कुछ जोड़ो-हटाओ मत।

## Step 2 — दोनों सिस्टम जोड़ो (यह टास्क का दिल है)
`common/logging/audit-logger.ts` को M19 की audit service तक पहुँचाओ, ताकि M01–M04 का
मौजूदा `auditLogger.log(...)` अब सच में **database में** लिखे।
**शर्तें:**
- `console.info` वाला रास्ता **हटाना नहीं** — दोनों रहें (log भी, DB भी)
- audit लिखने में गड़बड़ हो तो **असली काम रुकना नहीं चाहिए** (audit failure ≠ business failure) —
  पर वो चूक ख़ुद कहीं दर्ज हो
- हर entry में `company_id`, `user_id`, `ip_address`, `action` **अनिवार्य** — जहाँ ये उपलब्ध नहीं,
  वहाँ पहले middleware से लाओ, `unknown` भरकर काम मत चलाओ
- M01–M04 की मौजूदा `auditLogger.log()` कॉल की **लिखावट मत बदलो** (सिर्फ़ अंदर का काम बदलेगा)

## Step 3 — trail को छेड़छाड़ से बचाओ
`audit_log` अभी साधारण table है — कोई भी UPDATE/DELETE कर सकता है।
इस टास्क में करो: (क) कोड में कहीं भी audit पर `update`/`delete` **न हो**,
(ख) एक SQL migration फाइल बनाओ जो app वाले DB user से `UPDATE, DELETE` का अधिकार छीन ले
(`REVOKE UPDATE, DELETE ON audit_log FROM <app_user>;`) — और log में लिख देना कि यह migration
कब चलाना है। (चलाना मत — वो तैनाती का काम है।)

## Step 4 — mount
`app.use('/api/v1/monitoring', securityRouter);` (M19 का router `index.ts` से)

## जो नहीं करना
❌ `as any`/`@ts-ignore` · ❌ दूसरे modules की business logic बदलना
❌ audit entry में पासवर्ड/token/OTP जैसा कुछ लिखना (before/after में भी नहीं — छान कर हटाओ)

## पास/फेल
```
npx prisma validate --schema prisma/schema.prisma
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -c "m19-production-monitoring"   # → 0
```
+ एक छोटा test: कोई एक क्रिया करने पर `audit_log` में row बनती है — उसका सबूत log में दो।
रिपोर्ट दोनों जगह; commit करके रुकना।
— समीक्षक AI (Claude)
