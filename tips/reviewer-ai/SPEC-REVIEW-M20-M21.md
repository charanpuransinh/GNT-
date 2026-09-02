# समीक्षा — मालिक की नई Spec (M20 / M21 / Accounts) और (M08 / M16 Trade Scheme)

**किसने की:** समीक्षक AI (Claude) · **तारीख़:** 2026-09-02
**स्रोत:** GitHub commits `d5e6e0d`, `bbee5f5` — दो फाइलें, दोनों का नाम
`GNT_M20_M21_M11_M20_M21_MASTER_UPDATE_README.md`

---

## ⚠️ सबसे पहली बात — दो फाइलें, एक ही नाम, पर **अंदर बिल्कुल अलग दस्तावेज़**

| कहाँ | असली विषय | lines |
|---|---|---|
| `tips/owner-puran-singh/…MASTER_UPDATE_README.md` | **M20 Export Hub + M21 Data Sense + Accounts का bank statement auto-posting** | 1296 |
| `tips/…/GNT_M20_M21_M11_M20_M21_MASTER_UPDATE_README.md` (tips की जड़ में) | **M08 Trade Scheme + M16 WhatsApp Campaign + Buyer self-ordering** | 1101 |

दोनों वैध और उपयोगी हैं — पर **एक ही नाम होने से कोई भी दूसरे को "पुराना version" समझकर
हटा सकता है।** नाम अलग करने चाहिए (नीचे सुझाव)।

---

# भाग A — दस्तावेज़ #1 का सार (M20 / M21 / Accounts)

**केंद्रीय फ़ैसला (§1):** तीन मालिक तय किए गए —

| Module | ज़िम्मेदारी |
|---|---|
| **M20** | Export & International Trade का **पूरा** hub (सिर्फ़ quotation calculator नहीं) |
| **M21** (नया) | Client Data Sense — पुरानी फाइल पढ़कर GNT में लाना |
| **मौजूदा Accounts** | Payment, Bank statement, Receipt, Settlement — **M21 में नहीं** |

**M20 (§2–§10):** overseas buyer → quotation → PI → export order → packing → CHA/port →
customs → shipment → BL/AWB → commercial invoice → realisation → closure।
साथ में landed cost, 13 तरह के export documents, structured invoice (UBL/Peppol),
country-wise rules **बिना hard-coding** के।

**M21 (§11–§21):** UPLOAD → SENSE → MAP → NORMALIZE → VALIDATE → DUPLICATE CHECK →
PREVIEW → APPROVAL → TRANSFER। **"NO-HEAVY-AI" नियम (§14)** — header dictionary, alias table,
pattern से पहचानो; समझ न आए तो `NEEDS REVIEW`, **अंदाज़ा मत लगाओ**।
नतीजा GREEN / ORANGE / RED।

**Accounts (§22–§30):** पूरे महीने का bank statement एक बार में → credit/debit → party पहचान →
receipt/payment → invoice matching → advance → ledger → reconciliation।
पहचान deterministic हो (party code, bank a/c, UPI VPA, UTR…), सिर्फ़ narration पर नहीं।
duplicate statement दोबारा चढ़े तो दोबारा posting न हो।

---

# भाग B — दस्तावेज़ #2 का सार (M08 / M16)

**केंद्रीय फ़ैसला:** *"M22 मत बनाओ"* — यह सब **M08 और M16 के अंदर** जाएगा।

**M08 Trade Scheme:** तीन परिवार — (1) मात्रा पर दर बदलना (500+ पर ₹80), (2) slab पर मुफ़्त माल
(100 पर 5 free), (3) रक़म पर छूट (₹50k → 2%)। नियम **configurable**, hard-code नहीं।
मुफ़्त माल चुपचाप बिका हुआ माल न बन जाए।

**M16 WhatsApp Campaign:** scheme का professional संदेश → **secure order link** → ग्राहक ख़ुद
मात्रा चुनकर order डाले → वो **PENDING ORDER** बने → M08 का scheme engine **server पर दोबारा
गणना करे** (client से आई क़ीमत पर भरोसा नहीं) → फिर मौजूदा approval।

---

# भाग C — repo की मौजूदा हालत से मिलान

| spec क्या माँगती है | repo में आज | फ़ैसला |
|---|---|---|
| M20 export hub | 6 services हैं (customs, fx, hsn, trade-document, trade) — **quotation/landed-cost/shipping नहीं** | जोड़ना है |
| M21 module | **कहीं नहीं था** | ✅ ढाँचा बना दिया (`m21-data-sense/`) |
| Accounts = payment का मालिक | **M10** (ledger, voucher, brs) + **M11** (payment, reconciliation, bankAccount) — **दो जगह** | ⚠️ फ़ैसला चाहिए |
| M08 scheme engine | scheme का **कोई कोड नहीं** | नया बनेगा |
| M16 campaign | whatsapp/sms/email हैं, **campaign नहीं** | नया बनेगा |
| M20 = HSN का single owner | `hsn_master` **M09 का है**, `customs_tariff` M20 का | ⚠️ **टकराव** |

---

# 🔴 भाग D — 4 टकराव / फ़ैसले (इनके बिना आगे नहीं बढ़ूँगा)

### 1. HSN का मालिक कौन — M09 या M20?
spec §7: *"M20 is the Single Source of Truth for HSN/Tariff… M09 must not create a second
independent HSN master."*
**पर repo में `hsn_master` पहले से M09 का है** (GST दर, per-company), और कल ही टास्क #015 में
मैंने तय किया था कि **M09 का अछूता रहेगा, M20 को अलग `customs_tariff` मिलेगी** —
वरना पूरे repo की GST गणना टूट जाती।

**मेरा प्रस्ताव (मंज़ूरी चाहिए):** दोनों बने रहें, पर भूमिका बँटे —
- `customs_tariff` (M20) = **8-अंकों का राष्ट्रीय tariff** — BCD, SWS, customs — **यही spec वाला "single source"**
- `hsn_master` (M09) = हर कंपनी की **GST दर की सेटिंग**, जो `customs_tariff` से **जुड़ी** रहेगी
यानी वर्गीकरण M20 का, GST-दर M09 की। **दो अलग masters नहीं — एक source, एक config।**

### 2. M21 नंबर का टकराव
**मैंने pricing/subscription के design में `m21-subscription` प्रस्तावित किया था**
(`PRICING_SUBSCRIPTION_STRATEGY.md` का Suggestions हिस्सा)। अब **M21 = Data Sense** हो गया।
**प्रस्ताव:** subscription वाला **M22** बने। *(यह सिर्फ़ नाम का बदलाव है, डिज़ाइन वही रहेगा।)*

### 3. "मौजूदा Accounts module" का मतलब — M10 या M11?
spec बार-बार *"existing Accounts/Accounting module"* कहती है, पर repo में **दोनों हैं**:
`M10` (ledger, voucher, **brs** = bank reconciliation statement) और
`M11` (payment, **reconciliation**, bankAccount, refund)।
**bank statement auto-posting किसमें जाए?**
**मेरा प्रस्ताव:** statement पढ़ना + party पहचान + receipt/payment बनाना → **M11**;
ledger posting + reconciliation → **M10** (उसका `brs.service` पहले से यही काम है)।

### 4. blueprint में M21 है ही नहीं
`docs/` का पूरा blueprint **M01–M20** पर बना है — M21 कहीं नहीं।
spec नया module माँगती है, यानी **blueprint बदलेगा**। मालिक की मंज़ूरी से यह ठीक है,
पर तीनों map फाइलों में दर्ज होना चाहिए, वरना अगला audit इसे "बिना अनुमति बना module" कहेगा।

---

# भाग E — क्या अभी सुरक्षित जोड़ा जा सकता है, क्या नहीं

### ✅ अभी सुरक्षित (कुछ तोड़े बिना)
1. **M21 का खाली ढाँचा** — 10 फोल्डर + `index.ts` जिसमें भूमिका, मनाही और routing तालिका दर्ज
2. **module-registry में M21 की entry** (`mounted: false`, वजह लिखी हुई)
3. **यह समीक्षा-दस्तावेज़** + दोनों spec फाइलों के नाम साफ़ करना
4. **pricing दस्तावेज़ में M21 → M22** का सुधार (नाम का टकराव हटाना)

### ⚠️ अभी नहीं — पहले फ़ैसला/जाँच चाहिए
| क्या | क्यों रोका |
|---|---|
| M20 के नए models (buyer, quotation, shipment, landed cost…) | HSN वाला टकराव पहले सुलझे; और M20 अभी 0 errors पर है — बिना सोचे models जोड़ने से वो टूटेगा |
| M08 का scheme engine | पैसे की गणना है (दर/छूट/मुफ़्त माल)। M08 में अभी **19 errors** बाक़ी हैं — पहले वो हरा हो |
| M16 का campaign + order link | **सुरक्षा का काम** — public order link, token, दर की दोबारा गणना। #009 (tenant सुरक्षा) पहले पूरा हो |
| Bank statement auto-posting | पैसे का सीधा मामला + फ़ैसला #3 बाक़ी + **database अभी चल ही नहीं रहा** |
| M21 का असली logic | पहले M05 (party) बने — वरना "party भेजो" किसे भेजें? M05 अभी ख़ाली है |

---

# भाग F — सुझाया गया क्रम (मेरा फ़ैसला)

```
अभी चल रहा:  #009 tenant सुरक्षा (DeepSeek का balance आते ही पूरा)
फिर:         #008 M11–M15 schema merge  →  #016 M06–M10 हरा  →  #007 M05
उसके बाद:    #019 M20 export hub (HSN का फ़ैसला आने पर)
             #020 M21 data sense (M05 बनने के बाद)
             #021 M08 trade scheme  →  #022 M16 campaign (सुरक्षा के बाद)
             #023 Accounts bank statement (database आने पर)
```

**वजह:** नई spec का हर हिस्सा उन्हीं modules पर टिका है जो अभी अधूरे हैं। M05 बने बिना M21
किसे डेटा भेजेगा? M08 हरा हुए बिना उसमें scheme कैसे जुड़ेगा? इसलिए **नींव पहले, नई मंज़िल बाद में।**

— समीक्षक AI (Claude), 2026-09-02
