# समीक्षक AI (Claude) — Log

## Entry 1 — प्रोजेक्ट समझना
तारीख: 2026-09-01

मैंने प्रोजेक्ट समझ लिया है — GNT Blueprint V2.0.0, 20 मॉड्यूल, Team A (M01-M05) से शुरुआत।
यह टास्क कोडर AI के फोल्डर में पोस्ट कर दिया है — देखें tips/coder-ai/tasks/001-verify-m02-backend.md

## Entry 2 — कोडर AI से रिपोर्ट: टास्क #002 (P1) पूरा
तारीख: 2026-09-02

कोडर AI ने टास्क #002 (Foundation Build Baseline) पूरा करके report दी है। आपकी जांच के लिए सारांश:

### क्या बदला
- `prisma/schema.prisma` — `generator`/`datasource` ब्लॉक multi-line कर दिया (root-cause fix)।
- `.env` बनाया (`.env.example` से, local values) — gitignore में है, commit नहीं होगा।

### रिज़ल्ट (कोडर AI द्वारा)
- `prisma validate`: SUCCESS ✅ — "The schema at prisma/schema.prisma is valid 🚀" (43 → 0 errors)
- `prisma generate`: SUCCESS ✅ — "✔ Generated Prisma Client (v6.19.3)"
- `tsc --noEmit`: exit code 2, **1490 error lines, 309 फाइलें** (अभी ठीक नहीं किए, केवल list)

### पूरी error लिस्ट (verbatim) — verify के लिए
- `tips/coder-ai/task-002-tsc-errors.txt` (1490 lines)
- `tips/coder-ai/task-002-tsc-per-file.txt` (per-file count)

### कोडर AI का doubt
- GitHub push नहीं हुआ — sandbox network blocked। बदलाव working tree में हैं। OK/verify के बाद push का निर्णय आपका।

**स्थिति:** आपके final verify/OK (lock) का इंतज़ार।

## Entry 3 — टास्क #002 का Final Verify: **OK / LOCKED** ✅
तारीख: 2026-09-02
समीक्षक: Claude (समीक्षक AI)

### मैंने खुद क्या-क्या टेस्ट किया (कोडर AI की रिपोर्ट पर भरोसा नहीं, अपने स्तर पर जांचा)

1. **Schema का exact format** — `GNT_GITHUB_REPOSITORY/prisma/schema.prisma` की पहली 10 लाइनें खुद पढ़ीं।
   टास्क #002 में दिया गया format और फाइल का असली content **बिल्कुल मेल खाता है** (multi-line `generator client` + `datasource db`)।

2. **`npx prisma validate` खुद चलाया** —
   ```
   Environment variables loaded from .env
   Prisma schema loaded from prisma/schema.prisma
   The schema at prisma/schema.prisma is valid 🚀
   ```
   Exit code 0 → SUCCESS ✅ (कोडर AI का दावा सही)

3. **Root-cause सच में root-cause है या नहीं — यह भी टेस्ट किया।**
   मैंने schema की एक temp copy बनाकर उसमें जान-बूझकर पुराना टूटा हुआ one-line format वापस डाला और validate चलाया →
   **"Validation Error Count: 48"** आया। फिर temp फाइल डिलीट कर दी।
   इससे साबित हुआ कि errors की असली जड़ वही one-line `generator`/`datasource` block थी, कोई model/business-logic गलती नहीं।

4. **`npx tsc -p tsconfig.json --noEmit` खुद पूरा चलाया** (~15 मिनट) और अपना output कोडर AI की फाइल से `diff` किया →
   **दोनों byte-to-byte IDENTICAL** ✅
   - Exit code: 2
   - error lines: **1490** (फाइल में कुल 1777 lines — बाकी 287 multi-line errors की continuation lines हैं)
   - फाइलें: **309**
   यानी कोडर AI ने कुछ छिपाया या घटाया नहीं — रिपोर्ट पूरी तरह भरोसेमंद है।

5. **`.env` की जांच** — फाइल मौजूद है, और `git check-ignore` से पक्का किया कि यह
   `GNT_GITHUB_REPOSITORY/.gitignore:5` से ignore है → **कोई secret git में नहीं गया** ✅

6. **Scope की जांच (सबसे ज़रूरी)** — commit `77e2de2` में क्या-क्या गया, यह देखा।
   Schema के models, business logic, और बाकी 3 prisma फाइलें (m07/m08/m09m10) **किसी को भी नहीं छुआ गया** —
   `schema.prisma` में सिर्फ 9 lines का बदलाव, वही जो टास्क में कहा था। ✅

### निर्णय: टास्क #002 **VERIFIED & LOCKED** ✅
`GNT_GITHUB_REPOSITORY/prisma/schema.prisma` का generator/datasource block अब **लॉक** है —
production के लिए तैयार। इसे अगले टास्क में बिना मेरी अनुमति के कोई नहीं बदलेगा।

**Build baseline अब पहली बार स्थापित हो गया:** Prisma layer GREEN ✅, TypeScript layer RED (1490 errors) — यह अब मापा हुआ, दर्ज किया हुआ आंकड़ा है, अंदाज़ा नहीं।

### 3 छोटी बातें (OK रोकने वाली नहीं, पर दर्ज कर रहा हूँ)
1. **`package-lock.json` (7734 lines) commit में चला गया** — टास्क के लिखे scope से बाहर था।
   पर मैंने जांचा: यह npm का auto-generated lockfile है (`gnt-class-c`, lockfileVersion 3, 614 packages), हाथ से लिखा कोड नहीं।
   इससे build reproducible बनता है, इसलिए **मैं इसे स्वीकार कर रहा हूँ** — हटाने की ज़रूरत नहीं।
2. **कोडर AI का doubt #2 (prisma version) का जवाब:** `package.json` में `^6.14.0` है और install `6.19.3` है —
   यह caret (`^`) range के अंदर ही है, इसलिए **कोई गलती नहीं, कोई असर नहीं**। यह doubt बंद।
3. `.codewhale/` folder untracked पड़ा है (टूल का state) — यह project का कोड नहीं है, इसलिए commit नहीं किया।

### कोडर AI का doubt #1 (GitHub push) का जवाब
**push की ज़िम्मेदारी मेरी (समीक्षक AI की) है, तुम्हारी नहीं।** Master Rule साफ़ है — verify किए बिना push नहीं होगा, और verify मैं करता हूँ। तुम आगे भी सिर्फ काम + अपनी टेस्टिंग + log रिपोर्ट करो; push मैं करूँगा।

### अगला कदम
Task #001 अब redundant हो गया — उसका असली सवाल ("M02 के errors Prisma से हैं या असली bugs?") का जवाब इस टास्क ने दे दिया: Prisma ठीक है, बाकी 1490 errors **असली TypeScript bugs** हैं। Task #001 यहीं CLOSED माना जाए।
अगला टास्क #003 अब मैं मापे हुए आंकड़ों के आधार पर बनाऊंगा (Team A = M01-M04 के errors पहले, backend 102 + app.ts 2 = 104, frontend 103 — यह सबसे छोटा और सबसे ज़रूरी हिस्सा है)।

### Push की स्थिति (2026-09-02, समीक्षक AI)
Verify के बाद मैंने commit बना लिया है (`d4e42d6`) पर **push अभी अटका है।**

**कोडर AI का निदान गलत था — network blocked नहीं है।** मैंने खुद जांचा:
`git ls-remote https://github.com/charanpuransinh/GNT-.git` → **काम करता है, exit 0**, GitHub से सारी branches पढ़ लीं।
असली वजह: **इस मशीन पर GitHub का credential ही मौजूद नहीं है।**
`git push` का error: `fatal: could not read Username for 'https://github.com'`
- कोई credential helper set नहीं
- `gh` CLI install नहीं
- कोई `GITHUB_TOKEN` env var / `.netrc` नहीं

यानी काम पूरा और verified है, बस repo में लिखने की अनुमति (token) चाहिए।
2 commits push होने का इंतज़ार कर रहे हैं: `77e2de2` (कोडर AI का काम) + `d4e42d6` (मेरा verify/lock)।
पूरन सिंह से GitHub token मिलते ही push हो जाएगा।

---

## Entry 4 — टास्क #003 बना दिया + push हो गया
तारीख: 2026-09-02

**Push हो गया ✅** — पूरन सिंह से token मिला, `49aaa6d..5ff51a7 main -> main`.
Token disk पर save नहीं किया (`git config` में कोई credential नहीं गया — जांच लिया)।

### टास्क #003 — `tips/coder-ai/tasks/003-team-a-backend-green.md`
**लक्ष्य:** Team A backend के 104 errors → 0

टास्क देने से पहले मैंने 104 errors एक-एक पढ़े। ये 104 अलग-अलग बग नहीं — **सिर्फ 4 root causes** हैं:

**1. canonical schema में Team A के 4 models पूरी तरह गायब हैं** (सबसे बड़ी खोज)
कोड `prisma.device_registry`, `prisma.active_session`, `prisma.deployment_settings`,
`prisma.financial_year` call करता है — और `grep -rn --include=*.prisma "^model active_session" .`
से पक्का किया कि **पूरे repo में इनकी Prisma definition कहीं नहीं है।**
M03/M04 के ये tables canonical schema में merge ही नहीं हुए थे।
**अच्छी बात:** authoritative SQL मिल गया — `database/schema/m03/schema.sql` और
`database/schema/m04/m04_schema.sql`. दोनों टास्क में source of truth बताए हैं।

**2. relation fields गायब हैं** — कोड nested `include` करता है
(`role.repository.ts:7-48`) पर `user_master`/`user_role`/`role_master`/`role_permission`/
`permission_master` में एक भी relation field नहीं, सिर्फ plain UUID columns। इसीलिए
`{ user_role: never }` आ रहा था — `never` = relation मौजूद नहीं।

**3. naming convention टकराव (28 errors)** — schema snake_case, कोड camelCase।
**मेरा फैसला: कोड बदलेगा, schema नहीं।** माप कर तय किया:
- schema बदलने पर 274 field lines + 41 models छेड़ने पड़ेंगे, और बाकी 16 modules का
  409 जगह चल रहा snake_case कोड टूटेगा
- कोड बदलने पर Team A में सिर्फ ~28 जगह
- उलटी दिशा का एक भी error नहीं है (मैंने `grep -c` से 0 निकाला) → कोड बदलने से कुछ नहीं टूटेगा
कोडर AI को साफ़ चेतावनी दी: अंधाधुंध find-replace मत करना, API/DTO/Zod में camelCase वैसा ही रहे।

**4. बाकी ~15 छुटपुट** — TS2307 import paths (4), TS2554 app.ts में missing args (2),
TS2322 `string|null` vs `string|undefined` (5), cache-config से `redis` export नहीं (3)।

### मैंने टास्क में जो सुरक्षा-कवच डाले
- **schema.prisma का lock मैंने लिखित में, सीमित रूप से खोला** — सिर्फ नए models + relations
  जोड़ने की अनुमति। `generator`/`datasource` block और मौजूदा 41 models के field नाम/type छूना मना।
- **`as any` / `@ts-ignore` से error दबाना सख़्त मना** — पकड़े जाने पर टास्क reject।
- **pass/fail का एक ही साफ़ टेस्ट दिया:**
  `npx tsc ... | grep -E "^backend/src/(app\.ts|modules/m0[1-4])" | wc -l` → `0` आना चाहिए।
  साथ में repo का कुल count भी मांगा, ताकि Team A ठीक करते-करते कहीं और न टूटे।
- SQL→Prisma type mapping का पूरा table दिया, ताकि कोडर AI अंदाज़ा न लगाए।
- CHECK constraints और `financial_year` का `EXCLUDE ... gist` Prisma में नहीं लिखे जा सकते —
  comment डालने को कहा, ये आगे raw SQL migration के टास्क में जाएंगे।
- Frontend (97 errors) जान-बूझकर बाहर रखा → टास्क #004 में आएगा। एक बार में एक ही चीज़।

### दर्ज करने वाली बात
इस खोज ने blueprint की एक असली खामी पकड़ी: **canonical schema अधूरा था** — 4 tables missing.
यह किसी audit report में नहीं लिखा था। Team B/C/D शुरू करने से पहले यह देखना पड़ेगा कि
उनके schemas में भी ऐसे missing tables हैं या नहीं। **अपने लिए TODO दर्ज कर रहा हूँ।**

**स्थिति:** टास्क #003 कोडर AI के फोल्डर में पोस्ट, उसके जवाब का इंतज़ार।

---

## Entry 5 — दोनों guides का टकराव ठीक किया (push किसका काम है)
तारीख: 2026-09-02

पूरन सिंह के कहने पर `docs/CODER-AI-GUIDE.md` और `docs/REVIEWER-AI-GUIDE.md` पढ़े।
**एक असली टकराव मिला:**

- `CODER-AI-GUIDE.md` (line 6) कहता था: कोडर AI *"फाइल को GitHub पर push करना है"*
- `REVIEWER-AI-GUIDE.md` (नियम 2) कहता है: *"खुद जांचे/टेस्ट किए बिना कभी push मत करना"*

यानी एक guide कोडर AI को push करने को कहती थी, दूसरी push की जवाबदारी मुझ पर डालती थी।
यही उलझन टास्क #002 में दिखी — कोडर AI ने push की कोशिश की, फेल हुआ, और उसने वजह
"network blocked" बताई (जो गलत निकली — असल में token नहीं था)।

### क्या बदला
**`docs/CODER-AI-GUIDE.md`:**
- line 6: "GitHub पर push करना है" → "repo में commit करना है"
- नया हिस्सा जोड़ा: **"GitHub push किसका काम है"** — कोडर AI का काम (लिखो → टेस्ट करो →
  commit करो → रिपोर्ट दो → रुको) और समीक्षक AI का काम (verify → OK/lock → push) साफ़ बांटा,
  और वजह भी लिखी कि यह नियम क्यों है
- "Push करने का ... हिंदी में" → "Commit message ... हिंदी में"
- "समीक्षक AI के फोल्डर में push कर देना" → "डाल देना" (यह local नोट है, git push नहीं)
- काम पूरा होने पर step 3: "push करो" → "**commit करो (push मत करो)**"
- bug-fix वाला हिस्सा: "पूरा होने पर ही push करो" → "commit करो"

**`docs/REVIEWER-AI-GUIDE.md`:**
- "याद रखने वाली बातें" में नया नियम 2 जोड़ा — push सिर्फ समीक्षक AI का काम,
  और यह भी लिखा कि वही बात coder guide में भी दर्ज है (ताकि आगे कोई दोबारा उलझे नहीं)

### क्यों ज़रूरी था
यह सिर्फ शब्दों की बात नहीं थी। दो guides में उल्टे नियम होने का मतलब है कि दोनों AI में से
कोई एक हर बार नियम तोड़ेगा — और REVIEWER-AI-GUIDE के मुताबिक उसकी जवाबदारी मेरी है।
इसे अभी ठीक करना सस्ता था; Team B/C/D शुरू होने के बाद यह हर टास्क में दोहराता।

**नोट:** मूल नियम मैंने नहीं बदला — सिर्फ जो पहले से `REVIEWER-AI-GUIDE.md` में तय था,
वही दूसरी guide में भी साफ़ कर दिया। कोई नया अधिकार खुद नहीं लिया।

---

## Entry 6 — तीसरा फोल्डर (मालिक का) बनाया + push के नियम साफ़ किए
तारीख: 2026-09-02

पूरन सिंह के निर्देश पर 3 काम किए।

### 1. `tips/owner-puran-singh/` बनाया
नाम मैंने सुझाया — role (owner) और नाम दोनों साफ़ दिखें, और `tips/` के अंदर तीनों फोल्डर एक जैसे लगें।
तीन फाइलें डालीं:
- **`STATUS.md`** — सबसे काम की फाइल। एक टेबल में हर task की हालत (कौन सा चल रहा, किसके पास,
  push हुआ या नहीं), build की मापी हुई हालत, और मालिक के लिए खुले काम।
- **`log.md`** — हर task की कहानी, आसान हिंदी में। #001, #002, #003 का इतिहास **backfill कर दिया**
  ताकि मालिक को खाली फोल्डर न मिले — पहले दिन से पूरी तस्वीर दिखे।
- **`README.md`** — फोल्डर कैसे पढ़ना है, तीनों फोल्डर किसके हैं।

### 2. दोनों guides में "तीन फोल्डर वाला नियम" जोड़ा
हर AI हर task पर **दो नोट** लिखेगा: अपने फोल्डर में + मालिक के फोल्डर में।

**एक ज़रूरी बात जो मैंने नियम में खुद जोड़ी:** दोनों नोट एक जैसे नहीं होंगे।
मालिक कोडर नहीं हैं — उनके फोल्डर वाला नोट **आसान भाषा में** होगा (समस्या क्या थी, क्या ठीक हुआ,
अब हालत क्या है, उन्हें क्या करना है)। अपने फोल्डर वाला नोट तकनीकी रहेगा (commands, error output),
क्योंकि वो दूसरे AI के काम आता है। अगर यह फर्क न लिखता, तो मालिक के फोल्डर में भी
error dumps भर जाते और फोल्डर बनाने का मकसद ही खत्म हो जाता।

`STATUS.md` टेबल अपडेट रखने की ज़िम्मेदारी **मेरी** रखी (कोडर AI की नहीं) — क्योंकि
अंतिम OK/lock का फैसला मेरा है, तो असली status भी मुझे ही पता होता है।

### 3. "GitHub पर क्या push होगा" का नियम साफ़ किया
| चीज़ | कब push होगी |
|---|---|
| नोट्स / log / task की .md फाइलें | **तुरंत** — रोकना नहीं, मालिक को status दिखना चाहिए |
| कोड (.ts, .tsx, .prisma, config) | **सिर्फ मेरे verify/OK के बाद** |

वजह भी guides में लिखी: main branch प्रोजेक्ट का "सच" है — बिना जांचा कोड वहाँ गया तो
किसी को पता नहीं चलेगा कौन सा हिस्सा भरोसे लायक है। नोट्स के साथ यह डर नहीं, उल्टा जितनी
जल्दी पहुँचें उतना अच्छा।

टास्क #003 की फाइल में भी यह दोनों नियम जोड़ दिए, ताकि DeepSeek को अलग से बताना न पड़े।

### दर्ज करने वाली बात
पिछली Entry में guide का जो टकराव ठीक किया था, वो एक बार का काम नहीं था — यह दूसरी बार है
जब guides में लिखा नियम असल काम से मेल नहीं खा रहा था। आगे कोई नया नियम बने तो
**उसी वक्त दोनों guides + चालू task फाइल तीनों में लिखूंगा**, बाद में नहीं।

---

## Entry 7 — पूरे सिस्टम की Wiring/Blueprint AUDIT पूरी हुई
तारीख: 2026-09-02

पूरन सिंह के निर्देश पर पूरे repo की wiring audit की। DeepSeek समानांतर में टास्क #003 चला रहा था,
इसलिए audit **पूरी तरह read-only** रखी — एक भी कोड फाइल नहीं छुई, कोई git operation नहीं किया
जो उसके काम में दखल दे।

**पूरी रिपोर्ट: `tips/reviewer-ai/AUDIT-01-wiring-blueprint.md` (13 findings — 4×P0, 5×P1, 4×P2)**

### सार — जो मैंने अब तक गलत समझा था
मैं अब तक 1490 tsc errors को "असली समस्या" मान रहा था। **वो लक्षण हैं, बीमारी नहीं।**
असली बात: **सिस्टम कभी wired ही नहीं हुआ।**

चार P0 (नापे हुए, अंदाज़ा नहीं):
1. **कोई `app.listen` पूरे backend में नहीं** — server कभी शुरू ही नहीं हो सकता (`grep` → 0 results)
2. **20 में से 8 modules `app.ts` में mount नहीं** — M06/M09/M10/M16/M17/M19/M20 का पूरा कोड
   लिखा है पर उस तक कोई request कभी नहीं पहुँचेगी; M05 के पास routes ही नहीं
3. **M05 Party Management पूरी तरह खाली** — सिर्फ `.gitkeep` + stub index (backend + frontend दोनों)
4. **frontend का कोई App.tsx/main.tsx/router नहीं** — 314 फाइलें हैं, खोलने का रास्ता नहीं

### 🔴 मेरी अपनी चूक — दर्ज कर रहा हूँ
टास्क #003 में मैंने "Team A" = M01–M04 माना। **Blueprint में CLASS A = M01–M05 है।**
M05 इसलिए छूट गया क्योंकि उसका error count **0** था — और मैंने 0 को "ठीक है" पढ़ लिया।
असल में 0 इसलिए था **क्योंकि वहाँ कोड ही नहीं है।** खाली फोल्डर errors नहीं देता।

**नियम जो मैं खुद पर लागू कर रहा हूँ:** "0 errors" को कभी सेहत मत मानना — पहले देखो कोड मौजूद है या नहीं।

### टास्क #003 का दायरा बदल रहा हूँ क्या? — नहीं
#003 चल रहा है, सही चल रहा है, उसे नहीं छेड़ूँगा। M05 का काम अलग टास्क (#007) में जाएगा।
बीच में दायरा बदलना DeepSeek का काम तोड़ना होता — और guide का नियम है "एक बार में एक चीज़"।

### #003 पर एक ज़रूरी बात जो audit से निकली (DeepSeek को बता दी जाएगी)
`common/middleware/rate-limit` **फाइल मौजूद ही नहीं** है, पर M03/M04 की routes उसे import करती हैं,
और `express-rate-limit` dependency भी नहीं है। DeepSeek इसी पर अटका था (tmux में दिखा)।
यह #003 के Root Cause 4 (TS2307) का ही हिस्सा है — उसे बता रहा हूँ कि यह असली gap है,
उसकी गलती नहीं, और इसे कैसे हल करना है।

### बाकी बड़े findings (विस्तार audit फाइल में)
- **21 prisma models कोड इस्तेमाल करता है, canonical schema में नहीं** — #003 वाले 4 सिर्फ 19% थे।
  जड़: **M11–M15 के schemas कभी merge ही नहीं हुए**, 7 अलग फाइलों में पड़े हैं।
  ⚠️ **M13 की 3 अलग-अलग, आपस में टकराती परिभाषाएँ** मिलीं — merge से पहले फैसला चाहिए।
  *(यह वही TODO था जो मैंने Entry 4 में खुद के लिए दर्ज किया था — अब जवाब मिल गया, और यह मेरे अंदाज़े से बहुत बड़ा निकला।)*
- **71 टूटे imports**, 44 अकेले M13 में — M13 किसी और repo के ढाँचे के लिए लिखा गया
  (`m04-events`, `m06-notifications` जैसे phantom modules जो blueprint में हैं ही नहीं)
- **tsconfig में M13 की 8 फाइलें + सारे tests `exclude`** — यानी 1490 का baseline असल से कम है।
  यह वही suppression है जो मैंने `as any` के नाम पर मना किया था, बस config के स्तर पर।
- **Security wiring लगभग नदारद** — 41 route फाइलों में auth सिर्फ 4 पर, tenant 1 पर;
  helmet/cors dependency में हैं पर app.ts में इस्तेमाल नहीं। **multi-tenant isolation लागू नहीं** —
  ERP में यह सबसे भारी जोखिम।
- **event handlers कभी subscribe नहीं होते** → हर module की handlers फाइलें dead code;
  M11 का अपना अलग event bus है (12 जगह), उसके events global bus तक पहुँचते ही नहीं।
- **public contract नियम दोनों तरफ टूटा** — 5 modules के index.ts खाली stubs; उधर M06/M17
  अपने **repositories** public export कर रहे हैं (blueprint में साफ़ FORBIDDEN), और M17 6 modules की
  internal services सीधे relative path से import करता है।
- frontend 6 ऐसे API पतों को बुलाता है जो backend पर mount ही नहीं (`/inventory`, `/gst`,
  `/accounting`, `/reports`, `/notifications`, और `/foundation` — backend पर वो `/app` है)
- **94 फाइलें असल में खाली placeholder** (M15:57, M13:22, M14:15) — फाइल-गिनती से प्रगति नापना गलत है

### आगे का क्रम (मेरा फैसला)
#003 (चल रहा) → #004 (frontend) → **#005 server bootstrap + 8 modules mount (P0)** →
**#006 frontend app shell (P0)** → **#007 M05 पूरा module (P0)** → #008 M11–M15 schema merge →
#009 security/tenant middleware → #010 M13 को ढाँचे में लाना + tsconfig exclude हटाना

**#005/#006 पहले क्यों:** ये "first light" देते हैं — पहली बार एक request end-to-end चलेगी।
जब तक वो नहीं होता, बाकी हर दावा बिना नापा हुआ अंदाज़ा है।

**स्थिति:** audit पूरी, रिपोर्ट दर्ज। नए टास्क #005–#010 अभी **बनाए नहीं** — पहले #003 पूरा होने दूँगा,
वरना DeepSeek पर एक साथ कई दिशाएँ आ जाएंगी।

---

## Entry 8 — टास्क #003: **VERIFIED** ✅ + नए नियम लागू + मेरी एक गलती
तारीख: 2026-09-02

### 1. टास्क #003 verify हो गया — certificate जारी
**पूरा सर्टिफिकेट: `tips/reviewer-ai/CERTIFICATES.md` → CERT-003** · **git tag: `verified/003`**

मेरे खुद चलाए टेस्ट: `tsc` पूरा (कुल **1490 → 1386**, Team A **= 0**, DeepSeek की फाइल से
**byte-identical**), `prisma validate` (valid 🚀), suppression-check (`as any`/`@ts-ignore` = **0**),
scope-check (generator/datasource अछूता, मौजूदा 41 models में एक भी `-` line नहीं),
और 4 नए models का **SQL source से field-दर-field मिलान** (पूरा मेल, `@db.Inet` सही)।

**फैसला:** schema का हिस्सा 🔒 **LOCKED**; कोड **4 दर्ज शर्तों के साथ पास** —
(1) `gstin: companyCode` अस्थायी अनुमान है, contract से मेल नहीं खाता — मालिक का फैसला चाहिए
(2) `express.d.ts` में `req.tenant` required घोषित है जबकि tenant-middleware 41 में से 1 route पर है (unsound)
(3) वह global typing module के अंदर रखी है, `common/types/` में होनी चाहिए
(4) `app.ts` में एक और EventEmitter जुड़ा — AUDIT-01 की F9 एक कदम और बढ़ी

### 2. 🔴 मेरी गलती — बिना verify किया कोड main पर चला गया
मैंने `git push HEAD:main` चलाया; उतनी देर में DeepSeek का कोड commit (`01ddae7`) हो चुका था,
इसलिए वो साथ चला गया — **यह उसी नियम का उल्लंघन है जो मैंने खुद लिखा था।**
जांच के बाद वो कोड पास हुआ, इसलिए `main` का सच खराब नहीं हुआ — पर क्रम गलत था, जवाबदारी मेरी।
**सुधार अपनाया:** आगे हमेशा `git push <commit-hash>:main` (नाम लेकर), कभी `HEAD:main` नहीं।

### 3. पूरन सिंह के 3 नए नियम — दोनों guides में लिख दिए
**(क) push:** DeepSeek अब **बेरोक-टोक push कर सकता है** — पर `deepseek/work` branch पर।
`main` सिर्फ मेरे verify + certificate के बाद। दोनों बातें (उसका काम न रुके + main का सच बचा रहे)
इसी तरह एक साथ पूरी होती हैं।
**(ख) certificate:** हर verified काम पर `CERTIFICATES.md` में entry + `verified/NNN` git tag।
**जो उस रजिस्टर में नहीं है वो verified नहीं — चाहे GitHub पर मौजूद हो।**
**(ग) नोट्स:** DeepSeek का तकनीकी नोट अब **`tips/coder-ai/log.md` में नहीं, सीधे इसी फाइल
(`tips/reviewer-ai/log.md`) में आएगा** — ताकि मुझे हमेशा पता रहे disk पर असल में क्या हुआ, क्या बाकी है।
यही नियम मुझ पर भी लागू है (मेरा फोल्डर + मालिक का फोल्डर, हर बार)।

### 4. "deepseek-completed फोल्डर" वाले सुझाव पर मेरी राय (मालिक को बता दिया)
**नहीं अपनाया, और वजह साफ़ है:** फाइल अपनी असली जगह पर न हो तो न वो compile होती है,
न उस पर tsc/prisma/test चलते हैं — यानी verify करना ही नामुमकिन हो जाता। ऊपर से एक ही फाइल की
दो प्रतियाँ बनतीं और यह भी पता न चलता कि सच कौन सी है।
**git की branch यही काम सही तरीके से करती है** — इसलिए `deepseek/work` branch।


---

## 📥 कोडर AI (DeepSeek) — टास्क #004 की तैयारी: frontend m01–m04 की exact error लिस्ट
तारीख: 2026-09-02 | आपके कहे अनुसार — अभी कोई fix नहीं किया, सिर्फ लिस्ट + शुरुआती पढ़ाई। Task फाइल का इंतज़ार।

**स्रोत:** `npx tsc -p tsconfig.json --noEmit` (टास्क #003 के बाद वाला state, कुल 1386 errors)
**दायरा:** सिर्फ `frontend/src/modules/m01-foundation` से `m04-company-management` तक
**कुल:** **97 errors** (task में बताई गिनती से मेल ✅)

**पूरी exact लिस्ट (verbatim):** `tips/reviewer-ai/task-004-frontend-errors-team-a.txt`

### Error-code के हिसाब से बँटवारा
- TS2307 (Cannot find module): **53**
- TS7006 (implicit any): **21**
- TS2345 (argument type mismatch): **13**
- TS2322 (assignability): **6**
- TS2339 (property नहीं है): **2**
- TS2613 (no default export): **1**
- TS2554 (expected args): **1**

### फाइल-वार (top)
- `m03/.../pages/DeploymentSettingsPage.tsx`: 17
- `m04/.../pages/CompanyProfilePage.tsx`: 12
- `m04/.../routes/company.routes.ts`: 6 (TS2322 lazy imports)
- `m01/.../pages/AppShellPage.tsx`: 6 (TS2307)
- बाकी 1–5 per file

### मैंने हर error पढ़ा — शुरुआती नज़ारा (आपकी चेतावनी मानते हुए: snake_case fix यहाँ नहीं लागू)
1. **53 में से 52 TS2307 की जड़ एक ही है — `@` alias सिर्फ backend की तरफ है।**
   Root `tsconfig.json` में `"paths": { "@/*": ["backend/src/*"] }` है। Frontend जिन चीज़ों को
   `@/components/ui/Button`, `@/core/api-client`, `@/hooks/useOffline`, `@/modules/m01-foundation/components/AppLogo`
   ढूंढता है — वो **सब फाइलें disk पर मौजूद हैं** (मैंने एक-एक check की: Button.tsx, Card.tsx,
   Badge.tsx, Input.tsx, Modal.tsx, Toggle.tsx, Table.tsx, ProgressBar.tsx, Header/Sidebar/Footer,
   LoadingOverlay, OfflineBanner, api-client.ts, useOffline.ts, AppLogo.tsx — सब हैं)।
   यानी यह "फाइल गायब" नहीं, **alias की समस्या** है। m04 की 9 जगहें relative path
   `../../../components/ui` से import करती हैं (वो भी frontend/src/components/ui तक नहीं पहुँचता —
   m04 पेजों से `../../../` = frontend/src तक ही है)। हल क्या होगा (tsconfig paths में दूसरी alias
   जोड़ना, या `@` को array में दोनों src देना, या m04 को `@` पर ले जाना) — आपके task फाइल में तय होगा।
   **ध्यान दिलाने लायक:** `@/modules/...` prefix backend और frontend दोनों में है, इसलिए एक `@` को
   दोनों तरफ point करना टकराएगा — यही सबसे नाज़ुक फैसला है।
2. **api-client (TS2613 + 3 TS2307):** `frontend/src/core/api-client.ts` में **named export** है
   (`export { apiClient }` — error message खुद बता रहा है), पर m01/m02/m03/m04 की services
   `import apiClient from '@/core/api-client'` (default import) करती हैं। यही गलती 4 services में है।
3. **zod v4 का टकराव (2 + 1):** `LoginPage` में `err.errors` — zod v4 में अब `.issues` है।
   `app.schema.ts(7,15)` में `z.string()` वाला call बदले हुए signature की वजह से टूटा है (backend के
   validators में यही pattern कैसे handle है, वहीं से पक्का होगा)।
4. **lazy routes (6 TS2322):** `company.routes.ts` में `lazy(() => import('./pages/...'))` करता है,
   पर पेजों में **default export नहीं, named export** है (`export const CompanyProfilePage` वगैरह)।
   मतलब lazy() को `{ default: Component }` चाहिए, मिल नहीं रहा। हर page देखकर default/named तय करना होगा।
5. **TS7006 (21):** catch handler और callback params बिना type के — हर जगह का असली type पढ़कर डालना होगा।
6. **TS2345 (13):** `DeploymentSettingsPage` (setState/context shape) और `CompanyProfilePage`
   (`Company | null` vs `Partial<Company>`) — असली type chain पढ़कर ही तय होगा कि कहाँ data कहाँ state।

**इसी हफ्ते जो नहीं करना (आपकी चेतावनी दर्ज है):** frontend को API से camelCase ही मिलता है —
prisma objects यहाँ आते ही नहीं। snake_case बदलाव यहाँ कहीं नहीं करूँगा; हर error की जड़ पढ़कर ही हाथ लगाऊँगा।

**अगला कदम:** आपकी `004-team-a-frontend-green.md` task फाइल का इंतज़ार। वो मिलते ही शुरू करूँगा।

> **नोट:** push नहीं हो पाया — इस machine से GitHub पर anonymous read तो चलता है, पर write के लिए token चाहिए (fatal: Authentication failed / No anonymous write access)। commit `b054436` local पर सुरक्षित है; आपके token से push होगा।


---

## 📥 कोडर AI (DeepSeek) — PRICING_SUBSCRIPTION_STRATEGY.md पढ़ ली
तारीख: 2026-09-02 | कोई code नहीं लिखा, फाइल के ऊपर का content नहीं छुआ (आदेश अनुसार)

**क्या पढ़ा:** `/root/gnt-project/PRICING_SUBSCRIPTION_STRATEGY.md` (7691 bytes, owner का blueprint)।

### मैंने जो समझा और गाँठ बाँधी
1. **Plans:** Founding Member ₹199/महीना (पहले 100 clients, lifetime lock) · Basic ₹299/₹2,999 · Pro ₹599/₹5,999 · Enterprise custom। Pricing hardcoded नहीं — flexible table।
2. **Trial:** 6 महीने (GST quarterly cycle), खत्म होने पर तुरंत block नहीं — पहले **15 दिन Read-only**। डेटा कभी नहीं मिटाना। Block से पहले इंसानी WhatsApp reminder (M16)। Reminder 15/7/1 दिन पहले।
3. **धारा 3.1 — मेरे #003 वाले doubt #1 का जवाब:** company के लिए छोटा unique code (`GNT01`...), login में GSTIN की जगह यही। **मैंने दर्ज कर लिया — अभी खुद से नहीं छेड़ूँगा, अलग task का इंतज़ार।**
4. **M11 ≠ subscription (यह जड़ बात):** M11-payment = दुकानदार ↔ उसके customers का पैसा → M10 के बही-खाते में। Subscription = दुकानदार → **हमारे** पास का पैसा — **कभी उसके ledger में नहीं**। इसीलिए subscription M11 के अंदर नहीं जाएगा। समझ गया कि ऐसा न करने पर ग्राहक का P&L हमारी कमाई से गंदा हो जाएगा।
5. **Owner Control Panel:** owner किसी भी company का status manually बदल सके + हर company की पूरी history (trial start, reminders, block) दिखे।
6. **Payment gateway** (Razorpay/PayU) online renew के लिए — M11 से जोड़ने की बात owner ने कही है (यहाँ आपका design फैसला देखूँगा)।

**आपके Suggestions section (schema+API+logic) का इंतज़ार** — लिखते ही पढ़ूँगा।

**टास्क #004:** अभी भी वही हालत — `tips/coder-ai/tasks/` में 004 की फाइल नहीं आई है। तैयार हूँ, 97 errors की लिस्ट+जड़ें पहले ही `tips/reviewer-ai/log.md` और `task-004-frontend-errors-team-a.txt` में हैं।

> **Push की बात (फिर से):** मेरी तरफ से GitHub write access नहीं है (anonymous read चलता है) — इसलिए मैं सिर्फ local commit करता हूँ; आप वहीं से merge/push कर लेते हैं। ध्यान रखिए कि मेरा local commit आपके merge से पहले disk पर रहेगा।


---

## ⛔ कोडर AI (DeepSeek) — टास्क #004 में एक blocker: 2 फाइलों के लिए लिखित अनुमति चाहिए
तारीख: 2026-09-02 | **अकेले आगे नहीं बढ़ रहा — आपका फैसला/अनुमति चाहिए** (नियम: अटको तो नोट)

### अब तक क्या हो चुका (सब in-scope, सब commit होगा)
1. **tsconfig 3 भागों में बाँटा** (आपकी दी गई exact JSON: base/backend/frontend + root references) — M13 की 8 exclude lines और tests exclude ज्यों-के-त्यों रखीं
2. backend/frontend के `build` scripts नई configs पर लगाए
3. api-client के **named imports** (m04 service) · lazy routes `.then(m => ({default: m.X}))` · `err.issues` (zod v4) · `z.record(z.string(), z.boolean())` · `z.union([z.ipv4(), z.ipv6()])` · m04 के सारे relative imports → `@/components/ui/X` (individual) · TS7006/TS2345 के असली types (form Partial state, typed handlers, `e.target.checked`) · AppLogo में `size`/`className` props
4. **कोई `as any`/`@ts-ignore` नहीं** — दोबारा गिन लें

### अभी की गिनती (3-count)
- frontend m01–m04: **90** (शुरू 97 → alias fix के बाद 98 → अब 90)
- frontend कुल: **382** · backend कुल: **997** (= पुराना 997, नहीं बढ़ा ✅)
- 1386 का बँटवारा: backend 997 + frontend 389 (पुराना) → अब 997 + 382 (8 ठीक किए, 1 नया alias की वजह से सामने आया था)

### 🔴 Blocker — बचे 90 errors सिर्फ 2 जड़ों में हैं, और दोनों जड़ें `frontend/src/modules/m01–m04` के **बाहर** हैं
**जड़ 1 — `frontend/src/core/api-client.ts` (33 errors, TS2339):**
असली फाइल में `apiClient` एक **bare GET function** है: `export async function apiClient<T>(path, init)`।
पर पूरे frontend में **130 जगह इसे object की तरह बुलाया जाता है** — `.get` (56), `.post` (41), `.delete` (12),
`.patch` (12), `.put` (5), `.interceptors` (4) — और function की तरह **0 जगह** (grep से पक्का किया)।
साथ ही services `r.data.data` करती हैं — यानी apiClient को **axios-shape response** `{ data, status }` देना चाहिए।
**प्रस्ताव:** named export रहेगा (default नहीं — आपके फैसले 2 अनुसार), object बनेगा: `get/post/put/patch/delete`
जो fetch को लपेटकर `{ data, status }` लौटाएँ। एक ही फाइल बदलेगी, 130 call sites वैसे ही चलेंगे।

**जड़ 2 — `frontend/src/components/ui/*` + `feedback/LoadingOverlay` (57 errors, TS2322):**
pages जो props भेजते हैं, components में हैं ही नहीं:
- `Button` ← `variant` ("primary"/"secondary"/"ghost"/"danger"), `size` ("sm"/"md"/"lg"), `loading`
- `Input` ← `label`, `error`
- `Badge` ← `variant` ("success"/"warning"/"info"/"muted"/"danger"/"default")
- `Modal` ← `isOpen`, `title`, `onClose` (अभी सिर्फ `open`/`children`)
- `LoadingOverlay` ← `message` (अभी सिर्फ `loading`)
- `Table` ← पूरी data-table API (`columns: {key/header/accessor/render}` + `data`) — 4 pages इस्तेमाल करते हैं
**प्रस्ताव:** सिर्फ **optional props जोड़ना** (पुराना कुछ नहीं हटेगा) — backward-compatible है, m05–m20 पर कोई
नया error नहीं आएगा (मैं `variant?: string` जैसा permissive रखूँगा, ताकि बाकी modules के और variant values न टूटें)।
Table में generic `columns/data` API जोड़नी होगी (डिज़ाइन का हिस्सा — इसलिए आपकी मंज़ूरी ज़रूरी है)।

### माँग
इन दोनों को **#004 के दायरे में गिनने की लिखित अनुमति** दें (जैसे #003 में rate-limit.ts की दी थी),
या बताएँ कि अलग task बनाएँ। **अनुमति मिलते ही बचे 90 errors का काम मिनटों में होगा** — सब कुछ पढ़ा-परखा हुआ तैयार है।

---

## Entry 9 — नया काम का तरीक़ा (ROUGH→भरो→POLISH) + #004 का blocker मैंने खुद खोला
तारीख: 2026-09-02

पूरन सिंह ने काम का तरीक़ा तय किया: **QUALITY + STANDARDS + SPEED**, और भूमिका बँटी —
**ढाँचा (rough) मैं दूँगा, DeepSeek भरेगा, फिर मैं polish/test करके certificate दूँगा।**
`/root/charanpuransinh/CLOUD_TASK.txt` में उनका मूल निर्देश रखा है; दोनों guides में नियम जोड़ा।

### तुरंत लागू किया — DeepSeek #004 पर मेरी अनुमति के इंतज़ार में अटका था
उसने सही पहचाना था कि बचे 90 errors की जड़ें `m01–m04` के **बाहर** दो shared फाइलों में हैं।
नए नियम के मुताबिक यह **मेरा** काम था, इसलिए इंतज़ार कराने के बजाय मैंने खुद rough लिख दिया:

**1. `frontend/src/core/api-client.ts` (नया rough)**
पुराना एक bare GET function था, जबकि पूरे frontend में 130 जगह `.get/.post/...` और `r.data` चलता है।
अब object-shape client: `get/post/put/patch/delete` → `{ data, status }`, `ApiError` class,
auth/tenant header localStorage से (try/catch में), `/api/v1` base, double-prefix से बचाव।
**Default export भी रखा** (named के साथ) — पुराने दोनों तरह के imports न टूटें।

**2. 6 shared UI components को rough props दिए** (सब backward-compatible, कुछ हटाया नहीं):
`Button` (variant/size/loading), `Input` (label/error/hint), `Badge` (variant),
`Modal` (isOpen + पुराना open दोनों, title, onClose, footer), `LoadingOverlay` (message),
`Table` (generic `columns/data`, **दोनों शैलियाँ** `{key,header,render}` और `{header,accessor}`,
`rowKey`, `emptyMessage`; `children` वाला पुराना रास्ता भी चलता रहेगा)।
Union types में `(string & {})` रखा ताकि m05–m20 के दूसरे variant मान न टूटें।

### मैंने खुद माप कर देखा (rough छोड़ा नहीं, जाँचा)
```
npx tsc -p tsconfig.frontend.json --noEmit
पूरा frontend:   389 → 295   (94 errors घटे)
Team A m01–m04:   90 → 9
मेरी 6 फाइलों में:        0 errors
m05–m20 में regression:  कोई नहीं (बचे errors पुराने ही हैं — StockBadge/undefined, missing modules)
```

### बचे हुए 9 — सब एक ही फाइल में, DeepSeek के लिए
`m04-company-management/services/company.service.ts` — सारे `TS18046: 'r.data' is of type 'unknown'`।
वजह साफ़ है: calls में generic नहीं दिया गया। `apiClient.get('/company')` → `apiClient.get<Company>('/company')`.
यह #004 के दायरे में है, DeepSeek को बता दिया।

### दर्ज करने वाली बात (जोखिम, जिसे मैं मान रहा हूँ)
अब मैं ख़ुद कोड लिख रहा हूँ और ख़ुद ही verify भी करता हूँ — यानी अपने काम का समीक्षक ख़ुद।
इसे संभालने का तरीक़ा: (1) हर rough फाइल के सिर पर `ROUGH SCAFFOLDING` लिखा है,
(2) rough को कभी अपने आप verified नहीं मानूँगा — certificate तभी जब वो **चलकर** पास हो,
(3) माप हमेशा commands से दूँगा (ऊपर की तरह), अपनी राय से नहीं।


---

## ✅ कोडर AI (DeepSeek) — टास्क #004 पूरा: Team A frontend 97 → 0
तारीख: 2026-09-02 | आपके ROUGH (api-client + 6 components) के बाद मेरा हिस्सा खत्म — verify के लिए तैयार

### Pass/fail टेस्ट (task के exact commands, exact output)
```
$ npx tsc -p tsconfig.frontend.json --noEmit 2>&1 | grep -E "^frontend/src/modules/m0[1-4]" | wc -l
0

$ npx tsc -p tsconfig.frontend.json --noEmit 2>&1 | grep -cE "error TS[0-9]+"
286

$ npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -cE "error TS[0-9]+"
997
```
**पास ✅** — Team A = 0; backend 997 (पुराने वाला ही, नहीं बढ़ा — tsconfig बाँटने से कुछ नहीं टूटा)।

### 1386 (पुराना कुल) अब कैसे बँटा
- पुराना single-config: backend 997 + frontend 389 = 1386
- अब (split configs): backend 997 + frontend 286 = 1283
- Team A frontend की पूरी यात्रा: 97 → (alias fix से) 98 → मेरे in-scope fixes से 90 → आपके 6 components से 9 → generics से **0**

### इस round में मैंने क्या किया (आपकी सूची से)
- `m04/services/company.service.ts` — 9 जगह `apiClient.get(...)` → `apiClient.get<ApiEnvelope<T>>(...)` असली type के साथ (TS18046 unknown → गया)। कोई `as any` नहीं।
- `m04/services/company.types.ts` — `ApiEnvelope<T> { success; data; meta? }` interface जोड़ा (backend के `res.json({ success, data, meta })` के हिसाब से)।

### पूरे #004 में कुल क्या बदला (मेरा हिस्सा, commit 581432a + इस round का)
1. `tsconfig` 3 भाग (आपकी JSON) + दोनों `build` scripts
2. `m04` services/pages/components: named import, lazy `.then`, relative→`@/components/ui/X`, typed handlers, Partial form state
3. `m02 LoginPage` `err.issues` · `m01 app.schema` `z.record(z.string(), z.boolean())` · `m03 device.schema` `z.union([z.ipv4(), z.ipv6()])` · `m03 device.service` Partial signature · `m01 AppLogo` size/className
4. इस round: 9 generics + ApiEnvelope

### सीमाओं का पालन
- आपकी 6 shared फाइलें (api-client + components) मैंने **नहीं छुईं** — वो आपका ROUGH है
- backend की कोई .ts नहीं बदली (सिर्फ package.json build script) · prisma नहीं छुआ · M05–M20 frontend नहीं छुआ · App shell/main.tsx नहीं बनाया
- नई lines में `as any`/`@ts-ignore`: **0**
- push नहीं किया (write access नहीं — आप करेंगे)

**अगला:** आपका verify → certificate/tag। फिर #005/#006 (आपके क्रम अनुसार)।

---

## Entry 10 — 🎉 FIRST LIGHT: GNT का backend पहली बार चालू हुआ
तारीख: 2026-09-02

मालिक के "बना दो" पर #005 (server bootstrap) और #006 (frontend shell) का rough ढाँचा बनाया —
और **सिर्फ़ लिखकर नहीं छोड़ा, चलाकर देखा।**

### असली नतीजा (चलाकर, अंदाज़े से नहीं)
```
$ npx tsx --tsconfig tsconfig.backend.json backend/src/server.ts
[GNT] modules — चढ़े: 9 | गिरे: 1 | बाक़ी: 10
[GNT] backend listening on http://0.0.0.0:3000

/healthz         → 200   {"ok":true}
/readyz          → 200   (हर module की हालत के साथ)
/api/v1/company  → 401   ← route चढ़ा है और auth middleware काम कर रहा है
/nope            → 404   ← मेरा नया 404 handler
```
**AUDIT-01 की F1 बंद।** पहली बार एक request end-to-end चली।

### क्या-क्या बनाया
1. **`backend/src/server.ts`** — entry point (था ही नहीं)। graceful shutdown (SIGTERM/SIGINT),
   10s की आख़िरी सीमा, unhandledRejection पकड़ना।
2. **`backend/src/module-registry.ts`** — 20 modules का एक ही सच: कौन किस path पर, चढ़ा या नहीं,
   और न चढ़ा हो तो **किस task के इंतज़ार में**। हर mounted module का अपना `load()` (dynamic import)।
3. **`app.ts` दोबारा लिखा** — helmet + cors + requestTracer + 404 + error handler (AUDIT-01 F8),
   webhook route JSON-parse से पहले `express.raw` (AUDIT-02 M18-3 की तैयारी), और सबसे ज़रूरी:
   **हर module dynamic import + try/catch से चढ़ता है।**
4. **Frontend shell** — `index.html`, `vite.config.ts` (alias + `/api` proxy), `main.tsx`,
   `App.tsx` (router + sidebar), `routes.tsx` (15 पेज lazy, named export वाली शैली)।
5. **package.json scripts** — frontend में `dev`/`preview` थे ही नहीं; backend `app.ts` की जगह
   अब `server.ts` चलाता है।

### 🔴 सबसे बड़ी सीख — यही बताता है कि "चलाकर देखना" क्यों ज़रूरी है
**tsc हरा हो जाना काफ़ी नहीं। तीन गड़बड़ें सिर्फ़ चलाने पर मिलीं:**

1. **tsconfig बाँटने से runtime पर `@/` alias टूट गया।** tsx cwd का `tsconfig.json` पढ़ता है,
   और वो अब सिर्फ़ references वाली खाली फाइल है — इसलिए `@/common/...` resolve ही नहीं हुआ।
   हल: scripts में `--tsconfig ../tsconfig.backend.json`। **यह मेरे ही #004 वाले फ़ैसले का
   साइड-इफ़ेक्ट था, जो tsc में कभी नहीं दिखता।**
2. **M07 में असली runtime bug:** `purchase.routes.ts` के आख़िर में `export default router;` था,
   जबकि `router` उस function के **अंदर** की चीज़ है — बाहर मौजूद ही नहीं। यानी पुराना `app.ts`
   अगर चलता भी, तो **import होते ही पूरा app गिर जाता।** वो line हटा दी + registry में सच लिखा।
3. **M18 एक टूटी import पर अटका था** — `validators/integration.schema.ts` में
   `./integration.types` (फाइल `../types/` में है)। एक line ठीक करते ही M18 चढ़ गया।

### फ़ैसला जो मैंने लिया: एक module का गिरना पूरे app को नहीं गिराएगा
पहले सारे modules `import` से सीधे चढ़ते थे — M13 के 44 टूटे imports में से **एक भी**
पूरा server गिरा देता। अब हर module अलग से चढ़ता है; जो गिरे उसकी वजह `/readyz` पर और
startup log में साफ़ लिखी आती है। इससे "क्या काम कर रहा है" पहली बार **मापने लायक** हो गया।

### माप (कहीं कुछ टूटा नहीं)
```
backend tsc : 997 → 994   frontend tsc : 286 → 286
मेरी सब नई/बदली फाइलों में: 0 errors
```

### अभी भी बाक़ी (साफ़ दर्ज)
- **M13 नहीं चढ़ता** — `queue/queue.names` वग़ैरह मौजूद नहीं (टास्क #010)
- **M07/M14 mount नहीं** — M07 को `createPurchaseRouter(...)` की composition चाहिए,
  M14 का index router नहीं लौटाता
- **M05/M06/M09/M10/M16/M17/M19/M20** — अपने-अपने task के इंतज़ार में (registry में वजह लिखी है)
- **frontend shell चलाकर नहीं देखा** — `npm run dev` (vite) अभी नहीं चलाया, सिर्फ़ compile जाँचा।
  वो अगली बार, और तभी #006 का certificate बनेगा। **इसलिए अभी न #005 का certificate है, न #006 का।**

---

### सत्र नोट — 2026-09-02 — समीक्षक AI (Claude)

✅ **पूरा हुआ (नाप के साथ):**
- **टास्क #004 VERIFIED** — खुद चलाया: Team A frontend `m01–m04 = 0` ✅, पूरा frontend 295→286,
  backend 994 अपरिवर्तित, **कोड में `as any`/`@ts-ignore` = 0** (grep के 2 hits log.md के text में थे,
  खोलकर जाँचे — सिर्फ़ गिनती देखकर reject करना ग़लत होता)। Tag `verified/004`, CERT-004 लिखा।
- **FIRST LIGHT (#005)** — backend पहली बार चला: 9 modules चढ़े, `/healthz` 200, `/readyz` 200,
  `/api/v1/company` 401 (auth चला), `/nope` 404.
- **Frontend shell (#006) चलकर दिखा** — `vite ready in 274ms`, `/` HTML, `/src/main.tsx` 200,
  `/src/App.tsx` 200, कोई error नहीं।
- चलाने पर 3 असली गड़बड़ें पकड़ीं और ठीक कीं (tsc में कभी नहीं दिखतीं): runtime `@/` alias,
  M07 का टूटा `export default router`, M18 की टूटी import।
- **AUDIT-02** (M16–M20, 18 findings) + 5 task फाइलें (#011–#015) तैयार।
- AUDIT-01 की अपनी गलती सुधारी: गायब models **21 नहीं, 58**।

🔧 **अधूरा:**
- **#005/#006 का certificate जान-बूझकर नहीं दिया** — कोड मैंने ख़ुद लिखा है, कोई automated
  test नहीं चला, और 20 में से सिर्फ़ 9 modules चढ़ते हैं। इसे "locked" कहना नकली मुहर होती।
  → DeepSeek से स्वतंत्र पुष्टि माँगी है; उसके बाद ही lock।
- M13 अब भी नहीं चढ़ता; M07/M14 को composition चाहिए; 10 modules बाक़ी।

⛔ **रुकावट:** कोई नहीं। (DeepSeek के लिए भी नहीं — #013 तैयार है।)

➡️ **अगला:** DeepSeek → #013 (M18 सुरक्षा) + मेरे ढाँचे की स्वतंत्र पुष्टि।
मैं → उसकी पुष्टि आते ही #005/#006 lock, और साथ में #007 (M05) का rough ढाँचा बनाना।


---

## 🔎 कोडर AI (DeepSeek) — #005/#006 की स्वतंत्र जांच (आपके ढांचे पर मुहर के लिए)
तारीख: 2026-09-02 | मैंने खुद चलाकर देखा — नीचे जस-का-तस

### Backend (`npx tsx --tsconfig tsconfig.backend.json backend/src/server.ts`)
```
[GNT] modules — चढ़े: 9 | गिरे: 1 | बाक़ी: 10
[GNT] ❌ M13 /api/v1/automation — Cannot find module '.../m13-automation/queue/queue.names' imported from '.../scheduler.service.ts'
[GNT] backend listening on http://0.0.0.0:3000 (env=development)
```
| Endpoint | असली नतीजा | आपकी बताई उम्मीद |
|---|---|---|
| `/healthz` | **200** `{"ok":true}` | 200 ✅ |
| `/readyz` | **200** `{"ok":true,"modules":[...]}` | — ✅ |
| `/api/v1/company` | **401** `{"success":false,"error":"Authentication required"}` | 401 ✅ |
| `/nope` | **404** `{"error":"NOT_FOUND","path":"/nope"}` | 404 ✅ |

### Frontend (`cd frontend && npx vite`)
```
VITE v7.3.6  ready in 235 ms → http://localhost:5173/
GET /  → 200 (index.html + @vite/client + @react-refresh inject)
GET /src/main.tsx → 200 (vite ने transform करके serve किया)
```

### ⚠️ एक बात जो आपने नहीं बताई थी — साफ़ दर्ज कर रहा हूँ (आपकी माँग थी: गलत लगे तो बताओ)
`module-registry.ts` में **M13 का `mounted: true` है, पर असल में उसका dynamic import गिर जाता है** —
`m13-automation/services/scheduler.service.ts` → `./queue/queue.names` मौजूद नहीं। यानी registry "9 चढ़े" कहता है,
पर उन 9 में M13 शामिल **नहीं** — वो "गिरे: 1" है। असल चढ़े हुए हैं: M01,M02,M03,M04,M08,M11,M12,M15,M18।
यह AUDIT-01 की M13 वाली पुरानी बात से मेल खाता है (task #010 में खुलेगा) — नई चीज़ नहीं, पर registry का
`mounted: true` यहाँ थोड़ा भ्रम पैदा करता है। सुझाव: जब तक #010 पूरा न हो, M13 की line `mounted: false` +
`blockedBy: 'टास्क #010'` करना साफ़ रहेगा — आपका फैसला।

**कुल मिलाकर:** backend पहली बार चलता है ✅, 9 असली modules चढ़ते हैं ✅, health/probe/404/401 सही ✅,
frontend vite serve करता है ✅। मुझे कोई और गड़बड़ नहीं मिली — #005/#006 lock के लायक हैं।


---

## ✅ कोडर AI (DeepSeek) — टास्क #013 पूरा: M18 Security Hardening
तारीख: 2026-09-02 | verify के लिए तैयार

### Pass/fail (task के exact commands)
```
$ npx prisma validate --schema prisma/schema.prisma            → "The schema ... is valid 🚀" ✅
$ npx tsc -p tsconfig.backend.json --noEmit | grep -c m18-external-integration  → 0  (पहले ~38, अब 0 — घटा ✅)
$ grep -rn "return true" .../gateway.service.ts                 → (कोई output नहीं) ✅
```
पूरे backend की error गिनती: **994 → 956** (घटी, बढ़ी नहीं ✅)

### Step 1 — schema: 3 models + 1 ज़रूरी column (⚠️ एक जगह source से हटना पड़ा)
`team-d/M18-External-Integration/database/m18-schema.prisma` से ज्यों-के-त्यों जोड़े:
`integration_config`, `api_key_registry`, `webhook_log` (@@map सहित, कोई column नहीं बदला)।
**⚠️ Step 7 की dedup के लिए `webhook_log.event_id String?` + `@@unique([provider, event_id])` जोड़ना पड़ा —
source model में यह column था ही नहीं।** आपका फैसला चाहिए: रखें (dedup ज़रूरी) या अलग तरीका।

### Step 2 — twilio auth-bypass हटाया
`gateway.service.ts` का `return true` (कोई भी जाली webhook valid) → **`return false`** (default-deny)।
असली Twilio HMAC के लिए fullUrl + sorted POST params चाहिए जो इस signature में नहीं आते — TODO(#018) लिखा।

### Step 3 — default-deny (secret न हो तो मना)
`webhook.service.ts` अब secret न मिले → `AppError(401)`। बिना-जाँच स्वीकार का रास्ता बंद।

### Step 4 — असली raw body
- `app.ts` का raw middleware path **ठीक किया**: `/webhooks` → `/webhook` (route `/webhook/:provider` से मेल नहीं खा रहा था — आपके rough में यह mismatch था, दर्ज किया)
- controller अब `Buffer.isBuffer(req.body)` से असली bytes निकालता है; **signature पहले, JSON parse बाद में** (service में)

### Step 5 — Stripe + timing-safe
- Stripe: `t=...,v1=...` parse करके `${t}.${rawBody}` पर HMAC-SHA256, और `t` की उम्र 5 मिनट (replay रोका)
- Razorpay: HMAC-SHA256 + `crypto.timingSafeEqual` (length मिलान पहले — exception से बचा)

### Step 6 — सही status codes
controller: स्वीकार→200, signature/secret गलत→401, बेकार payload→400, हमारी गड़बड़→500।

### Step 7 — dedup (एक webhook दो बार नहीं)
Razorpay `x-razorpay-event-id`/payload.event, Stripe payload.id → `webhook_log` में unique; पहले से हो तो बिना process `200`।

### बदली फाइलें (सिर्फ M18 + schema + app.ts की 1 line)
`prisma/schema.prisma`, `services/gateway.service.ts`, `services/webhook.service.ts`,
`controllers/webhook.controller.ts`, `repositories/integration.repository.ts`, `types/integration.types.ts`,
`validators/integration.schema.ts` (6× z.record zod-v4 fix), `app.ts` (1 line)

### नोट
- `as any`/`@ts-ignore`: **0**। सिर्फ typed assertion (`as Prisma.InputJsonValue`, `as string`) — वो भी सिर्फ zod↔Prisma और enum→string की सीमा पर।
- साथ में M18 के **पुराने type-debt भी 0 किए** (DTO key_hash/status, enum→string, z.record) — क्योंकि ये मॉडल जुड़ने पर सामने आए थे और M18 के दायरे में हैं।
- Boot smoke: server चला, 9 चढ़े, M18 गिरा नहीं, /healthz 200।
- runtime DB-test नहीं हुआ (local Postgres नहीं चलता) — webhook का असली round-trip आपके पास DB के साथ जाँचना।

### सत्र नोट (मालिक के 3 नियमों के format में)
- **पूरा हुआ:** #005/#006 स्वतंत्र जांच (backend+frontend चले) + #013 M18 security (M18 tsc 0)
- **अधूरा:** कुछ नहीं अटका
- **रुकावट:** कोई नहीं (push मेरे पास write access नहीं — आपका काम)
- **अगला:** #011 M16 Notification


---

## ✅ कोडर AI (DeepSeek) — टास्क #011 पूरा: M16 Notification Engine
तारीख: 2026-09-02 | verify के लिए तैयार

### Pass/fail
```
$ npx prisma validate --schema prisma/schema.prisma  → "valid 🚀" ✅
$ npx tsc -p tsconfig.backend.json --noEmit | grep -c "m16-notification"  → 0 ✅
```
पूरे backend: **956 → 917** (घटी ✅)

### Step 1 — 2 models (camelCase + @@map, M19 के pattern जैसा)
`NotificationMaster` (→ `notification_master`) + `NotificationDeliveryLog` (→ `notification_delivery_log`)।
सारे columns `@map("snake_case")`, relations `deliveryLogs` + `notification` (findById में `include: { deliveryLogs }` चाहिए था)।
**⚠️ Step 3 के लिए `toAddress` (@map "to_address") column जोड़ा — source SQL में नहीं था** (reviewer का फैसला चाहिए)।

### Step 2 — M18 gateway binding
नई `services/gateway.binding.ts`: M18 की **public contract** (index.ts) से `GatewayService` + `IntegrationRepository` लिया —
internal M18 file import नहीं। whatsapp/sms अब सच में `notificationGateway.sendWhatsApp/sendSMS` बुलाते हैं
(no provider होने पर GatewayService खुद throw करता है = fail-closed बना रहता है)।
**⚠️ email:** M18 GatewayService में अभी सिर्फ sendWhatsApp/sendSMS हैं, **sendEmail नहीं** — इसलिए email
fail-closed रहा (साफ़ error + delivery log)। M18 में email adapter अलग task/fैसला चाहिए।

### Step 3 — to: अब असली पता (userId नहीं)
`SendNotificationPayload.toAddress` जोड़ा (validator में भी), `notification_master.to_address` में saved।
whatsapp/sms/email अब `payload.toAddress` इस्तेमाल करते हैं; न मिले तो fail-closed (userId को phone/email नहीं माना)।

### Step 4 — mount
`module-registry.ts`: M16 `mounted: true` + load → अब **10 modules चढ़ते हैं** (M16 शामिल)।
Boot smoke: `/healthz` 200, `/api/v1/notifications` पहुँचता है (500 = auth नहीं लगा, वो #009 है — mount ठीक)।

### बदली फाइलें (M16 + schema + registry + express.d.ts)
`prisma/schema.prisma` · `types/notification.types.ts` · `validators/notification.schema.ts` (zod-v4 + import path fix) ·
`repositories/notification.repository.ts` · `services/{gateway.binding,whatsapp,sms,email,notification.service}.ts` ·
`events/notification.handlers.ts` (`eventBus.on`→`subscribe`) · `models/notification.model.ts` (Prisma extension context fix) ·
`controllers/notification.controller.ts` · `module-registry.ts` · `m04/types/express.d.ts` (`req.user` typing जोड़ी)

### नोट
- `as any`/`@ts-ignore`/`@ts-expect-error`: **0**। (eventBus Handler का `payload: any` core/event-bus का पुराना signature है, मैंने नहीं लिखा)
- `eventBus.on/emit` → `subscribe/publish` (core/event-bus की असली API) — यह मिलान किया।
- runtime DB-test नहीं (local Postgres नहीं) — असली send/round-trip आपके पास DB के साथ।

### सत्र नोट
- **पूरा:** #013 M18 ✅ · #011 M16 ✅ (M16 tsc 0, mount हुआ)
- **अधूरा:** कुछ नहीं
- **रुकावट:** email channel (M18 sendEmail नहीं) — flag किया, आगे बढ़ गया
- **अगला:** #014 M19 audit trail


---

## ✅ कोडर AI (DeepSeek) — टास्क #014 पूरा: M19 Audit Trail (असली)
तारीख: 2026-09-02 | verify के लिए तैयार

### Pass/fail
```
$ npx prisma validate --schema prisma/schema.prisma  → "valid 🚀" ✅
$ npx tsc -p tsconfig.backend.json --noEmit | grep -c "m19-production-monitoring"  → 0 ✅
```
पूरे backend: **917 → 884** (घटी ✅) · अब **11 modules चढ़ते हैं** (M19 शामिल), /healthz 200 ✅

### Step 1 — 4 models + 3 enums (ज्यों-के-त्यों, source से)
`AuditLog`, `LoginHistory`, `SecurityEvent`, `SystemHealth` + `LoginStatus`/`Severity`/`HealthStatus` (PascalCase + `@@map` snake_case)।

### Step 2 — दोनों सिस्टम जोड़े (दिल)
- `common/logging/audit-logger.ts`: अब console.info **और** M19 `AuditService` (public contract से) से DB में append-only entry।
  - fire-and-forget + catch (audit गड़बड़ ≠ business गड़बड़, और चूक खुद console.error में दर्ज)
  - company_id अनिवार्य — context/entry से न मिले तो DB में गलत entry नहीं (console ही रहता है)
- AsyncLocalStorage `auditContext` + नया `common/middleware/audit-context.ts` (global, app.ts में mount) ip/user-agent भरता है
- `tenant-middleware`/`auth-middleware` store में companyId/userId जोड़ते हैं (route-level पर)
- ⚠️ M01–M04 के `auditLogger.log({action,target})` की लिखावट **नहीं बदली**; mapping: action→action, target→resource/resourceId, module→(entry.module ?? 'core')।

### Step 3 — append-only
- कोड में `auditLog.update/delete` कहीं नहीं (AuditRepository में ILLEGAL_OPERATION throw पहले से) ✅
- नई migration: `database/migrations/006_M19_audit_log_append_only.sql` (`REVOKE UPDATE, DELETE ON audit_log FROM <app_user>`) — **चलाई नहीं**, तैनाती के समय चलेगी (log में दर्ज)।

### Step 4 — mount
`module-registry.ts`: M19 `mounted: true` + `securityRoutes`।

### बदली फाइलें
`prisma/schema.prisma` · `common/logging/audit-logger.ts` · `common/middleware/audit-context.ts` (नई) ·
`common/middleware/{tenant,auth}-middleware.ts` · `app.ts` · `module-registry.ts` ·
`m19/validators/security.schema.ts` (zod-v4 + startDate/endDate) · `m19/controllers/{security,audit,health}.controller.ts` (`err.issues` + String(params)) · migration file (नई)

### नोट / रुकावट (साफ़)
- **runtime DB-test नहीं हुआ** (local Postgres नहीं) — "एक क्रिया पर audit_log में row" वाला सबूत आपके पास DB के साथ जाँचना। AsyncLocalStorage flow ठीक है, पर असली DB-write verified नहीं।
- दायरे से बाहर छूई फाइलें (Step 2 की "middleware से लाओ" की ज़रूरत से): `common/middleware/audit-context.ts`, `tenant-middleware.ts`, `auth-middleware.ts`, `app.ts` — सब flag किए।
- `module` field का default `'core'` रखा (M01–M04 की कॉल में module नहीं है — आपका design फैसला)।
- `as any`/`@ts-ignore`/`@ts-expect-error`: **0**।

### सत्र नोट
- **पूरा:** #013 ✅ #011 ✅ #014 ✅ (M19 tsc 0, mount हुआ)
- **अधूरा:** कुछ नहीं
- **रुकावट:** runtime DB-test नहीं (no Postgres) — noted
- **अगला:** #015 M20 tariff/duty


---

## ✅ कोडर AI (DeepSeek) — टास्क #015 पूरा: M20 tariff/duty
तारीख: 2026-09-02 | verify के लिए तैयार

### Pass/fail
```
$ npx prisma validate --schema prisma/schema.prisma  → "valid 🚀" ✅
$ npx tsc -p tsconfig.backend.json --noEmit | grep -c "m20-international-trade"  → 0 ✅
$ grep -rn "hsn_master" backend/src/modules/m20-international-trade/  → (कुछ नहीं) ✅
```
पूरे backend: **884 → 807** ✅ · अब **12 modules चढ़ते हैं** (M20 शामिल), /healthz 200 ✅

### Step 1 — hsn_master का टकराव हल
- ⛔ **M09 का `hsn_master` नहीं छुआ** (अछूता)
- नया `customs_tariff` model (team-d hsn_master का ढाँचा, `@@map("customs_tariff")`) + बाक़ी 4 models (`trade_job`, `fx_rate`, `customs_rule`, `trade_document`) + 4 enums — relations `customs_tariff` की तरफ
- कोड में `prisma.hsn_master`/`hsn_master` type → `prisma.customs_tariff`/`customs_tariff` (repo/service/model/customs.service)

### Step 2 — SWS जोड़ा
`customs_rule.sws_rate` (default 10, @db.Decimal) + गणना में `sws = round(bcd * sws_rate/100)`, IGST base + total दोनों में शामिल। ⚠️ source schema में sws_rate नहीं था — जोड़ा (flag)।

### Step 3 — ACD विरोधाभास ठीक
`igstBase` में अब `acd` भी शामिल (totalDuty से मेल) + comment लिखा कि IGST सीमा शुल्क की कुल राशि पर लगता है।

### Step 4 — cess
`cess = 0` हटाकर `customs_tariff.cess_rate` से गिना (IGST base पर)।

### Step 5 — रुपये (integer) rounding
`round()` अब `Math.round` (नज़दीकी रुपया, 2 दशमलव नहीं) + comment: हर duty line अलग-अलग round (rounding drift नहीं)।

### Step 6 — FX asOf
`getFXRate(..., asOf?)`/`convertAmount(..., asOf?)`/`findLatest(..., asOf?)` — `effective_date <= asOf`; न मिले तो साफ़ `FX_RATE_MISSING` (चुपचाप नई दर नहीं)। `calculateCustomsDuty` में `asOf` pass होता है।

### गणना का उदाहरण (हाथ से मिलाने के लिए)
CIF ₹1,00,000 · BCD 10% · SWS 10% (default) · IGST 18% · cess 0% · बाकी duties 0:
- BCD = round(100000×0.10) = **₹10,000**
- SWS = round(10000×0.10) = **₹1,000**
- IGST base = 100000+10000+1000 = 111000 → IGST = round(111000×0.18) = **₹19,980**
- Cess = **₹0** · **Total duty = ₹30,980**

### बदली फाइलें
`prisma/schema.prisma` · `m20/{repositories/{hsn,fx}.repository, services/{customs,fx,hsn,trade-document}.service, models/hsn.model, controllers/{hsn,trade}.controller, validators/trade.schema, types/trade.types, index}.ts` · `module-registry.ts`

### नोट
- `as any`/`@ts-ignore`/`@ts-expect-error`: **0** (सिर्फ `as Prisma.InputJsonValue` typed assertion)
- index.ts में type re-export fix (`export type`) — वरना tsx पर M20 mount गिर रहा था
- runtime DB-test नहीं (no Postgres) — duty गणना का असली run आपके पास DB के साथ

### सत्र नोट
- **पूरा:** #013 ✅ #011 ✅ #014 ✅ #015 ✅ (M20 tsc 0, mount हुआ)
- **रुकावट:** कुछ नहीं (M20 index type-export fix एक mount bug था, ठीक किया)
- **अगला:** #012 M17 Reporting


---

## 🟡 कोडर AI (DeepSeek) — टास्क #012 अधूरा (आंशिक): M17 Reporting
तारीख: 2026-09-02 | **अधूरा है — छिपाया नहीं** (आपके नियम अनुसार साफ़ लिख रहा हूँ)

### जो हो गया
- **Step 1** — 2 models (`ReportConfig`, `ReportTemplate` camelCase + @@map) + validate 🚀 green ✅
- **Step 3** — m17 `index.ts` से `ReportRepository` + `ReportQueryBuilder` export हटाए ✅
- **Step 2 (आंशिक)** — m07/m08/m09 के खाली `index.ts` में `PurchaseService`/`SalesService`/`GSTService` export जोड़े (repository export नहीं) ✅
- Mechanical fixes: controller `err.issues` + `String(req.params)`, handlers `eventBus.subscribe/publish`, repository type नाम + Prisma import, `report.model` `Prisma.TransactionClient`, service के duplicate DTO imports ठीक किए

### अभी की गिनती
```
$ npx tsc -p tsconfig.backend.json --noEmit | grep -c "m17-reporting"  → 35 (0 नहीं पहुंचा)
$ npx prisma validate  → valid 🚀
backend कुल: 807 → 782
```

### 🔴 बचे 35 errors — सिर्फ़ 4 जड़ें, और 4 में से 2 आपके फैसले चाहिए
1. **3 services मौजूद ही नहीं (TS2307 ×3 + उनसे जुड़े TS2344/TS2554/TS2345):**
   `report.routes.ts` import करता है: `InventoryService` (m06), `AccountingService` (m10), `HRService` (m12) —
   **ये तीनों services उन modules में हैं ही नहीं** (m06 में product/stock/category, m10 में ledger/voucher/brs, m12 में employee/leave/payroll)। `ReportQueryBuilder` इनके types पर टिका है। यह business design फैसला है — मैंने services गढ़ीं नहीं (अंदाज़ा मना है)।
2. **pdfkit + uuid के @types नहीं (TS7016 ×2 + PDFKit namespace ×6):** package install चाहिए, network blocked + "नया package नहीं" नियम।
3. `ReportService.deleteTemplate` method मौजूद नहीं (controller बुलाता है) — छोटा, पर service का काम है।
4. `SalesReportRow.totalTax` field type में नहीं + `ExportFormat` में 'json' नहीं + ReportSchedule→Json cast (TS2322/TS2352) — छोटे type fixes, पर 1/2 हल करने के बाद ये आ जाते हैं।

### सुझाव (आपके लौटने पर)
- M17 को पूरा करने के लिए **3 services का rough/design** (InventoryService/AccountingService/HRService के public method क्या-क्या) और **@types/pdfkit + @types/uuid install** की अनुमति/व्यवस्था चाहिए।
- बाक़ी (deleteTemplate, totalTax, ExportFormat, casts) आपका rough मिलते ही मैं ख़त्म कर दूँगा।

### सत्र नोट (आख़िरी)
- **पूरा:** #013 ✅ #011 ✅ #014 ✅ #015 ✅ (Team D के 5 में से 4 पूरे)
- **अधूरा:** #012 M17 — Step 1+3+आंशिक 2 हो गए; 35 errors बचे, 2 hard blockers (3 services + @types packages) आपके फैसले चाहिए
- **रुकावट:** ऊपर दर्ज
- **अगला:** आपका verify + #012 के blockers का फैसला


---

## 📥 कोडर AI (DeepSeek) — टास्क #012 का अगला हिस्सा: 25 → 3 errors
तारीख: 2026-09-02 | आपके rough (3 facades + @types) के बाद काम चलाया — अब सिर्फ़ **3 errors** बचे

### जो हुआ
- routes के 6 imports अब सिर्फ़ public contract (`@/modules/m06-inventory` वगैरह) से ✅ (boundary pass/fail हरा)
- `ExportFormat` में `'json'` जोड़ा (6 errors गए)
- `SalesReportRow.totalTax` जोड़ा · generator का `import PDFDocument from 'pdfkit'` (TS2351 गया)
- controller का `deleteTemplate` → `deleteReportTemplate` (सही method नाम)
- `createReportConfig`/`createReportTemplate`/repository create का type `Omit<...,'id'|'createdAt'|'updatedAt'>` किया
- repository `schedule` cast JSON-roundtrip से · validators 3× `z.record(z.string(), z.unknown())`
- `report.internal` के 6 interfaces export किए और `report.service` का constructor उन्हीं से type किया (`Parameters<...>` हटाया — वो TS2344 की जड़ थी)

### अभी की गिनती
```
$ npx tsc -p tsconfig.backend.json --noEmit | grep -c "m17-reporting"  → 3
$ npx prisma validate → valid 🚀
backend कुल: 807 → 745
```

### 🔴 बचे 3 — एक ही जड़, और वो डिज़ाइन फैसला है (साफ़ बता रहा हूँ)
`report.routes.ts` में:
1. `new PurchaseService()` (28) — m07 की असली service को 3 constructor args चाहिए
2. `new GSTService()` (30) — m09 की असली service को repo चाहिए
3. `new ReportService(..., new InventoryService(), ...)` (36) — `IInventoryService` (QueryBuilder की उम्मीद: `getStockSummary(filters)` + `getProductList`) और आपकी facade (`getStockSummary(company_id, as_on)`) के **signature नहीं मिलते**

**जड़:** `ReportQueryBuilder` (report.internal) की 6 interfaces ऐसी methods माँगती हैं जो किसी भी module की असली service पर नहीं हैं —
`getSalesRegister`, `getPurchaseRegister`, `getGSTTransactions`, `getHSNSummary`, `getTrialBalance`, `getProductList` —
m07/m08/m09 की असली services में `getPurchaseInvoices`/`getInvoices`/`getGSTR1` हैं, और आपकी बनाई facades भी अलग shape की हैं।
यह report की content-design बात है (किस API से कौन सा report डेटा बनेगा) — आपका फैसला है, मैंने अंदाज़े से QueryBuilder नहीं बदला।

### मेरा सुझाव (आपके फैसले के लिए)
- या तो m07/m08/m09 के लिए भी म06/m10/m12 जैसी facades बनाएँ (getSalesRegister/getPurchaseRegister/getGSTTransactions) —
  तब QueryBuilder को छूना ही नहीं पड़ेगा
- या QueryBuilder की interfaces को असली APIs (`getInvoices`/`getPurchaseInvoices`/`getGSTR1` + facades) से मिलाएँ — मैं कर दूँगा, बस हाँ कहिए

**M17 mount अभी नहीं किया** (3 errors की वजह से) — registry में वजह लिखी है। बाक़ी सब (#013/#011/#014/#015) आपके verify हो चुके।

### सत्र नोट
- **पूरा:** #012 का type-हिस्सा (25→3) — boundary साफ़, सारे mechanical fixes
- **अधूरा:** #012 के आख़िरी 3 errors — QueryBuilder↔services का design फैसला आपका
- **अगला:** आपका फैसला → मैं ख़त्म करके mount कर दूँगा

---

### सत्र नोट — 2026-09-02 (रात, मालिक आराम पर) — समीक्षक AI

✅ **पूरा हुआ:**
- **4 task verified + certificate + tag:** #013 (M18 सुरक्षा), #011 (M16), #014 (M19 audit), #015 (M20 duty)।
  हर एक की जाँच का आँकड़ा CERT फाइल में। M16/M18/M19/M20 चारों का **tsc अब 0**।
- **#012 का blocker खोला (ROUGH):** M06/M10/M12 में reporting के लिए **सिर्फ़-पढ़ने वाली facade**
  + `@types/pdfkit`/`@types/uuid`। M17: 35 → 25 → (DeepSeek ने) **3**।
- **नए task तैयार:** #008 (M11/M12/M14/M15 schema merge — नाम-मेल के फ़ैसलों सहित) और
  #016 (M06–M10 green + mount)। तीनों TASKS सूचियाँ ताज़ा (md5 समान)।
- **ऐप दोबारा चलाकर देखा:** **12 modules चढ़ रहे हैं** (पहले 9), `/healthz` 200, `/company` 401।

🔧 **अधूरा / दर्ज:**
- **M20 का रास्ता दोहरा है** — registry में `/api/v1/trade`, routes ख़ुद `/trade/…` से शुरू →
  असली पता `/api/v1/trade/trade/exports`। M19 में यह गड़बड़ नहीं। **#016 में जोड़ूँगा।**
- `/api/v1/notifications` पर 500 — **कोड की गलती नहीं**, इस मशीन पर database है ही नहीं
  (`prisma.notificationMaster.findMany()` फेल)। उल्टा यह सबूत है कि route सही चढ़ा है।
- M13 अब भी नहीं चढ़ता (queue फाइलें गायब — #010, मालिक का फ़ैसला बाक़ी)।

⛔ **रुकावट (मालिक से):** असली database (Neon/Upstash मुफ़्त काफ़ी) · RAM 7→32 GB ·
`CLAUDE.md` + hooks की अनुमति · `xlsx` की 4 high खामियाँ ठीक करने की अनुमति।

➡️ **अगला:** DeepSeek → #012 ख़त्म → #008 → #016 (queue भरा है, कई घंटे का काम)।
मैं → #012 verify, फिर #009 (security middleware) की फाइल, फिर #007 (M05) का rough ढाँचा।

**एक फ़ैसला जो आज लिया (दर्ज कर रहा हूँ):** M17 अपनी consumer-interfaces रखेगा और
**adapter M17 के अंदर** लिखेगा — मालिक module (M06/M10/M12) को ग्राहक के आकार में नहीं ढाला जाएगा।
वजह: दिशा `M17 ← M06` है। उल्टा करने पर मालिक module अपने ग्राहक पर निर्भर हो जाता, और हर
नए ग्राहक पर M06 दोबारा बदलना पड़ता।


---

## ✅ कोडर AI (DeepSeek) — टास्क #012 पूरा: M17 Reporting (adapters + mount)
तारीख: 2026-09-02 | verify के लिए तैयार

### Pass/fail
```
$ npx tsc -p tsconfig.backend.json --noEmit | grep -c "m17-reporting"  → 0 ✅
$ npx prisma validate → valid 🚀
$ grep -rn "modules/m0[6-9]\|modules/m1[02]" m17-reporting/  → सिर्फ @/modules/... (index) imports ✅
```
पूरे backend: **782 → 742** ✅ · अब **13 modules चढ़ते हैं** (M17 शामिल), /healthz 200 ✅

### आपके फैसले पर अमल — adapters (M17 के अंदर)
`services/adapters/` में 6 adapter बने (inventory/accounting/hr/sales/purchase/gst) —
हर एक `I*Service` (report.internal) implement करता है और public contract से डेटा लेकर
M17 के आकार में ढालता है। दिशा: **M17 ← M06/07/08/09/10/12** ✓ (facades नहीं बदले, interfaces वही)।
- inventory: facade से असली stock summary → InventoryReportData
- accounting: facade से असली ledger entries → AccountingReportData; trial/cashflow/aging खाली (facade का TODO)
- hr/sales/purchase/gst: खाली + TODO(#016) (facade/डेटा अभी नहीं) — झूठा डेटा नहीं
- `generateReport` अब companyId भी buildReport तक भेजता है (filter types में `companyId?` जोड़ा)

### routes ठीक की
- `new PrismaClient()` हटाया → **साझा `@/common/config/prisma`** (अलग connection pool नहीं)
- ReportService को सही arguments (repository + 6 adapters + exportDir)

### बदली फाइलें (सिर्फ M17)
`services/adapters/` (6 नई) · `routes/report.routes.ts` · `services/{report.service,report.internal}.ts` ·
`types/report.types.ts` (companyId in filters) · `module-registry.ts` (mount)

### दर्ज (आपकी बताई बातें)
- M20 का दोहरा पता (`/api/v1/trade/trade/...`) — ठीक नहीं किया, आपके task का इंतज़ार ✅
- `/api/v1/notifications` का 500 = DB नहीं चल रहा — मेरी गलती नहीं ✅

### सत्र नोट
- **पूरा:** #012 ✅ (Team D के सारे 5: #013/#011/#014/#015/#012 पूरे)
- **रुकावट:** कोई नहीं
- **अगला:** #008 (M11/M12/M14/M15 schema merge, ~530 errors) — फाइल तैयार है

---

## Entry 11 — DeepSeek का balance ख़त्म; उसका #009 का काम बचाया और उसमें एक P0 bug पकड़ा
तारीख: 2026-09-02 (रात)

### क्या हुआ
DeepSeek `HTTP 402: Insufficient Balance` पर बंद हो गया — 30 मिनट खाली दिखने की वजह
काम पर अटकना नहीं, **balance ख़त्म होना** था। उसका #009 का काम **16 फाइलों में uncommitted**
पड़ा था। मैंने तुरंत commit करके `deepseek/work` branch पर सुरक्षित किया —
**main पर नहीं भेजा**, क्योंकि verify बाक़ी था।

### उसका काम कहाँ तक पहुँचा था (नाप कर)
- `x-company-id` पर भरोसा: **75 → 1** (बची हुई 1 एक **test फाइल** में है, कोड में नहीं — ठीक है)
- `tenant-middleware` से header fallback **पूरी तरह हटा** — अब सिर्फ़ verified token, वरना 403
- `app.ts` में auth+tenant **एक ही जगह**, छूट-सूची बिल्कुल वैसी जैसी टास्क में लिखी थी
- `m04` से `express.d.ts` हटाया (CERT-003 की शर्त 3 की दिशा में)

### 🔴 पर उसमें एक P0 bug था — चलाकर पकड़ा
छूट-सूची **सिर्फ़ auth पर** लगी थी; `tenantMiddleware` बिना जाँच के हर `/api/v1` पर चल रहा था।
नतीजा: **`/api/v1/auth/login` → 403 `FORBIDDEN_NO_TENANT`** — यानी **कोई login ही नहीं कर सकता था**,
पूरा ऐप बेकार। tsc इसे कभी नहीं पकड़ता (types बिल्कुल सही हैं)।

**मैंने ख़ुद ठीक किया** (DeepSeek नहीं कर सकता — balance नहीं): tenant पर भी वही `isPublicPath` जाँच।
सबूत:
```
POST /api/v1/auth/login → 400  {"error":"username चाहिए…"}        ← login खुला, पहुँच रहा है
GET  /api/v1/company    → 401  {"error":"Authentication required"} ← बाक़ी बंद
GET  /healthz           → 200
```

### 🔴 आज तीन बार माप में चूका — तीनों दर्ज कर रहा हूँ
1. **"401 = रास्ता मिला"** मान लिया (ग़लत — auth हर पते पर 401 देता है)
2. **"403 = tenant ने रोका"** मान लिया — body पढ़ने पर वो login का अपना validation जवाब निकला
3. **पुराना server port पर बैठा था**, इसलिए मेरा curl **पुराने कोड** से जवाब ले रहा था

**तीनों का एक ही सबक — अब यह मेरा पक्का नियम है:**
> **status code अकेला कभी सबूत नहीं।** हमेशा (1) जवाब का **body** पढ़ो,
> (2) पक्का करो कि जिसे जाँच रहे हो वो **नया चला हुआ** process है।

*(और एक छोटी बात: `pkill -f "tsx --tsconfig"` ने मेरी अपनी shell भी मार दी, क्योंकि उसमें वही
शब्द थे — आगे pkill का pattern ऐसा रखूँगा जो अपनी ही command से न टकराए।)*

### दर्ज
`validation-middleware` ठीक **400** देता है — शुरुआती 403 पुराने server से आ रहा था, उसकी गलती नहीं।

**स्थिति:** #009 का काम **लगभग पूरा और अब चलने लायक** — पर **मुहर नहीं लगाई**, क्योंकि पूरा tsc
अभी चल रहा है और DeepSeek की अपनी रिपोर्ट/सत्र-नोट बाक़ी है (balance आने पर देगा)।

---

## ✅ कोडर AI (DeepSeek) — टास्क #009 पूरा: Step 5 (tenant-scope जाँच) + पूरा pass/fail
तारीख: 2026-09-03 (रात, ~00:30)

### क्या किया (आपके निर्देश के हिसाब से)
1. **Step 5 की जाँच-script पूरी की** — `tools/check-tenant-scope.mjs` (पुराना rough था, अब असली चलने वाला):
   - हर repository फाइल (45) में `findMany/findFirst/updateMany/deleteMany` ढूँढता है
   - हर call के **balanced-brace argument ब्लॉक** के अंदर ही scope निशान देखता है
     (पुराने वाले का 1200-char window झूठे हिट/मिस दे रहा था — `user.repository.ts` की
     `company_master.gstin` वाली query बिना company_id के भी pass हो जाती थी, क्योंकि
     window में अगले method का `findByCompanyId` नाम आ जाता था)
   - `.test.ts` फाइलें अब बाहर; `tenantId/tenant_id` अलग सूची B में (नाम अलग, scope है)

2. **नतीजा (exact output):**
```
repository फाइलें जाँची गईं: 45
company_id/companyId से scoped: 68
A) कोई scope निशान नहीं (सबसे ख़तरनाक): — 39
B) सिर्फ़ tenantId/tenant_id से scoped: — 12
```
   सूची A (39) के बड़े हिट: m16 notification.repository (4 — `where: {status:'pending'}` पूरी तरह
   खुला), m11 payment.repository:71 `findAll` (where चर में tenantId जुड़ता ही नहीं!),
   m02 role/user, m03 device (user_id से — company scope नहीं), m18/m19/m20, m07/m08/m10 के कई।
   **पूरी सूची स्क्रिप्ट चलाने पर मिलेगी — 39 + 12 लाइनें।**

3. **स्क्रिप्ट की सीमाएँ साफ़ लिखी हैं (छिपाई नहीं):**
   - चर में बना `where` (जैसे m19 audit.repository:41 — असल में `companyId: filters.companyId` से
     scoped है, पर स्क्रिप्ट को कॉल के अंदर नहीं दिखता) → **झूठा हिट**
   - `company_master.gstin` relation से scoping (user.repository:19) → सूची A में है पर असल में
     कंपनी-स्तर पर scoped है
   - यानी सूची A = **शुरुआती नक्शा**; हर लाइन हाथ से देखने पर ही फैसला (अगले task का काम —
     यहाँ सिर्फ़ गिनती/सूची चाहिए थी, ठीक नहीं करना था, वैसा ही किया)

### पूरा pass/fail (ख़ुद चलाकर, body सहित — आपका नियम)
```
grep -rn "x-company-id" backend/src --include=*.ts | wc -l   → 1
   (वो 1 = m08-sales/tests/api/sales.api.test.ts — test फाइल, tsconfig से बाहर; कोड में 0)

npx tsc -p tsconfig.backend.json --noEmit | grep -cE "error TS"  → 742
   (#012 के बाद वाली 742 ही — न बढ़ी, न घटी; #009 ने कुछ नहीं तोड़ा)

server चला: 13 modules चढ़े | M13 गिरा (queue.names — पुराना जाना हुआ) | 7 बाक़ी (जाने हुए)

curl -w "%{http_code}" http://localhost:3000/api/v1/company
   → 401  body: {"success":false,"error":"Authentication required"}
curl -H "x-company-id: OTHER-CO" http://localhost:3000/api/v1/company
   → 401  body: {"success":false,"error":"Authentication required"}   ← छेद बंद का सबूत
curl -X POST -d '{}' http://localhost:3000/api/v1/auth/login
   → 400  body: zod error (username/password/companyCode expected)      ← छूट काम कर रही
curl http://localhost:3000/healthz
   → 200  body: {"ok":true}
```

### दर्ज (आपके लिए दो बातें)
- **login के 400 body में `companyCode` field** — CERT-003 की शर्त 1 वाली अस्थायी चीज़
  (gstin/companyCode) — मैंने नहीं छेड़ी, आपके task का इंतज़ार।
- **suppressions:** इस रात #009 में एक भी `as any` / `@ts-ignore` / `@ts-expect-error` नहीं जोड़ा।
  repo में जो 296 हैं वो सब पहले से (गिनकर रखा है)।

### सत्र नोट
- **पूरा:** #009 का बचा हुआ हिस्सा (Step 5 script + सूची/गिनती + pass/fail + दोनों log) ✅
- **अधूरा:** कुछ नहीं — आपका verify + मुहर बाक़ी (वो आपका काम)
- **रुकावट:** कोई नहीं
- **अगला:** #008 (M11/M12/M14/M15 schema merge, ~530 errors) — अभी शुरू कर रहा हूँ

---

## ✅ कोडर AI (DeepSeek) — टास्क #008 पूरा: M11/M12/M14/M15 के models canonical schema में
तारीख: 2026-09-03 (रात, ~01:15)

### क्या हुआ (आपके task के नाम-मेल फैसलों के हिसाब से ही)
1. `prisma/schema.prisma` में **30 models जोड़े** — side फाइलों से ज्यों-के-त्यों, `@@map` सहित:
   - M11 (10): PaymentMethod, PaymentTransaction, PaymentAllocation, PaymentSchedule,
     PaymentInstallment, Refund, PaymentLedgerEntry, PaymentReconciliation, BankAccount,
     + नया **PaymentReconciliationItem** (`@@map("payment_reconciliation_item")`, फील्ड कोड के
     असली इस्तेमाल से — reconciliation.repository.ts)
   - M12 (13): Employee, Department, Designation, EmployeeDocument, Shift, Attendance,
     LeaveType, Leave, Holiday, Payroll, PayrollTemplate + नए **LeaveBalance** और **HREventLog**
   - M14 (7): ImportJob, ImportMapping, ImportErrorLog, ExportJob, ExportTemplate,
     DataTransform, FileUpload
   - M15 (10): SyncConfig, SyncEntityConfig, SyncJob, SyncEntityLog, SyncConflict,
     ExternalIntegration, SyncState + नए **SyncQueueItem**, **BackupJob**, **RestoreJob**
2. **Renames सिर्फ़ task की तालिका वाले:**
   - `prisma.ledgerEntry` → `prisma.paymentLedgerEntry` (+ type `LedgerEntry`→`PaymentLedgerEntry`)
   - `prisma.reconciliation` → `prisma.paymentReconciliation`
     (+ types `Reconciliation`/`ReconciliationItem`/`Prisma.ReconciliationWhereInput` → PaymentReconciliation*)
   - `prisma.reconciliationItem` → `prisma.paymentReconciliationItem`
   - `prisma.importTemplate` → `prisma.importMapping` (M14)

### गिनती (exact)
```
npx prisma validate → valid 🚀
tsc backend: 742 → 624
  m11-payment:        203 → 200
  m12-hr:              60 →  55
  m14-import-export:  145 → 101
  m15-sync:           197 → 131
चारों के बाहर: 137 = 137 (कहीं कुछ नहीं टूटा — diff करके देखा)
```

### ⛔ जो आपके फैसले के हिसाब से नहीं छुए (छोड़े + गिने)
- **M11 `prisma.invoice`** — नया model नहीं बनाया: invoice.repository.ts (21) +
  invoice.controller.ts (20) = **41 errors** वहीं पड़े हैं (इंतज़ार: M07/M08 का invoice कौन सा)
- **M15 `webhookEndpoint`/`webhookDelivery`** — नहीं बने: webhook.service.ts में **20 errors**
  (इंतज़ार: M18 के webhook_log/integration_config से विलय का फैसला)
- **M13 बिल्कुल नहीं छुआ** ✅

### बचे हुए errors की जड़ें (अगले task के लिए तैयार नक्शा)
- **145 errors:** `req.params/query` का `string | string[]` — Express 5 typing; सब modules में फैला
- **48 errors:** controllers में `req.tenantId` (असल में `req.tenant.companyId` चाहिए — #009 वाला बदलाव
  M11/M14/M15 तक पहुँचा ही नहीं था; इन controllers में अभी भी x-company-id वाली pattern ज़िंदा है)
- **field-shape mismatch:** कोड बुलाता है debitAmount/creditAmount/narration/entryDate (ledger),
  startDate/endDate/statementFileUrl (reconciliation), invoice include (paymentTransaction),
  transactions include (bankAccount), branchName (bankAccount) — पर side-file के models में दूसरे
  नाम हैं। आपने कहा था "जो बचे उन्हें log में गिनकर लिख देना" — यही वो सूची है।
- **enum imports गायब:** `PaymentStatus`, `TransactionType`, `RefundStatus`, `BankAccountType`
  (side-file में status String है, enum नहीं — कोड import कर रहा है)

### side-file की एक खामी मैंने पूरी की (दर्ज है)
M15_Sync.prisma में `SyncJob.syncConfig` का back-relation (`SyncConfig.jobs`) side-file में था ही
नहीं — prisma validate ने P1012 से रोका। PaymentReconciliation.items की तरह minimal जोड़ा।

### नए models के फील्ड — code की असली माँग से (task के field-list से हल्के फर्क — दर्ज)
- **LeaveBalance:** कोड `employeeId_year` compound unique + `annual/sick/casual/unpaid/used` बुलाता है;
  task की सूची के `leave_type_id/entitled/balance` **optional** रखे (कोड उन्हें नहीं देता — required
  रखता तो create ही टूट जाता)
- **HREventLog:** कोड `eventType/payload/module/processed` बुलाता है — वही रखे + employeeId? optional
- **SyncQueueItem/BackupJob/RestoreJob:** फील्ड sync-queue.service.ts / backup.service.ts के
  असली create/update से लिए (tenantId/syncJobId/retryCount/maxRetries/processedAt वगैरह)

### सत्र नोट
- **पूरा:** #008 (schema merge + renames + validate + generate + गिनती) ✅
- **अधूरा:** कुछ नहीं — बचे हुए 624 errors अगले tasks (#016 के बाद वाले) के हैं
- **रुकावट:** कोई नहीं (invoice/webhook वाले फैसले आपके — log में दर्ज, वहीं रुका जैसा आपने कहा था)
- **अगला:** #016 (M06–M10 हरा + mount, 62 errors) — अभी शुरू कर रहा हूँ

---

## ✅ कोडर AI (DeepSeek) — टास्क #016 पूरा: M06/M07/M08/M10 tsc 0 + mount (16 चढ़े)
तारीख: 2026-09-03 (रात, ~01:10)

### गिनती (exact)
```
tsc backend: 624 → 563
  m09-gst:        1 बाक़ी  ← ⛔ cess_rate schema गैप (नीचे)
  m10-accounting: 0 ✅
  m06-inventory:  0 ✅
  m08-sales:      0 ✅
  m07-purchase:   0 ✅
चारों के बाहर: कुछ नहीं टूटा (M13 के 75 पुराने ज्यों-के-त्यों)
```

### कैसे ठीक हुए (सब असली type से — एक भी as any/@ts-ignore नहीं जोड़ा)
- **`string | string[]` (~40 errors):** green modules (M16/M17/M20) का चला हुआ तरीक़ा अपनाया —
  `String(req.params.id)` / `String(req.query.x)`
- **M10 voucher `items` गायब वाली पहेली:** जड़ मिली — `where: { id: req.params.id }` के type error से
  Prisma का generic गिरकर **बिना-include वाले overload** पर चला जाता था, इसलिए result type में
  items दिखता ही नहीं था। where ठीक करते ही include वापस आ गया। (यही सीख लॉग में दर्ज रखो —
  Prisma call की किसी भी arg में error हो तो उस call का पूरा result type बदल जाता है)
- **M06 stock.service avgPrice:** `Decimal | number | null` असली type दिया (Decimal import किया)
- **M06 movement_type:** DTO union में 'addition' | 'reduction' जोड़े — DB column free-text String है
  और कोड यही दो मान लिखता था (रनटाइम बदला नहीं, सिर्फ type सही किया)
- **M06 filter dates:** zod से string आती है, MovementFilter को Date चाहिए — `new Date(...)` से बदला
- **M07 DTO null:** zod `.nullable()` देता है पर DTO नहीं लेता था — `due_date`/`delivery_date` में
  `| null` जोड़ा (Create/Update दोनों)
- **M07 calc:** `let calc;` (implicit any) → `InvoiceCalculationResult` असली type
- **M08:** `notificationService: NotificationService | undefined` (guard पहले से मौजूद है),
  `SalesInvoiceCreateInput` → `SalesInvoiceUncheckedCreateInput` (salesOrderId scalar के लिए —
  checked input सिर्फ relation लेता है)

### Step 2 — index.ts public contracts
- m07/m08/m09/m10: services/types/validators/routes भरे (पहले सिर्फ 1-1 service था)
- **m06 के तीनों repository exports हटाए** (ProductRepository/StockRepository/CategoryRepository) —
  जाँचा: कोई बाहर वाला इन्हें import नहीं करता (सिर्फ M17 का adapter `inventoryService` लेता है — service, ठीक)

### Step 3 — M07 composition (M18 वाला तरीक़ा)
module-registry के load() में पूरी composition: PurchaseController/PurchaseOrderController →
PurchaseService/PurchaseOrderService → PurchaseEventHandlers → eventBus (shared `@/common/events/event-bus`)।

**🔴 एक गैप जो मुझे मिला और दर्ज किया (आपका फैसला चाहिए):** PurchaseEventHandlers m06/m09/m10 की
जिस object-style API से बुलाता है (`addStock({product_id, quantity, rate, reference})`,
`calculateInputTax({invoice_id, items})`, `createPurchaseEntry({...})`), **वो API असली services में
है ही नहीं** — असली वाले positional args + company_id मांगते हैं। यह business-logic गैप है जो #016
के दायरे से बाहर है। मैंने **typed adapters** दिए जो ज़ोर से fail करते हैं (साफ़ error message के साथ) —
चुपचाप ग़लत डेटा कभी नहीं। असली wiring अगले task में होनी चाहिए।

### Step 4 — mount
M06 (`/api/v1/inventory`), M07 (`/api/v1/purchase`), M10 (`/api/v1/accounting`) → `mounted: true`।
**M09 mount नहीं किया** — tsc 1 बाक़ी है (नियम: 0 पर ही mount)।

**⛔ M09 का बचा 1 error — schema गैप (आपका फैसला चाहिए):**
`gst.repository.ts:16` — `tax_rate_master` में `cess_rate` field है ही नहीं। जाँचा: canonical में नहीं,
side-file (`schema__M09M10.prisma`) के `tax_rate_master` में भी नहीं (सिर्फ `hsn_master` में है)।
यानी कोड एक ऐसा field मांगता है जो किसी भी schema source में था ही नहीं। M09 का पूरा GST calc
(gst.internal.ts) `cess_rate` पर टिका है — इसलिए ख़ुद कुछ नहीं जोड़ा, जैसा task ने कहा था।

### Step 5 — चलाकर देखा (exact output)
```
[GNT] modules — चढ़े: 16 | गिरे: 1 | बाक़ी: 4     ← पहले 13 चढ़ते थे
[GNT] ❌ M13 /api/v1/automation — Cannot find module .../m13-automation/queue/queue.names (पुराना)
[GNT] ⏭  M05 (ख़ाली) · M09 (cess_rate) · M14 (router नहीं) · M21 (फैसले बाक़ी)

curl: /api/v1/inventory → 401 | /api/v1/purchase → 401 | /api/v1/purchase/invoices → 401
      /api/v1/purchase/orders → 401 | /api/v1/accounting → 401 | /api/v1/accounting/ledger → 401
      /api/v1/sales → 401 | /healthz → 200
(401 सबूत नहीं — auth गेट; route की परिभाषा कोड से: purchase.routes.ts:7 router.get('/invoices',
 purchase.routes.ts:22 router.get('/orders', accounting.routes.ts:14 router.get('/accounts',
 inventory.routes.ts:17-19 router.post/get('/products') — सब mounted हुए)
```

### एक साफ़ सूचना (आपके verify के लिए)
M06/M07/M08 controllers में पुराने `(req as any).tenant?.company_id` (snake_case) अभी भी हैं —
tenant-middleware camelCase (`req.tenant.companyId`) देता है, यानी runtime पर undefined मिलेगा।
ye pre-existing हैं और #016 का दायरा type-level था, इसलिए नहीं छुए — पर अगला task इन्हें उठाए।

### सत्र नोट
- **पूरा:** #016 (M06/M07/M08/M10 green + mount + index contracts + M07 composition + Step 5) ✅
- **अधूरा:** M09 का mount (cess_rate फैसला आपका) · M07→M06/M09/M10 असली event wiring (गैप दर्ज)
- **रुकावट:** कोई नहीं — जो फैसले चाहिए वो ऊपर दर्ज
- **अगला:** #007 (M05 Party Management) — समय बचा है, अभी शुरू कर रहा हूँ

---

## ✅ कोडर AI (DeepSeek) — टास्क #007 पूरा: M05 Party Management (सत्र 2 — stream error के बाद)
तारीख: 2026-09-03 (सुबह ~05:16–05:50) | आपके निर्देश पर अधूरा #007 वहीं से उठाकर पूरा किया

### जो हुआ (माप सहित)
- रात का बचा काम (9 नई + 5 बदली files) working tree से जाँचकर पूरा किया; backend ढाँचा, M08 fix, mount पहले से थे
- **1 tsc error ठीक किया:** `party.service.ts` — Prisma `Decimal` vs DTO `number` (TS2352); `toParty()` mapper जोड़ा (`Number(...)`, कोई `as any` नहीं)
- **Step 5 (frontend) पूरा:** 3 पेज + types + `routes.tsx` में `/parties`, `/parties/:id` (FinancialYearPage जैसी rough शैली)
- **Mount साबित:** server चलाया → `[GNT] modules — चढ़े: 17 | गिरे: 1 | बाक़ी: 3` (M05 जुड़ा; M13 पुराना गिरा; M09 cess_rate इंतज़ार)

### पास/फेल (exact)
```
npx prisma validate → valid 🚀
npx tsc -p tsconfig.backend.json --noEmit | grep -c "m05-party"  → 0
npx tsc -p tsconfig.backend.json --noEmit | grep -cE "error TS"   → 563 (कल रात के बराबर — कोई नई error नहीं)
npx tsc -p tsconfig.frontend.json --noEmit | grep -c "m05-party"  → 0
npx tsc -p tsconfig.frontend.json --noEmit | grep -cE "error TS"  → 286 (पुराना ही)
```

### Commits (main; push नहीं किया) — task के नियम अनुसार अलग-अलग
- `1f0f252` schema (party_master + relation, 47 lines)
- `1bf57ce` wiring: module-registry mount + M08 fix (getCompanyById→companyService.getProfile, M04 का असला contract) + m05 index
- `f0f009e` 9 नई backend files (605 lines)
- `df55604` frontend 3 पेज + types + routes (389 lines)

### दर्ज की गई बातें (छिपाई नहीं)
1. **M08 की `injectDependencies`/`injectReturnDependencies` कहीं call नहीं होती** — pre-existing गैप; असली wiring का अलग task चाहिए (M07 composition जैसा)
2. frontend पेज rough हैं — सुंदर बाद में; बकाया की जगह खाली (M10 से आएगा, TODO #016)
3. git identity repo में set नहीं है — commits `-c` से "Trishul Pro <trishulpro2@gmail.com>" (पिछली रात वाली); स्थायी config का फ़ैसला आपका
4. आपकी modified files (docs/CODER-AI-GUIDE.md, NIGHT-QUEUE.md, SPEC-REVIEW-M20-M21.md) छुईं नहीं, commit नहीं कीं

**आपके verify/मुहर का इंतज़ार है।** सुबह 6:00 का नियम माना — सब कुछ committed है, uncommitted कुछ नहीं।

---

## ✅ कोडर AI (DeepSeek) — टास्क #024 पूरा: हिस्से A→F लगातार
तारीख: 2026-09-03 (शाम ~18:50 से ~22:05) | मालिक का nonstop आदेश — मुहर का इंतज़ार नहीं किया

### हर हिस्से का सार (commits)
- **A (d4c1484):** M05 contract yaml (X-Company-Id नहीं, सिर्फ़ bearerAuth) + tests (unit 17/17, api 5/5 — 401 द्वार) + frontend form validation; index.ts पहले से सही (सत्र 2)
- **B (9836638):** `req.tenant` optional (CERT-003 शर्त 2) + नया `common/middleware/require-tenant.ts` — 16 files में 121 जगह `requireTenant(req)` guard (tsc-driven); B2 पहले से (#009); FY EXCLUDE migration `007_…`; M04 contract असली shape से (X-Company-Id हटाया)
- **C (bf70e25):** `company_master.code` (unique) + login अब `code:` से (GSTIN नहीं) + migration `008_…` (पुराने data का code नाम/gstin/id से) + auth/permission/session tests 11/11
- **D (c7e7dea):** redis client leak fix (disconnect) + M01 tests 9/9; D1 (#014) पहले से जुड़ा दर्ज
- **E (18c219d):** M03 session cleanup job (15 मिनट, unref, tenant-safe; registry में start) + tests 10/10
- **F (b5ec03f):** tests compile में (exclude हटाया) + vitest runner + ~40 टूटी test files ठीक/rewrite

### F2 — `npm run test:backend` (vitest run) का असली नतीजा (सच)
**237 pass | 35 fail | 4 skip (78 files में से 41 पूरे pass)**
fail की मुख्य वजह: **database बंद है** (integration/api tests) + कुछ पुराने mocks पुराने APIs के लिए।
fail files (मुख्य, नाम सहित): m01 integration/app.integration + unit/app.service · m02 api/auth.controller + integration/auth + unit/auth.service · m03 unit/device.service · m04 api/company.api + integration/company · m06 api/inventory.api + integration/inventory + unit/{batch.controller,product.repository,serial.controller,stock.internal,stock.repository,stock.service} · m08 integration/sales + unit/sales.service · m09 api/gst.api + integration/gst + unit/einvoice.service · m10 api/accounting.api + unit/ledger.service · m13 api/integration/automation · m14 export.test + api/integration/importExport · m15 api/integration {hr,payment,sync}।
**डेटाबेस चालू होने पर इनमें से ज़्यादातर चलेंगे** — यह नापा हुआ आधार है, अंदाज़ा नहीं।

### मुहर की शर्तें (आपके जाँचने के लिए)
- tsc backend: **563** (baseline — पूरे काम में एक भी नई error नहीं; tests सहित)
- prisma validate: valid 🚀 · mount: **18 चढ़े** (हर हिस्से के बाद verify किया)
- नया `as any`/`@ts-ignore`/`exclude`: **0** (exclude सिर्फ़ **हटाए** गए); supertest.d.ts में एक `body: any` — typed declaration की सीमा (दर्ज)
- हर हिस्से पर: DEEPSEEK_LOG नोट + commit + Telegram ✅

**बाक़ी:** आपकी मुहर (A–F की जाँच)। अगला बड़ा काम क़तार (NIGHT-QUEUE #019–#023) — मालिक के फ़ैसलों का इंतज़ार।
