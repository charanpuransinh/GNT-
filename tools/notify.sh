#!/usr/bin/env bash
# GNT — Telegram par report/alert bhejne ka standard tareeka.
#
# Secret (bot token / chat id) is repo mein KABHI nahi rakha jata — wo
# /opt/raw-repo/.env mein hai (gitignored, 0600), wahi Trishul Pro wali setting.
# Yeh script sirf ek patla wrapper hai, isliye ise GitHub par push karna safe hai.
#
# Istemal:
#   tools/notify.sh "M05 poora ho gaya — tsc 0, mount ho gaya"
#   echo "lambi report..." | tools/notify.sh -
#   tools/notify.sh --tag "DeepSeek" "टास्क #008 पूरा"
#
# Kab bhejna hai (niyam — dono AI par lagoo):
#   ✅ har task complete hone par
#   🔴 koi dikkat/error/atkav par (turant)
#   🌙 raat ka kaam shuru aur khatam hone par

set -uo pipefail

NOTIFIER=/root/tools/notify_telegram.py
TAG="GNT"

if [ ! -f "$NOTIFIER" ]; then
  echo "❌ notifier nahi mila: $NOTIFIER" >&2
  exit 1
fi

if [ "${1:-}" = "--tag" ]; then
  TAG="$2"; shift 2
fi

if [ "${1:-}" = "-" ] || [ $# -eq 0 ]; then
  body=$(cat)
else
  body="$*"
fi

if [ -z "${body// }" ]; then
  echo "❌ khaali message — kuch bhejne ko nahi" >&2
  exit 1
fi

printf '[%s] %s\n\n%s' "$TAG" "$(date '+%d %b %H:%M')" "$body" | python3 "$NOTIFIER" -
