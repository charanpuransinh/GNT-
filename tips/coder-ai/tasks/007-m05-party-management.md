# टास्क #007 — M05 Party Management: पूरा module बनाना

**प्राथमिकता:** P0 — **Class B का दरवाज़ा** · **रेपो रूट:** `/root/gnt-project/GNT_GITHUB_REPOSITORY`
**दायरा:** `backend/src/modules/m05-party-management/` (पूरा), `frontend/src/modules/m05-party-management/`,
`prisma/schema.prisma` (सिर्फ़ नए models), `module-registry.ts`, और M08 की 3 lines (नीचे देखो)

> **यह module अभी पूरी तरह ख़ाली है** — सिर्फ़ `.gitkeep` और एक stub `index.ts`।
> AUDIT-01 की F3 यही थी। blueprint कहता है **CLASS A = M01–M05**, यानी M05 के बिना
> Team A "पूरा" नहीं कहलाएगा — और `M05 → M06 (public contract only)` की वजह से
> **पूरा Class B (M06–M10) इसी पर टिका है।**

---

## पहले पढ़ो — यह module क्या है और क्या नहीं

**Blueprint (`docs/03_…MAPPING.md:124-141`):**
- **देता है:** party का डेटा, बकाया (outstanding), उधार की सीमा (credit limit), उम्र (aging)
- **इस्तेमाल करता है:** M02 (सुरक्षा), M10 (खाते का बैलेंस — **तय contract से**)
- **UI:** `PartyListPage`, `PartyEntryDrawer`, `PartyDetailHubPage`

**"Party" का मतलब:** दुकानदार का **अपना ग्राहक या सप्लायर** — यानी जिसे वो माल बेचता है
या जिससे ख़रीदता है। **यह वो कंपनी नहीं है जो GNT इस्तेमाल कर रही है** (वो `company_master`, M04 है)।

---

## Step 1 — `party_master` model (यह डिज़ाइन मैंने तय किया है)

इसका कोई SQL source repo में नहीं है (मैंने पूरा ढूँढा) — इसलिए मैंने ख़ुद डिज़ाइन किया,
`company_master` की शैली और भारतीय GST की ज़रूरतों को देखकर। **इसे ज्यों-का-त्यों लो:**

```prisma
model party_master {
  id             String   @id @default(uuid()) @db.Uuid
  company_id     String   @db.Uuid
  branch_id      String?  @db.Uuid
  party_type     String   @db.VarChar(10)   // customer | supplier | both
  name           String   @db.VarChar(200)
  display_name   String?  @db.VarChar(100)  // बिल में छोटा नाम
  gstin          String?  @db.VarChar(15)
  pan            String?  @db.VarChar(10)
  gst_type       String?  @db.VarChar(20)   // regular | composition | unregistered | sez | overseas
  contact_person String?  @db.VarChar(100)
  phone          String?  @db.VarChar(20)
  alt_phone      String?  @db.VarChar(20)
  email          String?  @db.VarChar(255)
  billing_address String? @db.Text
  shipping_address String? @db.Text
  city           String?  @db.VarChar(100)
  state_code     String?  @db.VarChar(2)    // GST राज्य कोड — CGST/SGST बनाम IGST यहीं से तय होता है
  pincode        String?  @db.VarChar(10)
  country        String   @default("IN") @db.VarChar(2)
  credit_limit   Decimal  @default(0) @db.Decimal(14, 2)
  credit_days    Int      @default(0)
  opening_balance Decimal @default(0) @db.Decimal(14, 2)
  opening_type   String   @default("dr") @db.VarChar(2)   // dr | cr
  notes          String?  @db.Text
  is_active      Boolean  @default(true)
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
  created_by     String?  @db.Uuid
  updated_by     String?  @db.Uuid

  company_master company_master @relation(fields: [company_id], references: [id], onDelete: Cascade)

  @@unique([company_id, gstin])
  @@index([company_id, party_type])
  @@index([company_id, name])
  @@map("party_master")
}
```
`company_master` में जोड़ना होगा: `party_master party_master[]`

**डिज़ाइन के 3 फ़ैसले जो मैंने लिए (वजह सहित, ताकि बाद में कोई बदले नहीं):**
1. **ग्राहक और सप्लायर एक ही table में** (`party_type`) — दो अलग tables नहीं। वजह: भारत में
   एक ही पार्टी अक्सर दोनों होती है (उससे ख़रीदते भी हैं, बेचते भी) — दो tables होने पर
   एक ही आदमी दो जगह बनता, और बकाया दो हिस्सों में बँट जाता।
2. **`state_code` अलग field** — GST में CGST/SGST लगेगा या IGST, यह **इसी** से तय होता है।
   पते के अंदर छिपा रहने पर हर बार निकालना पड़ता और गलती होती।
3. **बकाया यहाँ *store* नहीं होगा** — वो M10 (खाते) से **गिनकर** आएगा। वजह: दो जगह रखा हुआ
   बकाया कभी न कभी अलग हो ही जाता है, और तब कौन सा सही है यह पता नहीं चलता।

## Step 2 — backend का पूरा ढाँचा

```
m05-party-management/
├─ types/party.types.ts          → Party, PartyType, CreatePartyDTO, UpdatePartyDTO,
│                                   PartyOutstanding, PartyAging, CreditCheckResult
├─ validators/party.schema.ts    → Zod: createPartySchema, updatePartySchema, partyQuerySchema
│                                   (GSTIN 15 अक्षर, phone, state_code 2 अंक की जाँच)
├─ repositories/party.repository.ts → CRUD, हर query में company_id (⚠️ नीचे नियम देखो)
├─ services/party.service.ts     → **public** — दूसरे modules इसी को बुलाएँगे
├─ services/party.internal.ts    → module के अंदर का हिसाब-किताब
├─ controllers/party.controller.ts
├─ routes/party.routes.ts        → ⚠️ रास्ते `/` से शुरू करना, `/parties/` से **नहीं**
│                                   (M17/M20 में यही गलती हुई थी — पता दोहरा हो गया था)
├─ events/party.events.ts + party.handlers.ts
└─ index.ts                      → public contract (नीचे की सूची)
```

## Step 3 — public contract (यह सबसे ज़रूरी है — दूसरे modules इसी पर चलेंगे)

`index.ts` से **सिर्फ़ ये** बाहर जाएँगे:
```ts
export { PartyService, partyService } from './services/party.service';
export * from './types/party.types';
export { default as partyRoutes } from './routes/party.routes';
```
**❌ repository कभी export मत करना** (blueprint में साफ़ मना)।

`PartyService` में **कम से कम ये तीन** होने ही चाहिए — क्योंकि M08 **आज भी इन्हें बुला रहा है**
(`m08-sales/services/sales.service.ts:225,233`; `return.service.ts:120`):
```ts
getCustomerById(id: string, company_id: string): Promise<Party | null>
getSupplierById(id: string, company_id: string): Promise<Party | null>
checkCreditLimit(party_id: string, company_id: string, new_amount: number): Promise<CreditCheckResult>
```
साथ में: `getOutstanding()`, `getAging()` — पर **इनका असली हिसाब M10 से** आएगा
(अभी M10 का ledger तैयार नहीं, इसलिए ये **खाली/शून्य लौटाएँ और TODO(#016) लिखें** —
**नक़ली आँकड़े मत गढ़ना**, वरना रिपोर्ट पर भरोसा ख़त्म हो जाएगा)।

## Step 4 — M08 की एक गलती ठीक करो (3 lines)

M08 अभी यह कर रहा है:
```ts
const company = await partyService.getCompanyById(invoice.companyId);   // ❌
```
**Party service से company माँगना गलत है** — company M04 की चीज़ है।
तीनों जगह (`sales.service.ts:226,339`, `return.service.ts:121`) इसे
**M04 के public contract** से लो। `getCompanyById` को M05 में **मत बनाना**।

## Step 5 — frontend के 3 पेज (rough चलेगा, सुंदर बाद में)

`PartyListPage` (सूची + खोज + ग्राहक/सप्लायर छाँटना), `PartyEntryDrawer` (नया/बदलाव का फ़ॉर्म),
`PartyDetailHubPage` (एक पार्टी का पूरा ब्यौरा + बकाया की जगह)।
मौजूदा साझा components इस्तेमाल करो (`@/components/ui/*`) — नए मत बनाओ।
फिर `frontend/src/routes.tsx` में तीनों दर्ज करो (वहाँ का तरीक़ा देखकर वैसा ही)।

## Step 6 — mount + चलाकर दिखाओ

`module-registry.ts` में M05 → `mounted: true` + `load()`, path `/api/v1/parties`।
फिर server चलाकर startup की लाइन और `curl` का status log में दो
(**14 modules** चढ़ने चाहिए, अभी 13 हैं)।

---

## ⚠️ tenant सुरक्षा का नियम (यहाँ शुरू से सही करना है)
यह **नया** module है — इसमें वो पुरानी गलती **दोहराना नहीं**:
- `x-company-id` या `body.company_id` पर **कभी भरोसा नहीं** — हमेशा `req.tenant.companyId`
- repository की **हर** query में `where: { company_id }` — एक भी जगह छूटी तो
  एक दुकानदार की पार्टी दूसरे को दिख जाएगी
*(टास्क #009 यही पूरे repo में ठीक कर रहा है — M05 पहले दिन से सही बने।)*

## जो नहीं करना
❌ `as any` / `@ts-ignore` · ❌ बकाया को party table में store करना · ❌ repository public export
❌ `getCompanyById` M05 में बनाना · ❌ routes में `/parties/` prefix (दोहरा पता बन जाएगा)
❌ नक़ली outstanding/aging के आँकड़े गढ़ना

## पास/फेल
```
npx prisma validate --schema prisma/schema.prisma                              # valid
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -c "m05-party"           # → 0
npx tsc -p tsconfig.frontend.json --noEmit 2>&1 | grep -c "m05-party"          # → 0
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -cE "error TS"           # घटे (M08 के भी कुछ जाएँगे)
```
+ server का startup output (14 modules) + route की परिभाषा `grep` से दिखाओ
> **⚠️ टेस्ट का तरीक़ा बदल गया (समीक्षक AI, 2026-09-02):** पहले मैंने लिखा था
> *"401 आना = रास्ता मिल गया"*। **यह अब सही नहीं है।** टास्क #009 के बाद auth
> `app.ts` में एक ही जगह लग गया है, इसलिए `/api/v1/*` के **हर** पते पर 401 आता है —
> चाहे वहाँ कोई route हो या न हो (मैंने `/api/v1/reports/xyz-kuch-bhi-nahi` पर भी 401
> देखकर पक्का किया)।
> **रास्ता सच में मौजूद है या नहीं, यह साबित करने के 2 सही तरीक़े:**
> 1. `curl` के साथ **असली token** भेजो (login से मिलेगा — DB चालू होने पर), या
> 2. route की परिभाषा **कोड में पढ़कर** दिखाओ (`grep -n "router.get('/sales'" …`)
>    और startup की mount-लाइन दिखाओ। **401 को सबूत मत मानना।**


## रिपोर्ट
दोनों जगह + सत्र नोट। schema, contract और frontend — तीनों के लिए अलग commit।

— समीक्षक AI (Claude), 2026-09-02
