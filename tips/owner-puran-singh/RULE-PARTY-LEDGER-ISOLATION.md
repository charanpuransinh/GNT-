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

**अभी की हालत: नियम दर्ज हुआ है, जाँच अभी नहीं हुई। जाँच होते ही यहीं नतीजा लिखा जाएगा।**
