# 📘 blueprint से लिए गए फ़ैसले — 2026-09-05

**मालिक का आदेश:** *"Blueprint ही सबसे बड़ा authority है — इसे owner से ऊपर मानो…
हर owner-decision खुद तय करो। Clarification के लिए owner के पास मत आओ।"*

यह फ़ाइल इसीलिए है: जो भी फ़ैसला मैंने ख़ुद लिया, वह **blueprint की किस लाइन से** लिया —
ताकि आप बाद में जाँच सकें कि मैंने अपनी मर्ज़ी नहीं चलाई।

---

## पहले एक सच जो बताना ज़रूरी है

आपने कहा था कि repository में **`GNT_REPORT`** नाम का folder है जिसमें पूरी blueprint है।
**वह folder इस server पर कहीं नहीं है** — न disk पर, न git history में (`git log --all`
से भी जाँचा)।

जो blueprint मौजूद है, वह यह है:
```
/root/gnt-project/docs/GNT_ADVANCED_SOFTWARE_BLUEPRINT_V2_M01-M20-5.md   (2894 लाइनें, 226 KB)
```
मैंने इसे पूरा पढ़ा है और इसी को source of truth माना है।

**एक और बात:** इस blueprint में 42 दूसरे दस्तावेज़ों की सूची है (§2.1) — जैसे
`GNT_PERMISSION_MATRIX.md [Role x Module x Action]`, `GNT_TRANSACTION_RULES.md`,
`GNT_SECURITY_SPECIFICATION.md`। **उन 42 में से एक भी फ़ाइल मौजूद नहीं है** — गिनकर
देखा (सूची में 42, असल में 0)। यानी blueprint उनका *ज़िक्र* करता है, पर उनकी *सामग्री*
कहीं नहीं है। अगर वे आपके पास कहीं और (लैपटॉप/ड्राइव/मेल) हैं तो भेज दीजिए — तब मुझे
कई चीज़ों में अंदाज़ा नहीं लगाना पड़ेगा।

---

## फ़ैसला 1 — लेखाकार (Accountant) को M09 और M10 मिलेंगे ✅ लागू

**सवाल था:** आपने कहा "सिर्फ़ Billing और Payment"। तो GST (M09) और खाता-बही (M10)
मिले या नहीं?

**blueprint का जवाब (§7.8 और §7.11) — शब्द-दर-शब्द:**
```
M08 (SALES & BILLING)   USES: M05 (Customer), M06 (Product/Stock), M09 (GST), M10 (Accounting)
M11 (PAYMENT)           USES: M05 (Party), M07/M08 (Invoices), M10 (Ledger), M18 (Gateways)
```

यानी जिन **दो ही modules** का हक़ आपने लेखाकार को दिया, वे ख़ुद blueprint के अनुसार
M09 और M10 पर टिके हैं। बिल का GST और भुगतान का ledger देखे बिना लेखाकार मिलान कर ही
नहीं सकता — वह "Billing और Payment का access" नाम का ही रह जाता।

**इसलिए:** लेखाकार को M09 + M10 पर भी **सिर्फ़ देख + एडिट** दिया गया है।
**बनाना और मिटाना अब भी नहीं** — आपकी शर्त वहीं की वहीं है।

अगर आप फिर भी हटाना चाहें, `permission-catalog.ts` में एक लाइन हटाकर seed दोबारा चलाना है।

## फ़ैसला 2 — जो व्यापारी ग्राहक भी है और सप्लायर भी: **एक ही party रहेगी** ✅ (कोई बदलाव नहीं)

**blueprint का जवाब (§8.1 Canonical Entity Ownership):**
```
M05 (Party)
  +-- party_master        [Customer/Supplier - CANONICAL]
  +-- party_ledger_view   [Running balance]
```

`CANONICAL` का मतलब — **एक व्यापारी की एक ही पंक्ति**। blueprint ने customer और
supplier के लिए अलग-अलग तालिकाएँ नहीं रखीं, एक ही `party_master` रखी है जिसमें
`party_type` से तय होता है कि वह ग्राहक है, सप्लायर है, या दोनों।

इसलिए `@@unique([company_id, gstin])` **जैसा है वैसा ही रहेगा** — एक GSTIN की दो
parties नहीं बनेंगी। ऐसे व्यापारी की `party_type = 'both'` होगी।

**आपका नियम 3 इससे टूटता नहीं:** आपका नियम कहता है *"Sales party और Purchase party
के accounts के बीच कोई direct link नहीं"* — यानी **दो अलग parties** आपस में न जुड़ें।
यहाँ दो parties हैं ही नहीं, एक ही व्यापारी है। उसका अपना ledger अपने में बंद है,
और किसी **दूसरी** party से उसका कोई जोड़ नहीं — नियम कायम।

## फ़ैसला 3 — `party_ledger_view` बना दिया ✅ (blueprint में लिखा था, बना कभी नहीं था)

§8.1 में यह view M05 की canonical चीज़ के तौर पर दर्ज है, पर database में **मौजूद ही
नहीं था**। यह ठीक वही औज़ार है जो आपका नियम 5 माँगता है — हर party का अपना running
balance, अपनी अलग पंक्ति में।

बना दिया: `database/migrations/010_M05_party_ledger_view.sql` (असली DB पर चल चुकी)।

---

## साथ में मिलीं दो और गड़बड़ियाँ (दर्ज कर रहा हूँ)

**1. `ledger.party_id` का type ग़लत है।**
`ledger.party_id` और `ledger.company_id` **text** हैं, जबकि `party_master.id` और
`company_id` **uuid** हैं। इस बेमेल की वजह से इनके बीच foreign key बन ही नहीं सकता —
यानी ledger में कोई बेमानी party_id चला जाए तो **database उसे रोकेगा नहीं**।
(view में फ़िलहाल cast से काम चलाया है।) इसे ठीक करना एक अलग migration है।

**2. blueprint कहता है tenant की पहचान `X-Company-Id` header से हो (§9.2)।**
इस project में वह जान-बूझकर **नहीं** किया गया (टास्क #009) — कंपनी सिर्फ़ verified
token से आती है, header से कभी नहीं। वजह: header वही भेजता है जिसे रोकना है, इसलिए
वह ख़ुद एक छेद था। **यह blueprint से जान-बूझकर हटना है, और यह हटना सही है** — दर्ज
कर रहा हूँ ताकि बाद में "blueprint का उल्लंघन" कहकर उलझन न हो।

**3. blueprint §10.3 कहता है payment का रास्ता M11 से शुरू होकर M10 को बुलाए।**
मैंने VoucherService (M10) में payment voucher बनाई है — blueprint के अनुसार M10 का
काम "Voucher posting" है, यह सही है; पर उसे **बुलाना M11 से चाहिए**। M11 DeepSeek का
हिस्सा है, इसलिए यह wiring उसकी क़तार में दर्ज है।
