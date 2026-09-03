# टास्क #024 — M01–M05 के बचे हुए काम (लगातार, बिना रुके)

**दिया:** समीक्षक AI (Claude) · **तारीख़:** 2026-09-03 शाम
**किसके लिए:** कोडर AI (DeepSeek)
**मालिक का आदेश (आज, सबसे ऊपर):** *"आज रात भर nonstop काम करो, रुकना नहीं। जितने भी tasks
pending हैं वो लगातार एक के बाद एक पूरा करो।"* — इसलिए **रात-9-से-6 वाला पुराना नियम आज लागू नहीं**;
अभी से चालू, बिना रुके।

---

## 0) काम करने के नियम (आज के, पक्के)

1. **कभी खाली मत बैठो।** एक हिस्सा (A → B → C → …) ख़त्म होते ही **अगला ख़ुद उठा लो** — मेरी मुहर
   का इंतज़ार मत करो। मुहर बाद में लगेगी, काम रुकेगा नहीं।
2. **permission के लिए मत रुको।** auto mode में जो सुरक्षित है (फाइल पढ़ना/लिखना, tsc, prisma
   validate, npm test, git add/commit) वो ख़ुद कर लो। **`git push` कभी नहीं** — push सिर्फ़ मैं करता हूँ।
3. **अटक जाओ तो तुरंत ख़बर करो — यह सबसे ज़रूरी नया नियम है:**
   ```bash
   /root/gnt-project/tools/notify.sh --tag "DeepSeek 🚨" "अटक गया: <क्या हुआ> · <कौन सी फाइल> · <मुझे क्या चाहिए>"
   ```
   Telegram चालू है (आज जाँचा — ✅ Sent). ख़बर भेजने के बाद **रुको मत** — उस हिस्से को
   `DEEPSEEK_LOG.md` में "अटका" लिखकर **अगले हिस्से पर चले जाओ**।
4. हर हिस्सा ख़त्म होने पर: `DEEPSEEK_LOG.md` में छोटा नोट + `git commit` + `tools/notify.sh` से एक लाइन।
5. **मेरी फाइलें मत छुओ:** `tips/reviewer-ai/**`, `tips/owner-puran-singh/STATUS.md`,
   `docs/REVIEWER-AI-GUIDE.md`, `NIGHT-QUEUE.md`।
6. **कोई error छिपाना नहीं** — न `as any`, न tsconfig में `exclude` जोड़ना, न `@ts-ignore`।
   पहले वाले errors की गिनती बढ़नी नहीं चाहिए (backend 563 / frontend 286 — यही baseline है)।

---

## हिस्सा A — M05 का बचा हुआ काम (सबसे ऊपर, Class B का दरवाज़ा)

- [ ] A1: `api-contracts/v1/M05-party.contract.yaml` बनाओ — असली code से मिलाकर
      (routes/party.routes.ts + validators के हिसाब से; काल्पनिक field मत लिखो)
- [ ] A2: `backend/src/modules/m05-party-management/index.ts` — public contract
      (types + service interface export; **repositories कभी export मत करो** — blueprint में मना है)
- [ ] A3: M05 के tests: `party.service` (outstanding/credit-limit/aging के हिसाब) +
      routes का एक supertest — auth व tenant दोनों की जाँच के साथ
- [ ] A4: frontend के 3 पेज अभी rough हैं — form validation + error/loading हालत जोड़ो
      (सुंदरता बाद में; काम करना ज़रूरी है)

## हिस्सा B — M04 Company Management (CERT-003 की शर्त 2 और 3)

- [ ] B1: `express.d.ts` में `req.tenant` अभी **required** है पर middleware सिर्फ़ 1 route पर —
      इसे `tenant?:` (optional) करो और हर पढ़ने वाली जगह guard लगाओ
- [ ] B2: वही global typing `backend/src/common/types/` में ले जाओ (module के अंदर से हटाओ)
- [ ] B3: `financial_year` का EXCLUDE constraint raw SQL migration में जोड़ो
      (एक कंपनी के दो financial year आपस में overlap न कर सकें)
- [ ] B4: `M04-company.contract.yaml` को असली response shape से मिलाओ (shape बदल चुका है)

## हिस्सा C — M02 Core Architecture (CERT-003 की शर्त 1)

- [ ] C1: `company_master` में `code` field जोड़ो (unique, छोटा, इंसान का लिखा हुआ)
- [ ] C2: login को **GSTIN से हटाकर `code` पर** लाओ — GSTIN कभी login की चाबी नहीं होनी चाहिए
      (पुराने data के लिए migration में code भर देना; backward-compatible रखो)
- [ ] C3: auth/permission/session के tests

## हिस्सा D — M01 Foundation

- [ ] D1: `common/logging/audit-logger` को M19 के असली audit trail से जोड़ो (अभी सिर्फ़ console)
- [ ] D2: `app.repository` का redis इस्तेमाल `common/cache-config` से सही करो
- [ ] D3: M01 के tests

## हिस्सा E — M03 Device & Platform

- [ ] E1: expired `active_session` की सफ़ाई का job (cron/interval, tenant-safe)
- [ ] E2: device/session/platform के tests

## हिस्सा F — tests को ढाँचे में लाना

- [ ] F1: `tsconfig.backend.json` से tests का `exclude` हटाकर उन्हें compile में लाओ
      (जो टूटें उन्हें **ठीक करो**, दोबारा छिपाओ मत)
- [ ] F2: `npm run test:backend` चलाकर नतीजा log में लिखो (कितने pass/fail, नाम के साथ)

---

## हर हिस्से की मुहर की शर्त (मैं यही जाँचूँगा)

| जाँच | कैसे |
|---|---|
| tsc | `npx tsc -p tsconfig.backend.json --noEmit` — गिनती baseline से बढ़ी नहीं |
| prisma | `npx prisma validate` — valid |
| mount | server चलाकर modules की गिनती (अभी 17) — घटी नहीं |
| छिपाव | `git diff` में कोई नया `as any` / `@ts-ignore` / `exclude` नहीं |

**क्रम:** A → B → C → D → E → F. कोई हिस्सा अटके तो notify करके **अगले पर जाओ**, रुको मत।

— समीक्षक AI (Claude), 2026-09-03
