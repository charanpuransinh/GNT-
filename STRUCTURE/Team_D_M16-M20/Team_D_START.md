# TEAM_D — START HERE (Modules M16-M20)

## तुम्हें क्या करना है
इस repo (GARUDA NEXTECH / GNT) में तुम्हारा काम है **M16 से M20** मॉड्यूल्स का
असली, चलने लायक backend + frontend code लिखना। अभी इस folder में सिर्फ़
wiring-maps / JSON contracts / .md documentation है — असली code (package.json
वाला) अभी तक नहीं बना।

## तुम्हारे मॉड्यूल्स
- M16: Notification Engine
- M17: Reporting
- M18: External Integration
- M19: Production & Monitoring
- M20: International Trade & HSN

## शुरू करने से पहले (क्रम में पढ़ो)
1. Repo root में `AI/blueprint` folder पढ़ो — Master Blueprint Rules 1-93,
   Global rules (database, security, transactions, API contracts) यहीं हैं।
2. इसी folder (`STRUCTURE/Team_D_M16-M20/`) के अंदर मौजूद हर wiring-map.json,
   JSON contract, और .md file पढ़ो — ये बताते हैं कि हर module दूसरे modules
   से कैसे जुड़ता है, कौन-सी API/events expected हैं।
3. `STRUCTURE/Team_C_M11-M15/` folder खोलकर देखो — वहाँ असली backend और
   frontend code मौजूद है (package.json के साथ)। तुम्हें बिल्कुल वैसा ही
   folder-structure और coding pattern (backend/src/modules/...,
   frontend/src/modules/...) follow करना है।

## Architecture (सबके लिए एक जैसा)
- Frontend: React 18 + TypeScript + Zustand + Tailwind CSS
- Backend: Node.js + Express + TypeScript + Prisma ORM
- Database: PostgreSQL 15+
- Auth: JWT RS256 + RBAC + OTP
- Event-driven: Redis Pub/Sub (M16 Notification Engine और M18 External
  Integration दोनों events emit/consume करते हैं — event names wiring-map
  से exact match होने चाहिए)

## नियम (mandatory)
- READ MASTER -> READ MODULE -> SCAN EXISTING -> DO NOT GUESS
- DO NOT DUPLICATE -> RESPECT OWNERSHIP -> RESPECT DATABASE
- RESPECT CONTRACTS -> RESPECT SECURITY -> DOCUMENT WIRING
- BUILD ONCE. REGISTER ONCE. OWN ONCE.
- जो wiring-map पहले से existing है, उसे मत बदलो — उसी contract के हिसाब से
  code लिखो। अगर contract में कोई गलती/कमी दिखे तो पहले पूछो, खुद मत बदलो।

## External integrations ध्यान दें (M18)
M18 में GSTN, WhatsApp, SMS, Payment, E-Invoice, E-Way जैसे 6 external
integrations हैं — इनकी API keys/secrets कभी hardcode मत करो, env variables
से लो (Master Blueprint की security rules देखो)।

## आउटपुट क्या बनाना है
- `backend/` — package.json, src/modules/<module-name>/ के अंदर controllers,
  services, repositories, models
- `frontend/` — package.json, src/modules/<module-name>/ के अंदर screens/components
- दोनों में existing wiring-map.json से match करते हुए API endpoints/events

## आख़िर में
Code लिखने के बाद:
```
git add STRUCTURE/Team_D_M16-M20
git commit -m "Team D: real backend+frontend code for M16-M20"
git push
```
