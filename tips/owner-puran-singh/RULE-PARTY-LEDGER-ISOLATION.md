# 🔒 हार्ड रूल — हर party का ledger पूरी तरह अलग (मालिक पूरन सिंह)

**कब मिला:** 2026-09-05 · **किसने दर्ज किया:** समीक्षक AI
**दर्जा:** हार्ड रूल — इसे किसी module का design तोड़ नहीं सकता।

---

## मालिक के शब्द (शब्द-दर-शब्द, बदले नहीं गए)

> M08 (Party/Accounts) के लिए हार्ड रूल:
>
> 1. हर party (customer/supplier) का ledger पूरी तरह isolated होना चाहिए — active हो या
>    inactive, किसी भी हालत में दो parties का डेटा एक-दूसरे को touch/reference नहीं करेगा।
> 2. Sales parties आपस में कभी लिंक नहीं होंगी (जैसे party A और party B के accounts कभी
>    cross-reference नहीं होंगे)।
> 3. Sales party और Purchase party के accounts के बीच कोई direct link नहीं होगा।
> 4. सिर्फ M06 (Inventory) दोनों तरफ जुड़ता है: माल Purchase party से आता है → स्टॉक में
>    जमा होता है → वहां से Sales party को जाता है। यानी सिर्फ माल का भौतिक flow कनेक्ट
>    होगा, अकाउंट्स/लेजर्स का कोई सीधा cross-link party to party नहीं बनेगा।
> 5. हर party का ledger, बैलेंस, transaction history पूरी तरह अपने आप में self-contained रहेगा।

---

## एक छोटी सी बात जो मैंने साफ़ की (मालिक की जानकारी के लिए)

मालिक ने इसे "M08 (Party/Accounts)" कहा। इस codebase में यह तीन modules पर फैला है —
इसलिए नियम तीनों पर लागू होगा, सिर्फ़ M08 पर नहीं:

| हिस्सा | कहाँ है |
|---|---|
| party master (customer/supplier) | **M05** — `party_master` |
| बिक्री का बिल / billing | **M08** — `SalesInvoice` आदि |
| ledger / खाता-बही / balance | **M10** — `ledger`, `account_master`, `voucher` |
| माल का भौतिक flow (इकलौता जायज़ पुल) | **M06** — `stock_master`, `stock_movement` |

## इस नियम का सीधा असर — P0-2 (बिल post नहीं होता) पर

यह नियम उस खुले P0 का **आधा जवाब** है। बचा हुआ सवाल अब भी मालिक का है:
हर party का अपना अलग ledger होगा — पर बिक्री की रकम **किस खाते** में चढ़े
(sales account, GST payable, receivable) — वह chart of accounts अब भी तय नहीं है।
देखें: `P0-2-BILL-POST-NAHI-HOTA.md`

## मुझे क्या जाँचना है (अभी बाक़ी, दर्ज कर रहा हूँ ताकि छूटे नहीं)

1. `ledger` / `account_master` में कोई भी party-to-party reference column या FK **नहीं** होना चाहिए
2. कोई query दो parties का डेटा एक साथ join करके balance न निकालती हो
3. inactive/deleted party का ledger किसी दूसरी party के हिसाब में न जुड़ता हो
4. M06 के अलावा purchase→sales कोई सीधा account-level रास्ता न हो
5. हर जाँच के लिए असली DB पर test — "पढ़कर ठीक लगा" काफ़ी नहीं

---

# ✅ जाँच का नतीजा — 2026-09-05

## 1. schema — साफ़ निकला ✅
`party_master` में किसी दूसरी party का **कोई reference नहीं** — न parent, न group, न
linked-party। हर party की इकलौती कड़ी `company_master` से है। यानी नियम 1, 2, 3 schema
के स्तर पर पहले से ही टूटे हुए नहीं थे।

## 2. code — कोई cross-party query नहीं ✅
पूरे backend में दो parties को एक साथ लाने वाली एक भी query नहीं मिली।

## 3. पर ledger पढ़ने में नियम **टूट रहा था** ❌ → अब ठीक

`getLedgerEntries` में party की छन्नी **वैकल्पिक** थी, और `getBalanceAsOfDate` में
party की छन्नी **थी ही नहीं**। इसका सीधा मतलब:

> दो parties एक ही खाते (जैसे "Sundry Debtors") पर हों — और असल में यही आम बात है —
> तो खाते से ledger पढ़ते ही **दोनों की पंक्तियाँ एक साथ** लौटती थीं, और "बैलेंस"
> हमेशा पूरे खाते का होता था, किसी एक party का कभी नहीं।

यह सीधे मालिक के नियम 5 के ख़िलाफ़ था। अब दो नए रास्ते बने हैं जिनमें **party कभी
वैकल्पिक नहीं** — party_id के बिना वे कुछ लौटाते ही नहीं (400):

```
GET /api/v1/accounting/party-ledger?party_id=…           ← सिर्फ़ उस party की history
GET /api/v1/accounting/party-ledger/balance?party_id=…   ← सिर्फ़ उस party का बैलेंस
```

party का शुरुआती बकाया भी उसी party के `party_master` से आता है, किसी साझा खाते से
नहीं — इसलिए बैलेंस सच में self-contained है।

## 4. साथ में तीन tenant छेद मिले और बंद हुए 🔴 → ✅

| क्या | पहले | अब |
|---|---|---|
| `GET /accounting/ledger` | सिर्फ़ account_id जानकर **दूसरी कंपनी की खाता-बही** पढ़ी जा सकती थी | company token से |
| `GET /accounting/ledger/balance` | वही छेद — दूसरी कंपनी का बैलेंस | company token से |
| `POST /accounting/accounts` | body का `company_id` सीधे Prisma में — यानी **दूसरी कंपनी में खाता बनाया जा सकता था** | company token से, body का company_id माना ही नहीं जाता |

(M10 की बाक़ी तीन रिपोर्टें 2026-09-04 को ठीक हुई थीं; ये तीन छूट गई थीं।)

## 5. जाँच असली DB पर — 8 tests

`m10-accounting/tests/api/party-isolation.db.test.ts` — जान-बूझकर दोनों parties को
**एक ही साझा खाते** पर रखा गया, क्योंकि असली ख़तरा वहीं है:

- party A का ledger सिर्फ़ A का (B की एक भी पंक्ति नहीं)
- दो sales parties की एक भी साझा पंक्ति नहीं
- sales party और purchase party अलग-अलग
- **inactive party पर भी वही नियम** (मालिक ने ख़ास कहा था)
- A का बैलेंस 600, B का 7000, जबकि साझा खाते का कुल 7850 — यानी बैलेंस कभी खाते से नहीं लिया जा रहा
- A में नई entry डालने से B का बैलेंस टस से मस नहीं होता
- दूसरी कंपनी की party का ledger कभी नहीं मिलता
- दूसरी कंपनी का खाता account_id जानकर भी नहीं पढ़ा जा सकता

**सुधार हटाकर भी चलाया** — 2 tests फ़ेल हुईं, यानी ये सच में पकड़ती हैं।

## 6. एक बात जो मालिक को तय करनी है ⚠️

`party_master` पर `@@unique([company_id, gstin])` लगा है — यानी **एक ही कंपनी में एक
GSTIN की दो parties नहीं बन सकतीं।**

अब सोचिए: कोई व्यापारी आपका **ग्राहक भी है और सप्लायर भी**। उसका GSTIN एक ही है।
इसलिए उसकी दो अलग parties (एक sales, एक purchase) बन ही नहीं सकतीं — `party_type`
में `both` डालकर **एक ही party** बनानी पड़ेगी। और तब उसका एक ही ledger होगा, जिसमें
बिक्री और ख़रीद दोनों चढ़ेंगी।

**यह आपके नियम 3 से टकराता दिख सकता है** ("Sales party और Purchase party के accounts
के बीच कोई direct link नहीं होगा")। दो रास्ते हैं:

- **(क)** ऐसे व्यापारी की एक ही party रहे (`both`) — एक ledger, दोनों तरफ़ का हिसाब
  एक जगह। सरल, पर बिक्री और ख़रीद एक ही खाते में मिलेंगी।
- **(ख)** दो अलग parties बनने दें (unique नियम बदलकर `[company_id, gstin, party_type]`)
  — तब हर तरफ़ का ledger पूरी तरह अलग, आपके नियम 3 के अक्षरशः अनुरूप।

**मैंने अपनी मर्ज़ी से नहीं बदला** — यह आपका व्यापारिक फ़ैसला है। बताइए, (क) या (ख)।
