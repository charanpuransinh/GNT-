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

## हालत

**दर्ज हुआ ✅ · अभी बनाया नहीं गया।** क़तार में मालिक के तीन फ़ैसले हैं; मैं क्रम से
कर रहा हूँ (1. permission व्यवस्था — चालू, 2. party isolation की जाँच, 3. यह voucher design)।
