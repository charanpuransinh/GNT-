# 📒 मालिक का फ़ैसला — M10 VoucherService रहेगा, और उसका design

**कब मिला:** 2026-09-05 · **किसने दर्ज किया:** समीक्षक AI
**पिछला सवाल:** मैंने बताया था कि `voucher.service.ts` को कोई नहीं बुलाता, फिर भी उसकी
3 tests हरी हैं — जोड़ें या हटाएँ? **मालिक का जवाब: रखा जाए, हटाया नहीं जाएगा।**

---

## मालिक के शब्द (शब्द-दर-शब्द)

> M10 VoucherService: रखा जाए, हटाया नहीं जाएगा।
> - हर payment/receipt (पूरा हो या partial) की अलग voucher entry बनेगी
> - हर voucher उस party के ledger और उस specific bill/invoice से लिंक होगा, ताकि matching
>   और बकाया अमाउंट ट्रैक हो सके
> - Partial payments allowed हों — एक बिल के against कई vouchers बन सकें जब तक पूरा
>   clear न हो जाए

---

## मैंने schema जाँचा — तीन में से दो चीज़ें अभी सँभलती हैं, तीसरी नहीं

| मालिक की शर्त | अभी schema में? |
|---|---|
| हर payment/receipt की अलग voucher entry | ✅ `voucher.voucher_type` + `voucher_number` से हो जाएगा |
| voucher ↔ **party** का लिंक | ✅ `voucher_item.party_id` और `ledger.party_id` मौजूद हैं |
| voucher ↔ **उस specific बिल** का लिंक | ❌ **voucher में बिल का कोई कॉलम है ही नहीं** |
| partial payment — बकाया कितना बचा | ❌ **कहीं दर्ज नहीं होता कि इस voucher ने उस बिल का कितना चुकाया** |

`ledger` में `reference_type` + `reference_id` ज़रूर हैं, पर उनसे यह नहीं निकलता कि
**एक बिल के against कई vouchers में से किसने कितना चुकाया** — और मालिक की तीसरी शर्त
(partial payment, बकाया tracking) ठीक यही माँगती है।

## मेरा प्रस्ताव (मालिक की मंज़ूरी के बिना बनाऊँगा नहीं)

एक नई तालिका — बिल और voucher के बीच "कितना चुकाया" रखने के लिए:

```
voucher_allocation
  id, company_id
  voucher_id        → कौन सा payment/receipt
  reference_type    → 'SALES_INVOICE' या 'PURCHASE_INVOICE'
  reference_id      → कौन सा बिल
  party_id          → किस party का (बिल की party से मेल खाना ज़रूरी)
  allocated_amount  → इस voucher ने इस बिल का कितना चुकाया
  unique(voucher_id, reference_type, reference_id)
```

इससे तीनों शर्तें पूरी होती हैं:
- एक बिल के against कई vouchers → कई rows, हर एक का अपना `allocated_amount`
- बकाया = बिल का कुल − उस बिल की सारी `allocated_amount` का जोड़
- party से लिंक हर row में — यानी **हार्ड रूल (party isolation) टूटता नहीं**:
  voucher सिर्फ़ *उसी* party के बिल से जुड़ेगा, दूसरी party से कभी नहीं
  (देखें `RULE-PARTY-LEDGER-ISOLATION.md`)

## साथ में एक गड़बड़ी जो जाँचते वक़्त मिली — खातों के code पर कंपनी की सीमा नहीं है

`account_master.code` पर `@unique` लगा है — **पूरे database में एक ही बार**, कंपनी के
हिसाब से नहीं। यानी अगर एक कंपनी "1000" code का खाता बना ले, तो **दूसरी कंपनी वही
code कभी नहीं बना पाएगी**। हर कंपनी का chart of accounts अपना होना चाहिए।

यह `@@unique([company_id, code])` होना चाहिए। यह उसी chart-of-accounts वाले P0 का
हिस्सा है (`P0-2-BILL-POST-NAHI-HOTA.md`) — वहीं ठीक होगा।

---

# ✅ बन गया — 2026-09-05

## `voucher_allocation` तालिका बनी (migration `009_M10_voucher_allocation.sql`)
असली database पर चल चुकी है। `allocated_amount > 0` की पक्की शर्त भी लगी है, और एक
voucher एक ही बिल पर दो बार नहीं चढ़ सकती।

## VoucherService अब सच में इस्तेमाल होती है
पहले उसे कोई बुलाता ही नहीं था (controller अपना अलग हिसाब रखता था) — **यही वजह थी कि
उसकी 3 tests हरी होकर भी कुछ साबित नहीं करती थीं।** अब payment/receipt और बकाया का
सारा काम इसी service से जाता है। पुरानी mock tests हटाकर असली DB वाली 13 tests लिखी हैं।

## नए रास्ते
```
POST /api/v1/accounting/vouchers/payment      ← भुगतान/प्राप्ति की voucher
GET  /api/v1/accounting/vouchers/outstanding  ← एक बिल: कुल, चुकाया, बकाया
GET  /api/v1/accounting/party-outstanding     ← एक party का पूरा बकाया
```

## मालिक की तीनों शर्तें — चलाकर साबित

| शर्त | नतीजा |
|---|---|
| हर payment (पूरा/partial) की **अलग** voucher | ₹10,000 का बिल → ₹4,000 + ₹3,000 + ₹3,000 = **तीन अलग vouchers** ✅ |
| voucher ↔ **party के ledger** से लिंक | तीनों भुगतान party के ledger में उसी party के नाम, हर एक अपनी voucher से जुड़ी ✅ |
| voucher ↔ **उस बिल** से लिंक | `voucher_allocation` में एक बिल पर 2-3 पंक्तियाँ ✅ |
| **partial payments चलें** | बकाया 10,000 → 6,000 → 3,000 → 0; बिल की हालत unpaid → partial → paid ✅ |
| बकाया ट्रैक हो | `getBillOutstanding` और `getPartyOutstanding` ✅ |

## साथ में हार्ड रूल (party isolation) यहीं लागू हुआ 🔒

**party A का भुगतान party B के बिल पर चढ़ ही नहीं सकता** — service कुछ लिखने से पहले
बिल की party मिलाती है, और मेल न खाने पर मना कर देती है। test में जाँचा: मना हुआ,
और B का बिल छुआ तक नहीं गया।

बाक़ी रोकें भी लगीं: बकाया से ज़्यादा नहीं चढ़ सकता · बिलों में बाँटी रकम कुल रकम से
मेल खानी चाहिए · बिना बिल चुने भुगतान नहीं · रद्द voucher का पैसा बकाया गिनती से
अपने आप बाहर।

## नापा हुआ
- 13/13 tests पास (असली DB, असली बिल बनाकर)
- **सुधार हटाकर चलाया तो 4 फ़ेल** — यानी tests सच में पकड़ती हैं
- पूरा suite: 88 files · 397 tests → 395 पास (दो फ़ेल वही पुरानी M11 वाली) · skip 0
- tsc: M13 के बाहर 0

## अब भी आपका फ़ैसला बाक़ी ⚠️
1. **खातों की सूची (chart of accounts)** — बिक्री की रकम किस खाते में चढ़े। अभी
   भुगतान की voucher बनाते वक़्त बैंक और party का खाता **बाहर से देना पड़ता है**;
   सूची बनते ही यह अपने आप होगा। (`P0-2-BILL-POST-NAHI-HOTA.md`)
2. **`account_master.code` का unique** — अभी पूरे DB पर है, कंपनी के हिसाब से होना
   चाहिए। यह chart of accounts के साथ ही ठीक होगा।
