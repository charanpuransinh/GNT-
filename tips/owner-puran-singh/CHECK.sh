#!/bin/bash
# ────────────────────────────────────────────────────────────────
#  पूरन सिंह का अपना जाँच-औज़ार
#  किसी AI पर भरोसा किए बिना, ख़ुद सच देखने के लिए।
#  चलाएँ:  bash tips/owner-puran-singh/CHECK.sh
# ────────────────────────────────────────────────────────────────
cd "$(dirname "$0")/../.." || exit 1
R="GNT_GITHUB_REPOSITORY"

echo "═══════════════════════════════════════════════════"
echo "  GNT — सच्ची हालत ($(date '+%Y-%m-%d %H:%M'))"
echo "═══════════════════════════════════════════════════"

echo
echo "1️⃣  DATABASE चालू है?"
pg_isready >/dev/null 2>&1 && echo "   ✅ हाँ — चालू है" || echo "   ❌ नहीं — बंद है (तो कोई भी CERTIFIED दावा झूठा है)"

echo
echo "2️⃣  कोड compile होता है? (0 आना चाहिए)"
# ⚠️ 2026-09-04: पहले यहाँ `tsc -p tsconfig.json` था — वो root config है जिसमें
# "files": [] लिखा है, यानी वो एक भी फ़ाइल नहीं जाँचता और हमेशा 0 errors देता है।
# पूरा प्रोजेक्ट महीनों उसी झूठे 0 को सबूत मानता रहा। अब असली दोनों config चलते हैं।
EB=$(cd $R && NODE_OPTIONS="--max-old-space-size=3072" npx tsc -p tsconfig.backend.json --noEmit 2>&1 | grep -cE "error TS[0-9]+")
EF=$(cd $R && NODE_OPTIONS="--max-old-space-size=3072" npx tsc -p tsconfig.frontend.json --noEmit 2>&1 | grep -cE "error TS[0-9]+")
E=$((EB + EF))
echo "   (backend: $EB · frontend: $EF)"
[ "$E" = "0" ] && echo "   ✅ 0 errors" || echo "   ❌ $E errors — कुछ भी CERTIFIED नहीं हो सकता"

echo
echo "3️⃣  TESTS — असली database पर (skip 0 होना चाहिए)"
cd $R/backend 2>/dev/null && TEST_DB=1 npx vitest run --reporter=dot 2>&1 | grep -E "^ *(Test Files|Tests) " | sed 's/^/   /'
cd - >/dev/null

echo
echo "   ⚠️  अगर ऊपर 'skipped' दिखे, तो 'सब tests पास' वाली कोई भी रिपोर्ट झूठी है।"

echo
echo "4️⃣  अधूरे काम के निशान (जो CERTIFIED कहा गया उसमें ये नहीं होने चाहिए)"
echo "   TODO/FIXME:      $(grep -rn "TODO\|FIXME" $R/backend/src --include=*.ts 2>/dev/null | wc -l)"
echo "   'return false' (जाँच छोड़ी हुई):  $(grep -rn "return false;" $R/backend/src --include=*.ts 2>/dev/null | grep -i "todo\|not implement\|nahi\|अभी" | wc -l)"
echo "   बिना चली migrations (<app_user> बाक़ी): $(grep -rln "<app_user>" $R/database/migrations/ 2>/dev/null | wc -l)"
echo "   as any / @ts-ignore (गड़बड़ी दबाने वाले): $(grep -rn "as any\|@ts-ignore" $R/backend/src --include=*.ts 2>/dev/null | wc -l)"

echo
echo "5️⃣  Claude ने अब तक कितने module CERTIFIED किए?"
C=$(grep -c "^## CERT-" tips/reviewer-ai/CERTIFICATES.md 2>/dev/null)
echo "   रजिस्टर में entries: $C"
echo "   ⚠️  entry होना = तैयार होना नहीं। हर entry में 'live DB पर चलाया' का सबूत होना चाहिए।"

echo
echo "6️⃣  पिछले 10 काम (git — इसे चुपचाप बदला नहीं जा सकता)"
git log --oneline -10 | sed 's/^/   /'

echo
echo "═══════════════════════════════════════════════════"
echo " याद रखें: जो बात इस जाँच में न दिखे, वो सच नहीं मानी जाए।"
echo "═══════════════════════════════════════════════════"
