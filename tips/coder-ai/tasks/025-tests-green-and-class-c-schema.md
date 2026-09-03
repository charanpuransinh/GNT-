# टास्क #025 — tests हरे करो + Class C (M11/M12/M14/M15) के errors गिराओ

**दिया:** समीक्षक AI (Claude) · **2026-09-03, 21:15** · **HOLD हट गया — फिर से nonstop**
**मालिक का आदेश:** *"server का load कम हो गया है, HOLD हटाओ, DeepSeek को फिर काम पर लगाओ।"*

**यह टास्क जान-बूझकर ऐसा चुना है जिसमें मालिक का कोई फ़ैसला न चाहिए** — तुम्हारे 4 लटके फ़ैसले
(cess_rate, M13, GST/ledger डिज़ाइन, DB चालू होना) मैंने अलग से मालिक के सामने रखे हैं। उनका इंतज़ार
मत करो, नीचे का काम उनसे बिल्कुल अलग है।

---

## आज 21:10 पर मेरा नापा हुआ baseline (यहीं से सुधार गिनना है)

| क्या | अभी |
|---|---|
| backend tsc | **510** — m11-payment **152** · m15-sync **131** · m14-import-export **96** · m13-automation 75 · m12-hr **55** · m09-gst 1 |
| frontend tsc | **216** |
| vitest | **244 पास · 36 फ़ेल · 4 skip** |
| mounted modules | 19 |

---

## हिस्सा A — 36 फ़ेल tests को 0 पर लाओ (सबसे पहले, यही सबसे कीमती है)

- [ ] A1: `npx vitest run` चलाकर 36 फ़ेल की **वजहों के हिसाब से सूची** बनाओ (कितने DB-बंद के कारण,
      कितने alias/runner के, कितने असली logic के) — यह सूची `DEEPSEEK_LOG.md` में लिखो
- [ ] A2: जो **setup/alias/mock** की वजह से फ़ेल हैं — ठीक करो (vite config में `@/` alias,
      mocks का snake_case/camelCase मेल)
- [ ] A3: जो **असली logic** की वजह से फ़ेल हैं — कोड ठीक करो, test को कमज़ोर मत करो
      (`skip`/`todo` लगाकर हरा दिखाना मना है)
- [ ] A4: जिनके लिए **database ज़रूरी** है — उन्हें `it.skip` की जगह साफ़ नाम वाले
      **integration** group में डालो और log में गिनती लिखो (कितने DB के इंतज़ार में हैं)
- **शर्त:** आख़िर में `vitest run` का नतीजा log में चिपकाओ — पास/फ़ेल/skip तीनों

## हिस्सा B — Class C schema merge: M11 + M12 + M14 + M15 (510 → कम)

पुरानी task file `tasks/008-m11-m15-schema-merge.md` **पढ़ो** — ढाँचा वहीं लिखा है। **M13 छोड़ दो**
(75 errors) — उसका फ़ैसला मालिक पर लटका है।

- [ ] B1: **M12 (55)** — सबसे छोटा, यहीं से शुरू करो; missing models/relations Prisma में जोड़ो
- [ ] B2: **M14 (96)** — import/export; इसका mount पहले से हो चुका है, सिर्फ़ types/schema
- [ ] B3: **M15 (131)** — sync
- [ ] B4: **M11 (152)** — payment; सबसे बड़ा, आख़िर में
- [ ] B5: हर model जोड़ते वक़्त **`company_id` + tenant scope** देना है — Class C में यह छूटा हुआ है
- [ ] B6: हर हिस्से के बाद `npx prisma validate` + tsc की नई गिनती log में

## हिस्सा C — frontend 216 → 0

- [ ] C1: errors की module-वार गिनती निकालो, बड़े से छोटे क्रम में ठीक करो
- [ ] C2: कोई `any`/`@ts-ignore` नहीं; असली types बनाओ

---

## नियम (वही, बदले नहीं)

1. क्रम **A → B → C**; एक हिस्सा ख़त्म होते ही अगला ख़ुद उठाओ, मेरी मुहर का इंतज़ार नहीं
2. permission के लिए मत रुको (safe काम ख़ुद करो) · **`git push` कभी नहीं**
3. अटको/error आए/फ़ैसला चाहिए हो → तुरंत
   `/root/gnt-project/tools/notify.sh --tag "DeepSeek 🚨" "..."` फिर **अगले हिस्से पर बढ़ जाओ**
4. हर हिस्से पर: `DEEPSEEK_LOG.md` में नोट + commit + एक लाइन notify
5. **कुछ छिपाना नहीं** — `as any`, `@ts-ignore`, tsconfig का नया `exclude`, test का `skip` — सब मना
6. मेरी फाइलें मत छुओ: `tips/reviewer-ai/**`, `STATUS.md`, `NIGHT-QUEUE.md`, `docs/REVIEWER-AI-GUIDE.md`

— समीक्षक AI (Claude), 2026-09-03 21:15
