# मालिक का स्थायी निर्देश — Autonomy Setup (2026-09-04)

तुम (समीक्षक AI / Claude) और DeepSeek दोनों बार-बार छोटी-छोटी परमिशन पर अटक जाते हो, या session
टूटने पर घंटों तक कोई काम नहीं होता और मुझे पता ही नहीं चलता। यह ठीक करो — permanent तरीक़े से,
सिर्फ़ अभी के लिए नहीं।

## 1. रोज़मर्रा के काम पर अब से मत पूछो (auto-approve)

नीचे दिए काम अब से बिना पूछे करो — इनकी permanent अनुमति है:
- project के अंदर कोई भी फ़ाइल बनाना/पढ़ना/बदलना (backend/, frontend/, prisma/, tests/, docs/, tips/)
- git commit करना (push का नियम वही रहेगा जो पहले से तय है)
- npm/npx से tests, tsc, build, lint चलाना
- नई scratch/log/report फ़ाइलें बनाना (RESUME-STATE.md जैसी)
- Telegram पर status अलर्ट भेजना

## 2. सिर्फ़ इन पर रुककर मुझसे पूछो (बाक़ी सब पर नहीं)

- database schema में टकराव / किसे सही मानें (जैसे M13 के तीन रूप)
- किसी module को "LOCKED"/"VERIFIED" declare करना
- पैसे/GST/business logic से जुड़ा कोई फ़ैसला जो code से तय नहीं हो सकता
- कोई काम जो पीछे नहीं लौटाया जा सकता (data delete, force push)

## 3. Session टूटने पर ख़ुद वापस चालू हो (auto-restart)

cron-based restart script बनाओ (तुम्हारे और DeepSeek दोनों के लिए):
- हर 5-10 मिनट पर जांचे कि tmux session ज़िंदा है या नहीं
- मरा मिले तो ख़ुद restart करे (claude --resume <last-session-id>)
- restart की timestamp log में लिखे

## 4. Telegram अलर्ट सिर्फ़ ज़रूरी चीज़ पर

routine restart चुपचाप log में लिखे। सिर्फ़ तब अलर्ट भेजे जब बिंदु 2 वाला फ़ैसला चाहिए हो, या
restart लगातार 3 बार फेल हो जाए।

## 5. यह सब स्थायी रूप से लिख दो

पूरा setup tips/owner-puran-singh/AUTONOMY-RULES.md में लिख दो ताकि नया session भी इसे पढ़कर समझे।

पुष्टि करो कि पढ़ लिया, फिर लागू करना शुरू करो — सिर्फ़ बिंदु 2 पर रुकना, बाक़ी पर नहीं।

— पूरन सिंह (मालिक), 2026-09-04
