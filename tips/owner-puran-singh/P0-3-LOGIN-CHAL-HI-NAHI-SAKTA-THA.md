# 🛑 P0 (अब ठीक) — इस server पर login कभी हो ही नहीं सकता था

**कब पकड़ा:** 2026-09-05 · **किसने:** समीक्षक AI · **हालत:** ✅ ठीक कर दिया गया

---

## एक लाइन में

आपका खाता बन जाने के बाद मैंने **असल में login करके देखा** — और वह **500** दे गया।
वजह: token पर दस्तख़त करने वाली चाबियाँ (JWT keys) इस server पर **कभी बनाई ही नहीं गई थीं**।

## असली गड़बड़ी (चलाकर निकाली, अंदाज़ा नहीं)

```
Error: Missing required production authentication key: ACCESS_TOKEN_PRIVATE_KEY
  at auth.internal.ts:16
  at generateTokenPair (auth.internal.ts:54)
  at authService.login (auth.service.ts:56)
```

`.env` में चारों में से **एक भी** चाबी नहीं थी:
`ACCESS_TOKEN_PRIVATE_KEY` · `ACCESS_TOKEN_PUBLIC_KEY` ·
`REFRESH_TOKEN_PRIVATE_KEY` · `REFRESH_TOKEN_PUBLIC_KEY`

**इसका मतलब सीधा है:** आज तक इस system में कोई भी आदमी login कर ही नहीं सकता था।
पूरा app बना हुआ है, database भरा है — पर दरवाज़ा ही नहीं खुलता था।

## यह इतने दिन क्यों नहीं पकड़ी गई — यह हिस्सा ज़्यादा ज़रूरी है

`auth.internal.ts` में लिखा है: अगर `NODE_ENV=test` हो, तो चाबी **अपने आप बना लो**।

```ts
if (process.env.NODE_ENV === 'test') return testKeyPair()[...];
throw new Error(`Missing required production authentication key: ${name}`);
```

यानी **tests अपनी चाबी ख़ुद बना लेती थीं** और हरी होती रहीं — जबकि असली चलने पर वहाँ
कुछ था ही नहीं। 400 से ज़्यादा tests हरी थीं और login टूटा हुआ था।

यह इस project की वही पुरानी बीमारी है जो आप पहले भी पकड़ चुके हैं: **हरा रंग जो सच
नहीं बोलता।** इसीलिए मैं "खाता बन गया" कहकर नहीं रुका — login चलाकर देखा।

## क्या किया

1. **RSA 2048 की दो जोड़ी चाबियाँ बनाईं** (access के लिए अलग, refresh के लिए अलग) और
   `.env` में डालीं। access और refresh की चाबियाँ जान-बूझकर अलग हैं — एक ही होतीं तो
   एक तरह का token दूसरे की जगह इस्तेमाल हो सकता था।
2. **चाबियाँ GitHub पर नहीं जाएँगी** — `.env` पहले से `.gitignore` में है और git में
   tracked नहीं (जाँच लिया)। पुरानी `.env` की नक़ल भी रख ली है।
3. **नई test लिखी** ताकि यह दोबारा न छुपे:
   `m02/tests/api/auth-keys.db.test.ts` — यह test वाली छूट के **बाहर** जाकर असली `.env`
   पढ़ती है, चारों चाबियाँ माँगती है, उन्हें सच में parse करके देखती है, और यह भी जाँचती
   है कि access/refresh अलग हैं।
   **एक चाबी हटाकर चलाया → 3 tests फ़ेल हुईं।** यानी यह सच में पकड़ती है।

## चलाकर साबित (असली HTTP request से)

```
POST /api/v1/auth/login  { username: puran, companyCode: MERICO }   → 200 ✅ token मिला
उसी token से:
  GET /api/v1/auth/users        → 200 ✅   (M02 — सिर्फ़ मालिक का हक़)
  GET /api/v1/auth/roles        → 200 ✅
  GET /api/v1/accounting/ledger → 200 ✅   (M10)
  GET /api/v1/inventory/products→ 200 ✅   (M06)
```

यानी **login → token → अनुमति की जाँच → data** — पूरी शृंखला अब सच में चलती है।

## 🔴 आपके लिए एक ज़रूरी बात — पासवर्ड बदल लीजिए

आपने पासवर्ड चैट में लिखकर भेजा था, इसलिए वह इस session के record में रह गया है।
खाता चल रहा है — पर **पासवर्ड बदल लेना ठीक रहेगा**। बदलने का रास्ता बनते ही मैं
बता दूँगा; तब तक चाहें तो यही command दोबारा नए पासवर्ड के साथ चला सकते हैं
(खाता पहले से है तो पासवर्ड नहीं बदलेगा — इसके लिए अलग command बनानी होगी, दर्ज है)।

## आपका खाता

```
कंपनी: Garuda Nextech (code: MERICO)
username: puran · email: charanpuransinh@gmail.com
भूमिका: Owner — पूरे 21 modules, चारों क्रियाएँ (84 अनुमतियाँ)
```
