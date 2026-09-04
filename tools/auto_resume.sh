#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  AUTO-RESUME — मालिक का आदेश (OWNER_INSTRUCTION_AUTONOMY.md बिंदु 3)
#
#  क्यों: 2026-09-04 को DeepSeek 04:11 पर चुपचाप मर गया और 05:52 तक —
#  पूरे 1 घंटा 40 मिनट — मरा पड़ा रहा। पुराना watchdog उसे पकड़ लेता है पर
#  सिर्फ़ Telegram भेजता है, चालू नहीं करता (उसमें restart का एक भी हिस्सा
#  नहीं — जाँच लिया)।
#
#  यह script मरा हुआ AI ख़ुद वापस चालू करती है।
#
#  Telegram नीति (बिंदु 4): routine restart चुपचाप log में। अलर्ट सिर्फ़ तब
#  जब लगातार 3 बार restart नाकाम हो।
#
#  cron में लगाना:
#    */5 * * * * /root/gnt-project/tools/auto_resume.sh >/dev/null 2>&1
# ─────────────────────────────────────────────────────────────
set -uo pipefail

REPO=/root/gnt-project
LOG=$REPO/tools/auto_resume.log
STATE=$REPO/tools/.auto_resume.state
NOTIFY=/root/tools/notify_telegram.py
COOLDOWN=300                      # एक ही चीज़ को 5 मिनट में एक से ज़्यादा बार मत छेड़ो
now=$(date +%s)

touch "$STATE"
log()  { echo "$(date '+%F %T') $*" >> "$LOG"; }
getf() { grep "^$1|" "$STATE" 2>/dev/null | tail -1 | cut -d'|' -f"$2"; }
setf() { sed -i "/^$1|/d" "$STATE" 2>/dev/null; echo "$1|$now|$2" >> "$STATE"; }
alert() { [ -f "$NOTIFY" ] && python3 "$NOTIFY" "$1" >/dev/null 2>&1; }

tmux has-session -t gnt 2>/dev/null || {
  tmux new-session -d -s gnt -c "$REPO"
  log "gnt session मौजूद नहीं था — बना दिया"
}

# $1 = pgrep pattern · $2 = tmux window · $3 = चलाने की command · $4 = resume संदेश
revive() {
  local key=$1 window=$2 cmd=$3 msg=$4
  local lt fails
  lt=$(getf "$key" 2);    lt=${lt:-0}
  fails=$(getf "$key" 3); fails=${fails:-0}

  [ $((now - lt)) -lt $COOLDOWN ] && return 0

  fails=$((fails + 1))
  setf "$key" "$fails"
  log "$key मरा हुआ मिला → चालू करने की कोशिश #$fails"

  tmux kill-window -t "gnt:$window" 2>/dev/null
  tmux new-window -d -t gnt -n "$window" -c "$REPO"
  sleep 2
  tmux send-keys -t "gnt:$window" -l "$cmd"
  tmux send-keys -t "gnt:$window" Enter
  sleep 20

  # संदेश छोटा ही रखना — लंबा संदेश composer में draft बनकर अटक जाता है
  tmux send-keys -t "gnt:$window" -l "$msg"
  sleep 1
  tmux send-keys -t "gnt:$window" Enter
  sleep 10

  if pgrep -f "$key" >/dev/null 2>&1; then
    log "$key वापस चालू हो गया (कोशिश #$fails)"
    setf "$key" 0                                   # गिनती शून्य
  elif [ "$fails" -ge 3 ]; then
    log "$key — 3 बार चालू नहीं हुआ, अलर्ट भेजा"
    alert "🔴 $key तीन बार कोशिश के बाद भी चालू नहीं हुआ। हाथ से देखना पड़ेगा।"
  else
    log "$key इस बार चालू नहीं हुआ (कोशिश #$fails) — अगली बार फिर देखूँगा"
  fi
}

# ═══ DeepSeek (कोडर AI) — M11 से M21 ═══
pgrep -f "codewhale" >/dev/null 2>&1 || revive "codewhale" "deepseek" "codewhale" \
  "तुम बंद हो गए थे, अब वापस चालू हो। tips/owner-puran-singh/AUTONOMY-RULES.md पढ़ो और M11-M21 का काम वहीं से जारी रखो। रुकना नहीं।"

# ═══ Claude (समीक्षक AI) — M01 से M10 ═══
pgrep -f "bin/claude" >/dev/null 2>&1 || revive "claude" "claude" "claude --continue" \
  "tips/owner-puran-singh/AUTONOMY-RULES.md padho aur M01-M10 ka kaam wahin se jari rakho. Rukna nahi, anumati nahi mangni — sirf 4 P0 par."
