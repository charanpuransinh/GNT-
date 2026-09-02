# टास्क #015 — M20: tariff/duty की गणना ठीक करना 🔴

**प्राथमिकता:** P0 · **दायरा:** `m20-international-trade/` + `prisma/schema.prisma` (M20 के models)
पूरी समीक्षा: `AUDIT-02-team-d-m16-m20.md` → **File 15**

## Step 1 — 🔴 `hsn_master` का टकराव (पहले यह, वरना GST टूटेगा)
`hsn_master` **canonical schema में पहले से मौजूद है और वो M09 (GST) का है**
(`hsn_code`, `type`, `company_id`, `gst_rate`, `cess_rate`)।
`team-d/M20-.../m20-schema.prisma` में उसी नाम की **अलग** table है
(`code`, `chapter`, `heading`, `subheading`, `tariff_item`, `igst_rate`, कोई `company_id` नहीं)।

> **⛔ team-d वाला `hsn_master` canonical में मत डालना** — M09 की GST गणना पूरे repo में
> मौजूदा `hsn_master` पर टिकी है, वो टूट जाएगी।

**मेरा फ़ैसला:** M09 का `hsn_master` वैसा ही रहेगा। M20 के लिए **नई table `customs_tariff`** बनाओ —
team-d वाले model का ढाँचा, बस `model customs_tariff { … @@map("customs_tariff") }`।
फिर M20 के कोड में `prisma.hsn_master` → `prisma.customs_tariff` करो
(`hsn.code`, `hsn.chapter`, `hsn.igst_rate`, `hsn.tariff_item` वाले सारे reads उसी नई table से आएँगे)।
**वजह:** GST का HSN हर कंपनी का अपना config है; customs tariff पूरे देश का साझा डेटा —
दोनों एक table में डालने पर `company_id` को nullable करना पड़ता और दोनों का मतलब बिगड़ जाता।
साथ ही blueprint का नियम: कोई module दूसरे module की table दोबारा परिभाषित नहीं करेगा।

बाक़ी 4 models (`trade_document`, `trade_job`, `fx_rate`, `customs_rule`) ज्यों-के-त्यों जोड़ो।

## Step 2 — 🔴 Social Welfare Surcharge (SWS) जोड़ो — अभी पूरी तरह गायब है
भारत में क्रम है: **BCD → SWS (= BCD का 10%) → फिर IGST**।
पूरे module में `sws`/`surcharge` शब्द एक बार भी नहीं है। इससे **लगभग हर import पर duty कम गिनी जा रही है।**
- `customs_rule` में `sws_rate` (default 10) रखो — दर बदलती रहती है, कोड में मत जमाओ
- `sws = round(bcd * sws_rate/100)` और उसे **IGST के आधार में भी** जोड़ो और total में भी

## Step 3 — 🔴 ACD का विरोधाभास ठीक करो
`services/customs.service.ts:68` — `igstBase` में `acd` नहीं है, पर line 79 के `totalDuty` में है।
दोनों में से एक ग़लत है। तय करो, एक जैसा करो, और **कोड में एक comment लिखो कि क्यों**
(जहाँ पैसा गिना जाता है, वहाँ अगले पढ़ने वाले को नियम दिखना चाहिए)।

## Step 4 — 🟠 `cess = 0` हटाओ
line 77 पर cess कोड में जमा है। `customs_tariff.cess_rate` मौजूद है — उसी से गिनो।

## Step 5 — 🟠 पैसा float में मत गिनो
अभी `Number(rule.bcd_rate)` से Decimal → float, और `round(n)=Math.round(n*100)/100` (2 दशमलव)।
- गणना **Decimal** में करो (Prisma का `Decimal`), या पूरे हिसाब को **पैसे (integer)** में करो
- Customs duty भारत में **नज़दीकी रुपये** पर round होती है — 2 दशमलव पर नहीं।
  हर line पर round करना है या सिर्फ़ आख़िर में — यह तय करके comment में लिखो

## Step 6 — 🟠 FX की तारीख़ इस्तेमाल करो
`fx.repository.ts` में `effective_date` सही रखा जाता है, पर
`fx.service.getFXRate(companyId, base, target)` में तारीख़ का parameter ही नहीं — इसलिए हमेशा
सबसे नई दर उठती है। Customs में **bill of entry की तारीख़ वाली दर** लगती है।
`getFXRate(..., asOf: Date)` जोड़ो और उस तारीख़ से पहले की सबसे नई दर लो (`effective_date <= asOf`)।
उस तारीख़ की दर न मिले तो **साफ़ error** — चुपचाप नई दर मत उठाना।

## जो नहीं करना
❌ `hsn_master` (M09 का) को छूना — **सबसे ज़रूरी मनाही**
❌ `as any`/`@ts-ignore` · ❌ दूसरे modules की फाइलें · ❌ duty की दरें कोड में जमाना

## पास/फेल
```
npx prisma validate --schema prisma/schema.prisma
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -c "m20-international-trade"   # → 0
grep -rn "hsn_master" backend/src/modules/m20-international-trade/    # → कुछ नहीं मिलना चाहिए
```
+ एक गणना का उदाहरण log में दो (CIF ₹1,00,000, BCD 10%, IGST 18% पर हर line कितनी बनी) —
ताकि मैं हाथ से मिलाकर जाँच सकूँ।
रिपोर्ट दोनों जगह; commit करके रुकना।
— समीक्षक AI (Claude)
