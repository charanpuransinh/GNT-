#!/bin/bash
# GNT प्रोजेक्ट — Claude auto-restart + permissions setup (owner: Puran Singh, 2026-09-04)
set -e

mkdir -p /root/.claude /root/tools

echo "=== 1) permissions.allow जोड़ रहे हैं (मौजूदा settings से मिलाकर) ==="
python3 - << 'PYEOF'
import json, os
path = "/root/.claude/settings.json"
data = {}
if os.path.exists(path):
    try:
        with open(path) as f:
            data = json.load(f)
    except Exception:
        data = {}
perms = data.get("permissions", {})
allow = set(perms.get("allow", []))
allow.update([
    "Bash(npm test:*)", "Bash(npx vitest:*)", "Bash(npx tsc:*)",
    "Bash(npm run *)", "Bash(git add:*)", "Bash(git commit:*)",
    "Bash(git pull:*)", "Edit", "Write"
])
perms["allow"] = sorted(allow)
data["permissions"] = perms
with open(path, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("settings.json updated:", path)
PYEOF

echo "=== 2) Claude auto-restart watchdog बना रहे हैं ==="
cat > /root/tools/claude_watchdog.sh << 'EOF'
#!/bin/bash
SESSION_ID="8128bad0-11da-4cea-8240-211419f4a768"
LOG="/root/tools/claude_watchdog.log"
if ! tmux has-session -t gnt 2>/dev/null; then
  tmux new-session -d -s gnt -c /root/gnt-project
  tmux send-keys -t gnt:0 "claude --resume $SESSION_ID" Enter
  echo "$(date '+%Y-%m-%d %H:%M:%S') restarted tmux+claude (session was gone)" >> "$LOG"
elif ! tmux list-panes -t gnt:0 -F '#{pane_current_command}' 2>/dev/null | grep -q claude; then
  tmux send-keys -t gnt:0 "claude --resume $SESSION_ID" Enter
  echo "$(date '+%Y-%m-%d %H:%M:%S') restarted claude (pane was dead)" >> "$LOG"
fi
EOF
chmod +x /root/tools/claude_watchdog.sh

echo "=== 3) cron में हर 5 मिनट पर लगा रहे हैं ==="
( crontab -l 2>/dev/null | grep -v claude_watchdog.sh ; echo "*/5 * * * * /root/tools/claude_watchdog.sh" ) | crontab -

echo ""
echo "=== हो गया ==="
echo "--- settings.json ---"
cat /root/.claude/settings.json
echo "--- crontab ---"
crontab -l
