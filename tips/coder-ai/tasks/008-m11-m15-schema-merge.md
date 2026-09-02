# टास्क #008 — M11/M12/M14/M15 के models canonical schema में लाना

**प्राथमिकता:** P1 — **सबसे बड़ा असर** · **रेपो रूट:** `/root/gnt-project/GNT_GITHUB_REPOSITORY`
**दायरा:** `prisma/schema.prisma` + M11, M12, M14, M15 का कोड
**⛔ M13 इस टास्क में नहीं है** — उसकी 3 आपस में टकराती schema परिभाषाएँ हैं, मालिक का फ़ैसला बाक़ी।

**क्यों यह सबसे बड़ा काम है:** बचे हुए 767 backend errors में से लगभग **530 इन्हीं चार modules में** हैं,
और उनकी जड़ एक ही है — इनके tables canonical schema में कभी merge ही नहीं हुए।

---

## पहले यह समझो — नाम मेल नहीं खाते

कोड जिन नामों से बुलाता है और side फाइलों में जो नाम हैं, वो **कई जगह अलग** हैं।
मैंने एक-एक मिलाकर नीचे फ़ैसला दे दिया है। **अपने मन से कुछ मत बदलना।**

### M11 — Payment (`database/schema/M11_Payment.prisma`)

| कोड बुलाता है | schema में | मेरा फ़ैसला |
|---|---|---|
| `paymentTransaction` | `PaymentTransaction` | ✅ मेल है — जोड़ दो |
| `paymentMethod` | `PaymentMethod` | ✅ जोड़ दो |
| `bankAccount` | `BankAccount` | ✅ जोड़ दो |
| `refund` | `Refund` | ✅ जोड़ दो |
| `ledgerEntry` | `PaymentLedgerEntry` | **कोड बदलेगा** → `prisma.paymentLedgerEntry`. model का नाम मत छोटा करना — `ledgerEntry` नाम M10 के ledger से भ्रम पैदा करेगा |
| `reconciliation` | `PaymentReconciliation` | **कोड बदलेगा** → `prisma.paymentReconciliation` |
| `payment` | — (नहीं है) | **कोड बदलेगा** → `prisma.paymentTransaction`. नया model **मत बनाना** |
| `reconciliationItem` | — (नहीं है) | नया model `PaymentReconciliationItem` जोड़ो (`@@map("payment_reconciliation_item")`), `PaymentReconciliation` से relation के साथ |
| `invoice` | — | ⛔ **यहाँ रुको।** M11 को invoice का मालिक बनाना blueprint के ख़िलाफ़ है — invoice M07 (`purchase_invoice`) और M08 (`SalesInvoice`) के हैं। **नया `invoice` model बिल्कुल मत बनाना।** कोड में जहाँ `prisma.invoice` है, वहाँ log में लिखकर छोड़ दो — मैं तय करूँगा कि कौन सा invoice चाहिए। यही अकेली जगह है जहाँ तुम्हें रुकना है |

### M12 — HR (`database/schema/M12_HR.prisma`)
`Employee`, `Department`, `Designation`, `EmployeeDocument`, `Shift`, `Attendance`, `LeaveType`,
`Leave`, `Holiday`, `Payroll`, `PayrollTemplate` — **सब ज्यों-के-त्यों जोड़ो।**

| कोड बुलाता है | फ़ैसला |
|---|---|
| `leaveBalance` | नया model `LeaveBalance` (`@@map("leave_balance")`) — `Employee` + `LeaveType` से relation, fields: `employee_id`, `leave_type_id`, `year`, `entitled`, `used`, `balance` |
| `hrEventLog` | नया model `HREventLog` (`@@map("hr_event_log")`) — `employee_id`, `event_type`, `payload Json?`, `created_at` |

### M14 — Import/Export (`database/schema/M14_ImportExport.prisma`)
सातों जोड़ो। `importTemplate` कोड में है पर schema में नहीं —
**`ImportMapping` ही वो चीज़ है**, इसलिए **कोड बदलेगा** → `prisma.importMapping`.

### M15 — Sync (`database/schema/M15_Sync.prisma`)
सातों जोड़ो (`SyncConfig`, `SyncEntityConfig`, `SyncJob`, `SyncEntityLog`, `SyncConflict`,
`ExternalIntegration`, `SyncState`)।

| कोड बुलाता है | फ़ैसला |
|---|---|
| `syncQueueItem` | नया model `SyncQueueItem` (`@@map("sync_queue_item")`) — offline queue की जान है: `company_id`, `entity`, `entity_id`, `operation`, `payload Json`, `status`, `attempts`, `created_at` |
| `backupJob` / `restoreJob` | नए models `BackupJob` / `RestoreJob` — M15 का ऐलान किया हुआ काम है (backup/restore) |
| `webhookEndpoint` / `webhookDelivery` | ⛔ **ये M15 के हैं ही नहीं — M18 के हैं।** M18 में `webhook_log` पहले से मौजूद है। नया model मत बनाना; कोड में जहाँ ये हैं वहाँ log में लिखकर छोड़ दो, मैं तय करूँगा |
| `externalIntegration` | ⚠️ M18 का `integration_config` लगभग यही है। **अभी `ExternalIntegration` जोड़ दो** (M15 की अपनी sync-settings के लिए), पर log में लिख देना — दोनों का विलय बाद में देखूँगा |

---

## करने का तरीक़ा (क्रम से, एक module पूरा करके अगला)

1. **एक बार में एक module** — M11 → M12 → M14 → M15। हर एक के बाद `prisma validate` + `generate`।
2. models ज्यों-के-त्यों उठाओ, **`@@map` ज़रूर रखो** (canonical की table snake_case में हैं)।
3. जहाँ side फाइल में `company_id` न हो पर बाक़ी सब models में है — **वैसा ही रहने दो**,
   अपने मन से मत जोड़ो; log में लिख देना कि किन models में company_id नहीं है
   (multi-tenant की जाँच मैं अलग से करूँगा — यह सुरक्षा का मामला है)।
4. फिर कोड के वो नाम बदलो जो ऊपर तालिका में लिखे हैं — **सिर्फ़ वही, और कुछ नहीं।**
5. हर module के बाद उसका tsc count log में लिखो।

## जो नहीं करना
- ❌ **M13 को हाथ मत लगाना** (3 टकराती परिभाषाएँ — मालिक का फ़ैसला बाक़ी)
- ❌ `invoice`, `webhookEndpoint`, `webhookDelivery` के नए models **मत बनाना** (ऊपर वजह लिखी है)
- ❌ मौजूदा 50+ models का कोई field नाम/type बदलना
- ❌ `generator`/`datasource` block छूना
- ❌ `as any` / `@ts-ignore`

## पास/फेल
```
npx prisma validate --schema prisma/schema.prisma        # valid
npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -cE "error TS"    # 767 से काफ़ी नीचे
# हर module अलग से:
... | grep -c "modules/m11-payment"    # 203 से घटे
... | grep -c "modules/m12-hr"         # 60 से घटे
... | grep -c "modules/m14-import-export"  # 149 से घटे
... | grep -c "modules/m15-sync"       # 183 से घटे
```
**चारों के 0 होने की उम्मीद मत रखना** — models आने के बाद भी कोड की अपनी गड़बड़ें बचेंगी।
जो बचे उन्हें log में गिनकर लिख देना, अगला टास्क उन्हीं पर बनेगा।

## रिपोर्ट
दोनों जगह (`tips/reviewer-ai/log.md` तकनीकी + `tips/owner-puran-singh/log.md` आसान हिंदी)
और साथ में सत्र नोट। commit करते रहो, हर module के बाद अलग commit।

— समीक्षक AI (Claude), 2026-09-02
