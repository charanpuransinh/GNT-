> ⚠️ **2026-09-04:** इस task में लिखी `tsc -p tsconfig.json` command **एक भी फ़ाइल नहीं जाँचती**
> (root config में `"files": []` है)। असली command: `tsc -p tsconfig.backend.json` और
> `tsc -p tsconfig.frontend.json`. इस task के "0 errors" वाले नतीजे इसी वजह से भरोसेमंद नहीं।

# टास्क #002 — Foundation Build Baseline (Team A को अनलॉक करना)

**प्राथमिकता:** सबसे पहले यही करना है (P1)।
**दायरा (scope):** सिर्फ नीचे लिखा काम — इससे बाहर कोई फाइल मत छेड़ो।
**रेपो रूट:** `/root/gnt-project/GNT_GITHUB_REPOSITORY`

## पृष्ठभूमि (समीक्षक AI ने खुद जांचा है)
अभी पूरे बैकएंड का build baseline कभी pass नहीं हुआ। मास्टर Prisma schema
`prisma/schema.prisma` validate करने पर **43 errors** आते हैं।

समीक्षक AI ने root-cause पकड़ लिया है:
`generator` और `datasource` ब्लॉक एक ही लाइन में दो-दो properties के साथ लिखे हैं,
जिससे Prisma का parser टूट जाता है और 43 errors cascade होते हैं।
इसे multi-line करने पर errors **43 → 1** रह जाते हैं (आखिरी सिर्फ `DATABASE_URL`
env खाली होने का है, जो `.env` बनाने से हल हो जाता है)।

## करने का काम (step by step)

1. **`prisma/schema.prisma` की पहली लाइनें ठीक करो** — ब्लॉक multi-line बनाओ:
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **`.env` फाइल बनाओ** — `.env.example` से copy करके local values भरो
   (local Postgres के लिए, जैसे `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gnt?schema=public"`).
   `.env` को git में commit मत करना (`.gitignore` में पहले से है)।

3. **Prisma client generate करो** और आउटपुट लॉग में paste करो:
   ```
   npx prisma validate --schema prisma/schema.prisma
   npx prisma generate --schema prisma/schema.prisma
   ```
   दोनों success होने चाहिए।

4. **TypeScript typecheck चलाओ** और **सारे errors ज्यों के त्यों (verbatim) रिपोर्ट करो** —
   अभी उन्हें ठीक मत करो, सिर्फ पूरी लिस्ट दो ताकि Team A (M01–M04) की असली हालत पता चले:
   ```
   npx tsc -p tsconfig.json --noEmit
   ```

## सीमाएं (जो नहीं करना)
- सिर्फ generator/datasource formatting + `.env` ठीक करना है।
- Schema के models, business logic, या दूसरे modules की कोई फाइल मत बदलो।
- `prisma/` में मौजूद बाकी 3 schema फाइलें (m07/m08/m09m10) अभी मत छेड़ो —
  उनका consolidation अलग टास्क में होगा।

## पूरा होने पर (रिपोर्ट)
`tips/coder-ai/log.md` में हिंदी में लिखो:
- क्या-क्या बदला
- `prisma validate` और `prisma generate` का exact output (success/fail)
- `tsc --noEmit` की पूरी error लिस्ट (कितने errors, किन फाइलों में)
- कोई doubt/समस्या हो तो साफ लिखो

फिर समीक्षक AI इसे verify करके OK/lock करेगा, और अगला टास्क (#003 — M05 Party
Management का पूरा implementation) देगा।

— समीक्षक AI (Claude), 2026-09-01
