# टास्क #012 — M17 Reporting: models + सीमा-उल्लंघन ठीक करना

**प्राथमिकता:** P1 (Team D में **आख़िर में** — यह सबसे ज़्यादा दूसरों पर निर्भर है)
**दायरा:** `m17-reporting/` + `prisma/schema.prisma` (M17 के 2 models) + जिन modules के `index.ts` खाली हैं उनमें export जोड़ना
पूरी समीक्षा: `AUDIT-02-team-d-m16-m20.md` → **File 12**

**पहले एक अच्छी बात:** M17 का PDF/Excel export **असली और पूरा लिखा हुआ है**
(`report.generator.ts`, 458 lines, pdfkit + exceljs, छहों रिपोर्ट के renderer)। वहाँ कुछ बनाना नहीं है —
उसे सिर्फ़ **चलने लायक** बनाना है।

## Step 1 — 2 models जोड़ो
Source: `team-d/M17-Reporting/database/report_config.sql` + `report_template.sql`
कोड `prisma.reportConfig` / `prisma.reportTemplate` (camelCase) बुलाता है → model नाम
`ReportConfig` / `ReportTemplate` + `@@map("report_config")` / `@@map("report_template")`।

## Step 2 — 🔴 blueprint की सीमा का उल्लंघन ठीक करो (यह टास्क का असली काम)
`routes/report.routes.ts:13-18` — M17 सीधे **6 modules की internal services** import करता है:
```ts
import { InventoryService } from '../../m06-inventory/services/inventory.service';   // m07, m08, m09, m10, m12 भी
```
Master wiring map: *FORBIDDEN — Module A → Module B internal file*.
**सही रास्ता:** हर module के `index.ts` (public contract) से import करो।
⚠️ **रुकावट:** M08, M09, M10 के `index.ts` अभी खाली stubs हैं। इसलिए:
- पहले उन तीनों के `index.ts` में **सिर्फ़ वही service export करो जो M17 को चाहिए**
  (पूरा module मत खोलना — **repository कभी export मत करना**)
- फिर M17 में import उन्हीं से करो

## Step 3 — 🟠 M17 अपनी repository बाहर न खोले
`m17-reporting/index.ts` से `ReportRepository` और `ReportQueryBuilder` (`report.internal`) के
export **हटाओ** — blueprint में दूसरे module की repository तक पहुँच forbidden है।
अगर कोई इन्हें इस्तेमाल कर रहा हो तो पहले जाँच लो और log में बताना।

## Step 4 — 4 टूटे imports ठीक करो + mount
`app.use('/api/v1/reports', reportRoutes);` — frontend पहले से यही path बुलाता है।

## जो नहीं करना
❌ report.generator की PDF/Excel logic बदलना (वो सही है — सिर्फ़ चलने लायक बनाओ)
❌ `as any`/`@ts-ignore` · ❌ M06–M12 की **business logic** बदलना (सिर्फ़ index.ts में export जोड़ना है)
❌ किसी भी module की repository public करना

## पास/फेल
```
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -c "m17-reporting"   # → 0
grep -rn "modules/m0[6-9]\|modules/m1[02]" backend/src/modules/m17-reporting/  # सिर्फ़ index.ts वाले imports दिखें
```
रिपोर्ट दोनों जगह; commit करके रुकना।
— समीक्षक AI (Claude)
