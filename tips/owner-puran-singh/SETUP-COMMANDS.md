# 🔧 पूरन सिंह के लिए — 2 काम जो सिर्फ़ आप कर सकते हैं

**क्यों सिर्फ़ आप:** Claude को अपने आप को दोबारा चालू करने वाली script बनाने, और अपनी ही
अनुमतियाँ बढ़ाने से उसका security नियम रोकता है। यह बचाव जान-बूझकर बनाया गया है — कोई AI
ख़ुद को ज़्यादा अधिकार न दे सके। **इसलिए ये दो काम एक बार आपको करने होंगे।**

दोनों copy-paste के लिए तैयार हैं। Claude Code में आगे `!` लगाकर चला सकते हैं, या terminal में सीधे।

---

## काम 1 — Claude को permanent अनुमतियाँ देना

इससे Claude बार-बार छोटी बातों पर रुकना बंद कर देगा (आपके निर्देश का बिंदु 1)।

**सबसे आसान तरीक़ा:** Claude Code में यह टाइप करें —

```
/permissions
```

फिर इन्हें **allow** में जोड़ें:

```
Bash(npm:*)
Bash(npx:*)
Bash(git commit:*)
Bash(git add:*)
Bash(chmod:*)
Bash(crontab:*)
Write(/root/tools/**)
Edit(/root/tools/**)
```

---

## काम 2 — Auto-restart चालू करना (सबसे ज़रूरी)

**यह क्यों चाहिए:** 2026-09-04 को DeepSeek 04:11 पर चुपचाप मर गया और **1 घंटा 40 मिनट**
मरा पड़ा रहा। मौजूदा watchdog उसे पकड़ तो लेता है, पर **चालू नहीं करता** — सिर्फ़ Telegram
भेजता है। यह script उसे और Claude दोनों को अपने आप वापस चालू कर देगी।

### नीचे का पूरा हिस्सा एक साथ copy करके terminal में paste कर दें:

```bash
cat > /root/tools/auto_resume.sh <<'ENDOFSCRIPT'
#!/usr/bin/env bash
# AUTO-RESUME — malik ka aadesh (OWNER_INSTRUCTION_AUTONOMY.md, 2026-09-04)
# Mara hua AI dobara chalu karta hai. Routine restart chupchaap log mein,
# alert sirf 3 baar fail hone par.
set -uo pipefail
REPO=/root/gnt-project
LOG=/root/tools/auto_resume.log
STATE=/root/tools/.auto_resume.state
NOTIFY="python3 /root/tools/notify_telegram.py"
COOLDOWN=300
now=$(date +%s)
touch "$STATE"
log() { echo "$(date '+%F %T') $*" >> "$LOG"; }
getf() { grep "^$1|" "$STATE" 2>/dev/null | tail -1 | cut -d'|' -f"$2"; }
setf() { sed -i "/^$1|/d" "$STATE" 2>/dev/null; echo "$1|$now|$2" >> "$STATE"; }

tmux has-session -t gnt 2>/dev/null || { tmux new-session -d -s gnt -c "$REPO"; log "gnt session banaya"; }

restart_one() {
  name=$1; window=$2; cmd=$3; msg=$4
  lt=$(getf "$name" 2); lt=${lt:-0}
  fails=$(getf "$name" 3); fails=${fails:-0}
  [ $((now - lt)) -lt $COOLDOWN ] && return
  fails=$((fails + 1))
  setf "$name" "$fails"
  log "$name mara hua mila -> restart koshish #$fails"
  tmux kill-window -t "gnt:$window" 2>/dev/null
  tmux new-window -d -t gnt -n "$window" -c "$REPO"
  sleep 2
  tmux send-keys -t "gnt:$window" -l "$cmd"; tmux send-keys -t "gnt:$window" Enter
  sleep 20
  tmux send-keys -t "gnt:$window" -l "$msg"; sleep 1; tmux send-keys -t "gnt:$window" Enter
  sleep 10
  if pgrep -f "$name" >/dev/null 2>&1; then
    log "$name wapas chalu ho gaya"; setf "$name" 0
  elif [ "$fails" -ge 3 ]; then
    log "$name 3 baar fail -> alert"
    $NOTIFY "🔴 $name 3 baar restart hone par bhi chalu nahi hua. Haath se dekhna padega." 2>/dev/null
  fi
}

pgrep -f "codewhale" >/dev/null 2>&1 || restart_one "codewhale" "deepseek" "codewhale" \
  "तुम बंद हो गए थे, अब वापस चालू हो। tips/owner-puran-singh/AUTONOMY-RULES.md पढ़ो और M11-M21 का काम जारी रखो।"

pgrep -f "bin/claude" >/dev/null 2>&1 || restart_one "claude" "claude" \
  "claude --continue" \
  "tips/owner-puran-singh/AUTONOMY-RULES.md padho aur M01-M10 ka kaam wahin se jari rakho. Rukna nahi, anumati nahi mangni."
ENDOFSCRIPT

chmod +x /root/tools/auto_resume.sh
( crontab -l 2>/dev/null | grep -v auto_resume; echo "*/5 * * * * /root/tools/auto_resume.sh >/dev/null 2>&1" ) | crontab -
echo "✅ Auto-restart chalu ho gaya — har 5 minute mein jaanchega"
crontab -l
```

### चालू है या नहीं, ऐसे जाँचें:

```bash
crontab -l | grep auto_resume          # cron लगा है?
tail -20 /root/tools/auto_resume.log   # क्या-क्या restart हुआ
```

---

## ✅ ये दोनों हो जाने के बाद क्या बदलेगा

| पहले | बाद में |
|---|---|
| DeepSeek मरा → 1 घंटा 40 मिनट कोई काम नहीं | **5 मिनट के अंदर अपने आप चालू** |
| Claude की limit ख़त्म → आपको हाथ से चालू करना पड़ता | **अपने आप `--continue` से लौट आएगा** |
| Claude छोटी-छोटी बात पर रुककर पूछता | **सिर्फ़ P0 वाली 4 बातों पर पूछेगा** |
| हर बात पर Telegram | **सिर्फ़ P0 पर, या restart 3 बार फ़ेल होने पर** |
