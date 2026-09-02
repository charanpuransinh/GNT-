# टास्क #004 — Team A (M01–M04) Frontend को GREEN करना

**प्राथमिकता:** P1 · **रेपो रूट:** `/root/gnt-project/GNT_GITHUB_REPOSITORY`
**लक्ष्य:** Team A frontend के **97 TypeScript errors → 0**
**दायरा:** सिर्फ `frontend/src/` के M01–M04 + root के tsconfig। **Backend की कोई `.ts` फाइल मत छूना।**

तुम्हारा जड़-विश्लेषण (reviewer log में) मैंने पढ़ लिया — **अच्छा काम, सही जगह हाथ रखा।**
नीचे हर नाज़ुक जगह पर **मेरा फ़ैसला** दिया है ताकि तुम्हें अंदाज़ा न लगाना पड़े।

---

## फ़ैसला 1 (सबसे ज़रूरी) — `@` alias: **backend और frontend के tsconfig अलग होंगे**

तुमने बिल्कुल सही पकड़ा कि यह सबसे नाज़ुक फ़ैसला है, और यह भी सही देखा कि
`@/modules/...` दोनों तरफ़ मौजूद है इसलिए एक ही `@` को दोनों पर point करना टकराएगा।

**मैंने जो रास्ता चुना (और क्यों):** `"@/*": ["backend/src/*", "frontend/src/*"]` लिखकर काम
चल तो जाता — TypeScript पहले वाला न मिले तो दूसरा देख लेता। **पर मैं यह नहीं कर रहा,**
क्योंकि इससे backend की एक फाइल frontend की फाइल import कर सकती है और **किसी को पता भी न चले** —
यह master wiring map के HARD BOUNDARY का सीधा उल्लंघन होता। एक line बचाने के लिए
पूरी परत-दर-परत सीमा ढीली करना घाटे का सौदा है।

**करना यह है — 3 नई फाइलें, root `tsconfig.json` की जगह:**

`tsconfig.base.json` (साझा settings, कोई `paths`/`include` नहीं):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

`tsconfig.backend.json`:
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["backend/src/*"] } },
  "include": ["backend/src/**/*.ts"],
  "exclude": ["**/*.test.ts", "**/tests/**",
    "backend/src/modules/m13-automation/ActionRegistry.ts",
    "backend/src/modules/m13-automation/SendEmailAction.ts",
    "backend/src/modules/m13-automation/WorkflowEngine.ts",
    "backend/src/modules/m13-automation/controllers/WebhookController.ts",
    "backend/src/modules/m13-automation/controllers/WorkflowController.ts",
    "backend/src/modules/m13-automation/events/EventSubscriber.ts",
    "backend/src/modules/m13-automation/routes/index.ts",
    "backend/src/modules/m13-automation/services/SchedulerService.ts",
    "source-archives", "source-archives/**", "team-d", "team-d/**"]
}
```
⚠️ **M13 वाली 8 exclude lines और `**/tests/**` ज्यों-के-त्यों रखना** — भले ही वो गलत हैं
(AUDIT-01 की F7)। वजह: अभी उन्हें हटाने से गिनती बदल जाएगी और यह पता ही नहीं चलेगा कि
सुधार तुम्हारे काम से आया या config से। **उन्हें खोलना अलग टास्क (#010) है।**

`tsconfig.frontend.json`:
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": { "baseUrl": ".", "jsx": "react-jsx", "paths": { "@/*": ["frontend/src/*"] } },
  "include": ["frontend/src/**/*.ts", "frontend/src/**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.test.tsx", "**/tests/**"]
}
```

`tsconfig.json` (root — editor/IDE के लिए, कुछ compile नहीं करता):
```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.backend.json" }, { "path": "./tsconfig.frontend.json" }]
}
```

**फिर `frontend/package.json` और `backend/package.json` के `build` script** को अपनी-अपनी
config पर लगा देना (`tsc -p ../tsconfig.frontend.json --noEmit` / `...backend...`) —
अभी दोनों root वाली config चलाते हैं, जो अब खाली है।

**इसके बाद m04 के 9 relative imports (`../../../components/ui`) को `@/components/ui` कर देना** —
अब `@` का मतलब frontend में साफ़ है, इसलिए relative का कोई कारण नहीं बचा।

---

## फ़ैसला 2 — `api-client`: **imports ठीक होंगे, export नहीं**
`frontend/src/core/api-client.ts` में named export (`apiClient`) है। 4 services default import करती हैं।
**`export default` मत जोड़ना** — एक ही चीज़ के दो रास्ते बना देना आगे भ्रम की जड़ बनता है
(कोई `apiClient`, कोई `client`, कोई `api` नाम से import करने लगता है)।
**चारों जगह named import कर दो:** `import { apiClient } from '@/core/api-client';`

## फ़ैसला 3 — lazy routes (6 × TS2322)
पेजों में named export है, `lazy()` को `{ default: … }` चाहिए।
**पेजों में `export default` मत जोड़ना** (वही दो-रास्ते वाली समस्या)। routes फाइल में मैपिंग करो:
```ts
const CompanyProfilePage = lazy(() =>
  import('./pages/CompanyProfilePage').then(m => ({ default: m.CompanyProfilePage }))
);
```
बदलाव एक ही फाइल में सिमट जाएगा, और export शैली एक जैसी रहेगी।

## फ़ैसला 4 — zod v4
`err.errors` → **`err.issues`**. `app.schema.ts(7,15)` वाले call के लिए पहले देखो कि backend के
validators में वही pattern कैसे लिखा है (वो चल रहा है), फिर वही तरीका अपनाओ — अपना नया मत गढ़ो।

## फ़ैसला 5 — TS7006 (21) और TS2345 (13)
**हर जगह असली type लिखो।** `any` से भरना, `as any`, `@ts-ignore`, `@ts-expect-error` —
सब **सख़्त मना** (पकड़े जाने पर टास्क reject; मैं दोबारा गिनता हूँ)।
`TS2345` वाले (`DeploymentSettingsPage`, `CompanyProfilePage`) में पहले पूरी type chain पढ़ो —
`Company | null` बनाम `Partial<Company>` जैसी चीज़ों में असली सवाल यह है कि **वो value कहाँ से आती है**,
type कहाँ बदलनी चाहिए। जल्दबाज़ी में cast मत लगाना।

---

## जो नहीं करना
- ❌ **snake_case वाला बदलाव यहाँ बिल्कुल नहीं** — frontend को API से camelCase ही मिलता है,
  prisma के objects यहाँ आते ही नहीं (तुमने यह ख़ुद दर्ज किया, सही किया)
- ❌ backend की कोई `.ts` फाइल मत छूना (सिर्फ़ tsconfig/package.json वाले बदलाव)
- ❌ M05–M20 का frontend मत छूना
- ❌ `prisma/schema.prisma` मत छूना (LOCKED — #003 में certificate दे चुका हूँ)
- ❌ App shell / router / `main.tsx` **मत बनाना** — वो टास्क #006 है। यहाँ सिर्फ़ type-level काम है

## पास/फेल का टेस्ट (यही अंतिम कसौटी है)
```
npx tsc -p tsconfig.frontend.json --noEmit 2>&1 | grep -E "^frontend/src/modules/m0[1-4]" | wc -l   # → 0
npx tsc -p tsconfig.frontend.json --noEmit 2>&1 | grep -cE "error TS[0-9]+"                          # पूरा frontend
npx tsc -p tsconfig.backend.json  --noEmit 2>&1 | grep -cE "error TS[0-9]+"                          # पूरा backend
```
**तीनों की गिनती रिपोर्ट में देना।** backend वाली गिनती **बढ़नी नहीं चाहिए** —
tsconfig बाँटने से backend टूटा तो नहीं, यह उसी से पता चलेगा।
साथ में यह भी लिखना कि **1386 (पुराना कुल) अब कैसे बँटा** — backend कितने + frontend कितने।

## रिपोर्ट (नए नियम अनुसार — दो जगह)
1. `tips/reviewer-ai/log.md` — तकनीकी: exact commands, exact output, कौन सी फाइलें बदलीं,
   कोई error बचा तो कौन सा और क्यों (**छिपाना नहीं**)
2. `tips/owner-puran-singh/log.md` — आसान हिंदी: क्या समस्या थी, क्या ठीक किया, अब हालत क्या है

**Push:** नियम के मुताबिक `git push origin HEAD:deepseek/work` — पर तुमने बताया कि इस मशीन पर
write access नहीं है। इसलिए **commit करके रुक जाओ और log में लिख दो**; push मैं कर दूँगा।
यह तुम्हारा blocker नहीं है, मैंने मालिक के सामने रख दिया है।

— समीक्षक AI (Claude), 2026-09-02
