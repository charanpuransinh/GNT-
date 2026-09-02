# RAKSHA — Pricing, Subscription & Trust Strategy
**Group:** मा आदिशक्ति | **Brand:** RAKSHA | **Project:** GARUDA NEXTECH (GNT)
**Document Status:** Owner Blueprint — Claude/DeepSeek इसे पढ़कर अपने सुझाव/setup नीचे जोड़ें

---

## उद्देश्य (Purpose)
यह document owner (Charan Puran Singh) की तरफ़ से एक pricing/subscription/trust strategy का blueprint है। इसका मकसद तीन चीज़ों को साथ लेकर चलना है:

1. **नया client-base बनाना** — अभी market में हमारा कोई ग्राहक नहीं है, शुरुआत से बनाना है
2. **Feature-advantage** — हमारे 20 modules (M01–M20) Vyapar, myBillBook, Marg ERP जैसे competitors से ज़्यादा advanced हैं
3. **Trust पहले, Lock बाद में** — किसी भी party का access अचानक/गलत तरीके से रोकना trust तोड़ता है; block/lock का तरीका इंसानी और पारदर्शी होना चाहिए

---

## 1. Market Research — Competitors की Pricing (2026)

| App | Free Tier | Entry Plan | Mid Plan | बड़ा Plan | Billing Model |
|---|---|---|---|---|---|
| **Vyapar** | Mobile app हमेशा फ्री (basic) | ₹3,400/साल (Desktop Silver) | ₹4,000/साल (Desktop+Mobile) | Gold edition | सिर्फ Yearly |
| **myBillBook** | 7-दिन ट्रायल | ₹349–399/महीना (Silver) | Platinum (ज़्यादा users) | Multi-business + CA access | Monthly + Yearly (yearly पर 20–35% discount) |
| **Marg ERP** | कोई फ्री नहीं | ₹8,000–12,000 one-time + AMC ₹2–5k/साल | ₹13,900 (Silver) | ₹25,000+ (Gold, unlimited users) | One-time + अलग AMC |

**मुख्य सीख:**
- myBillBook का मॉडल हमारे इस्तेमाल-केस (GST छोटे व्यापारी) से सबसे मिलता-जुलता है
- Yearly पर discount (20–35%) industry-standard है
- ऊपर के plans में ज़्यादा users/companies/advanced features मिलते हैं — नीचे के plan में सीमित

---

## 2. हमारी रणनीति

### 2.1 Pricing — Penetration Strategy (नए client base के लिए)
नए product को शुरुआत में जानबूझकर सस्ता रखना है ताकि लोग बिना झिझक अपनाएं, base बने, फिर धीरे-धीरे कीमत सामान्य हो।

| Plan | कीमत | किसके लिए | Lock-in |
|---|---|---|---|
| **Founding Member** | ₹199/महीना | पहले 100 clients | Lifetime lock (कभी नहीं बढ़ेगी) |
| **Basic** | ₹299/महीना या ₹2,999/साल | नए/छोटे व्यापारी | — |
| **Pro** | ₹599/महीना या ₹5,999/साल | बढ़ते व्यापारी, multi-user, automation | — |
| **Enterprise** | Custom | बड़े distributor/wholesaler | Custom |

### 2.2 Feature-Advantage को पहले दिखाओ, फिर बेचो
हमारे पास M13 (Smart Automation), M16 (WhatsApp Notification Engine), M20 (International Trade/HSN) जैसे modules हैं जो competitors के पास नहीं हैं।
- Trial में यह advanced features **खुलकर दिखाएं** (लॉक न करें)
- ग्राहक जब असली फ़ायदा महसूस करे, तभी upgrade खुद मांगेगा

### 2.3 Trust-First Block Policy
- Trial खत्म होते ही access पूरी तरह बंद न करें — पहले **15 दिन Read-only mode** (पुराना डेटा दिखे, नया बिल न बने)
- **डेटा कभी न मिटे/गायब हो** — चाहे payment हो या न हो, ग्राहक का बिल/customer डेटा हमेशा सुरक्षित रहे
- Block से पहले WhatsApp पर इंसानी भाषा में मैसेज — धमकी वाली भाषा नहीं

### 2.4 Loyalty & Referral (Client-Base बनाने के लिए)
- पहले 50–100 clients को स्थायी discount (Founding Member) दें
- Referral incentive — एक ग्राहक दूसरा लाए तो दोनों को 1–2 महीने फ्री

---

## 3. System Requirements (Technical — Claude/DeepSeek के लिए)

### 3.1 Company Code System
- Database में company के लिए एक छोटा unique code column (जैसे `GNT01`, `GNT02`...)
- Login में GSTIN (15 अंक) की जगह यही छोटा code इस्तेमाल हो

### 3.2 Trial / Subscription Status
- Company record में `status` field: `trial | active | blocked | expired`
- `trial_expiry_date` field — trial शुरू होने से **6 महीने बाद** (GST quarterly cycle से मेल खाता है)
- Expiry से पहले 15 / 7 / 1 दिन पर WhatsApp reminder (M16 Notification Engine इस्तेमाल करें)
- कोई response/payment न आने पर 7वें महीने अपने-आप block, पर उससे पहले 15 दिन Read-only mode

### 3.3 Plans / Pricing Table (System में flexible रखें)
- हर plan के लिए: नाम, price (monthly/yearly), कौन-कौन से modules/features शामिल — यह सब बदलने लायक (hardcoded नहीं) होना चाहिए
- Founding Member plan का lifetime-lock price अलग से track हो सके

### 3.4 Owner Control Panel
- Owner (मैं) किसी भी company का status कभी भी manually बदल सके — trial→active, active→blocked, blocked→active
- हर company की history/log दिखे (कब trial शुरू हुआ, कब reminder गया, कब block हुआ)

### 3.5 Payment Integration
- Razorpay/PayU जैसा payment gateway M11 (Payment & Communication) module से जोड़ा जाए ताकि customer खुद online renew कर सके

---

## 4. Claude/DeepSeek के लिए Note
यह document एक **strategy blueprint** है, final locked spec नहीं। कृपया:
1. इसे पढ़कर अपने technical सुझाव/comments नीचे "Suggestions" section में जोड़ें (delete न करें, नीचे जोड़ें)
2. Database schema, API design, और implementation plan अपने हिसाब से प्रस्तावित करें
3. जो भी अस्पष्ट लगे, उसे owner से पूछने के लिए `tips/owner-puran-singh/log.md` में सवाल के तौर पर नोट करें

---

## Suggestions (Claude/DeepSeek यहां लिखें)

_(यहाँ से नीचे अपने सुझाव जोड़ें — ऊपर का content न बदलें)_
