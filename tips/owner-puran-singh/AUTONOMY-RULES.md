# 🤖 AUTONOMY RULES — स्थायी सेटअप

**आधार:** मालिक (पूरन सिंह) का निर्देश `OWNER_INSTRUCTION_AUTONOMY.md`, 2026-09-04
**किस पर लागू:** Claude (समीक्षक AI) और DeepSeek (कोडर AI) — दोनों पर
**नया session शुरू हो तो यह फ़ाइल ज़रूर पढ़े। यह हर पुराने नियम पर भारी है।**

---

## 0️⃣ FULL AUTO MODE — मालिक का सीधा आदेश (2026-09-05) — सबसे ऊपर

मालिक (पूरन सिंह) ने 2026-09-05 को आदेश दिया है:

> "Turn on full auto mode permanently… Do not ask me for permission or approval for any
> command, file edit, git commit, or git push — approve everything yourself automatically…
> continue working through M13 to M22 completely on your own, one module at a time,
> fix + test + certify + commit + push, without stopping."

**इसका मतलब (DeepSeek/कोडर AI के लिए):**
- कोई भी command / file edit / git commit / **git push** — सब बिना पूछे करना है।
- **push अब खुला है** (पुराना “DeepSeek push नहीं करेगा” नियम रद्द) — अपने modules का कोड और notes दोनों।
- **दायरा अब M11–M22** है (M21 = Data Sense; M22 = subscription/naming — repo देखकर जो भी M22 हो)।
- एक module ख़त्म → अगला शुरू। रुकना, पूछना, approval माँगना मना।

> ⚠️ तकनीकी सच: runtime की “Ask” approval-gate **AI ख़ुद बंद नहीं कर सकता** — वो होस्ट/TUI
> की सेटिंग है (मालिक को TUI में Ask → auto/accept-edits करना है)। जब तक वो न हो, हर tool
> call पर approval माँगा जाएगा — पर AI बीच में रुककर “क्या कर लूँ?” पूछेगा नहीं, बस काम करता जाएगा।

---

## 1️⃣ ये काम बिना पूछे करने हैं (स्थायी अनुमति)

मालिक ने इनकी पक्की अनुमति दे दी है। **इन पर रुकना, पूछना, या अनुमति माँगना मना है:**

- ✅ project के अंदर कोई भी फ़ाइल बनाना / पढ़ना / बदलना
  (`backend/`, `frontend/`, `prisma/`, `tests/`, `docs/`, `tips/`)
- ✅ `git commit` करना (push का नियम वही रहेगा जो पहले से तय है)
- ✅ `npm` / `npx` से tests, `tsc`, build, lint चलाना
- ✅ नई scratch / log / report फ़ाइलें बनाना
- ✅ Telegram पर status अलर्ट भेजना

**मतलब:** काम करते-करते बीच में रुककर "क्या मैं यह कर लूँ?" पूछना अब नियम-विरुद्ध है।

---

## 2️⃣ 🛑 सिर्फ़ इन 4 पर रुकना है (P0 — मालिक का फ़ैसला ज़रूरी)

बाक़ी किसी बात पर नहीं। **सिर्फ़ ये चार:**

| # | कब रुकना है | क्यों |
|---|---|---|
| **P0-1** | **database schema में टकराव** — किसे सही मानें (जैसे M13 के तीन रूप) | ग़लत चुना तो डेटा का ढाँचा ही ग़लत बैठ जाएगा, बाद में सुधारना बहुत महँगा |
| **P0-2** | किसी module को **"LOCKED" / "VERIFIED" घोषित करना** | यहीं झूठी मुहर लगी थी। अब यह फ़ैसला सिर्फ़ मालिक का |
| **P0-3** | **पैसे / GST / business logic** का कोई फ़ैसला जो code से तय नहीं हो सकता | यह व्यापार का फ़ैसला है, प्रोग्रामिंग का नहीं |
| **P0-4** | कोई काम जो **पीछे नहीं लौटाया जा सकता** — data delete, force push | ग़लती हुई तो वापसी नहीं |

**P0 आए तो:** काम रोको → Telegram पर अलर्ट भेजो → मालिक के folder में साफ़ लिखो कि किस बात
का फ़ैसला चाहिए और विकल्प क्या-क्या हैं → **बाक़ी काम जो P0 पर निर्भर नहीं, वो चलाते रहो।**
पूरा काम रोककर बैठना मना है।

---

## 3️⃣ Session टूटे तो ख़ुद वापस चालू होना — ✅ चालू हो गया (2026-09-04)

**बन गई और cron में लग गई:** `tools/auto_resume.sh` — हर **5 मिनट** में जाँचती है।

```
*/5 * * * * /root/gnt-project/tools/auto_resume.sh
```

**क्या करती है:**
- DeepSeek (codewhale) मरा मिले → tmux window बनाकर वापस चालू करे, और उसे
  `AUTONOMY-RULES.md` पढ़कर M11–M21 जारी रखने को कहे
- Claude मरा मिले → `claude --continue` से वापस लाए, और M01–M10 जारी रखने को कहे
- 5 मिनट का cooldown — एक ही चीज़ को बार-बार न छेड़े
- चालू होते ही नाकामी की गिनती शून्य

**चलाकर साबित किया (सिर्फ़ लिखकर नहीं छोड़ा):** एक नक़ली process पर पूरा चक्र चलाया —
```
dummyXprobe मरा हुआ मिला → चालू करने की कोशिश #1
dummyXprobe वापस चालू हो गया (कोशिश #1)
```
किसी असली AI को मारे बिना यह पक्का हुआ कि पहचान → restart → पुष्टि → log, चारों काम करते हैं।

**जाँचने के command:**
```bash
crontab -l | grep auto_resume                    # लगा है?
tail -20 /root/gnt-project/tools/auto_resume.log # क्या-क्या restart हुआ
```

**पहले क्या होता था:** पुराना `/root/tools/deepseek_watchdog.sh` मरने पर **पकड़ तो लेता था
पर चालू नहीं करता था** (उसमें restart का एक भी हिस्सा नहीं — grep से जाँच लिया)।
इसी वजह से DeepSeek 04:11 से 05:52 तक **1 घंटा 40 मिनट** मरा पड़ा रहा।
**अब वो अंतर 5 मिनट का रह गया है।**

---

## 4️⃣ Telegram अलर्ट — स्थायी नियम (2026-09-05, मालिक का सीधा आदेश — दो बार पक्का किया)

**मालिक ने पक्का कर दिया कि Telegram रिपोर्ट उन्हें मिल रही है — और यह अब स्थायी नियम है।**

> **हर progress report Telegram पर भेजो — चाहे छोटी हो या बड़ी — बिना पूछे, अपने-आप।**
> **session के ख़त्म होने का इंतज़ार मत करो — तुरंत भेजो।**

**1. हर progress report → Telegram (स्वतः):**
- कोई भी file/module का कोई भी step पूरा हो → Telegram पर भेजो (छोटी हो तो छोटी रिपोर्ट)।
- बड़ा milestone → Telegram पर भेजो।
- कोई blocker / P0 फ़ैसला / permission-wait (जैसे tool-call "Ask" approval पर रुका हो) → तुरंत alert।
- सिर्फ़ **routine restart** (मरा → चालू किया) चुपचाप log में — वही एक अपवाद।

**2. "green lock / certified lock" की ख़ास confirmation → Telegram (स्वतः):**
जब कोई file/module **पूरी तरह ख़त्म होकर हरी (certified/green) हालत** में आए, तो एक **अलग special report** भेजो जिसमें लिखा हो:
```
🔒 CERTIFIED (green) — <file/module का नाम>
Lock ho gaya ✅
Tests: <कितने pass, skip 0>
Date-time: <तारीख़ और वक़्त>
```
> ⚠️ नाम का ध्यान: यह "certified/green" **AI की अपनी पूर्णता-मुहर** है। असली production
> "LOCKED" अभी भी सिर्फ़ मालिक का फ़ैसला है (P0-2) — AI वह शब्द नहीं लिखेगा।

**रिपोर्ट का format (हर बार यही):**
```
Module: <नंबर>
Status: done / blocked
Kya kaam hua: <एक-दो लाइन>
Tests: <कितने pass, skip कितने>
Agla step: <क्या>
```

**भेजने का तरीक़ा:** `bash tools/notify.sh --tag "DeepSeek" "..."` (या लंबी रिपोर्ट `cat file | bash tools/notify.sh --tag "DeepSeek" -`)।
**Telegram live है** ✅ — token/chat-id `/opt/raw-repo/.env` में, `tools/notify.sh` चलता है (जाँच हो चुकी: `✅ Sent`)।

| हालत | क्या करना है |
|---|---|
| routine restart (मरा, चालू कर दिया) | **चुपचाप log में लिखो** — यही एक अपवाद |
| कोई भी progress (छोटी/बड़ी) | 🔔 **तुरंत Telegram रिपोर्ट** |
| file/module **green/certified** हुआ | 🔔 **ख़ास 🔒 CERTIFIED report** (नाम, lock, tests, date-time) |
| **P0 फ़ैसला चाहिए** (बिंदु 2) | 🔔 **तुरंत अलर्ट** |
| tool-call "Ask" approval पर अटका | 🔔 **छोटा अलर्ट** — ताकि मालिक तुरंत approve कर सके |
| restart **लगातार 3 बार फ़ेल** | 🔔 **तुरंत अलर्ट** |

**कारण:** मालिक ख़ुद चाहते हैं कि हर काम की ख़बर तुरंत आए — कोई भी progress छुपी न रहे।

---

## 5️⃣ साथ चलने वाले बाक़ी नियम (ये रद्द नहीं हुए)

### 🧱 Claude के हिस्से (M01–M10) पर निर्भर काम — force मत करो (2026-09-05, मालिक का आदेश)

> अगर काम करते-करते कोई file/task **Claude के हिस्से (M01–M10) से जुड़ी हो या उस पर टिकी हो**,
> तो उसे **force मत करो**। उसे **"HOLD BY CLAUDE - PENDING"** mark करके छोड़ दो। ज़रूरत हो तो
> Claude से मदद/क्रॉस-चेक ले सकते हो — पर उसकी files ख़ुद बदलने की कोशिश मत करो।

**मतलब:**
- M11–M22 में **जितना अपने आप बन सके** बनाओ।
- जो feature किसी M01–M10 module की **public API / table / file** पर टिकी हो, वहाँ अपनी तरफ़ का
  काम पूरा करके बाक़ी हिस्सा **"HOLD BY CLAUDE - PENDING"** लिखकर रोको (code में comment + log में note)।
- किसी M01–M10 की file ख़ुद बदलना मना है (M02 के permission-catalog, M07/M08/M10 के services वग़ैरह)।


- **हर 3–4 घंटे** मालिक के folder में progress note — बिना पूछे, भले काम अधूरा हो
- **"पूरा हुआ" की सख़्त परिभाषा:** live DB पर चला हो · सुविधा सच में चले · कोई खुली शर्त नहीं ·
  `TEST_DB=1` के साथ tests पास और skip 0 · ख़ुद चलाकर देखा हो
- **"LOCKED" कोई AI नहीं लिखेगा** — वो सिर्फ़ मालिक का फ़ैसला (P0-2)
- **बँटवारा:** Claude = M01–M10 · DeepSeek = M11–M21
- **रुकने पर तुरंत लिखो** कब और क्यों रुके; लौटते ही लिखो कि कहाँ से उठाया।
  **चुपचाप ग़ायब होना मना है।**

---

## 📌 नया session शुरू करने वाले के लिए — 3 क़दम

1. यह फ़ाइल पढ़ो
2. `bash tips/owner-puran-singh/CHECK.sh` चलाकर असली हालत देखो (किसी AI की रिपोर्ट पर भरोसा नहीं)
3. `tips/owner-puran-singh/log.md` का आख़िरी note पढ़ो — काम वहीं से उठाओ, **अनुमति माँगे बिना**
