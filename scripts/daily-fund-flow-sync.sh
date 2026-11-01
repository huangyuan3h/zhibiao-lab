#!/usr/bin/env bash
# Daily: Karios DB → static JSON → build → Pages deploy (资金流全景三图)
set -euo pipefail
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
# Cloudflare Pages needs proxy on this Mac
export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:7890}"
export HTTP_PROXY="${HTTP_PROXY:-http://127.0.0.1:7890}"
export ALL_PROXY="${ALL_PROXY:-http://127.0.0.1:7890}"
export https_proxy="$HTTPS_PROXY" http_proxy="$HTTP_PROXY" all_proxy="$ALL_PROXY"
cd "$HOME/Projects/zhibiao-lab"
DSS_PY="$HOME/Projects/karios-desktop/services/data-sync-service/.venv/bin/python"
echo "[daily-fund-flow] $(date '+%Y-%m-%d %H:%M:%S %Z') start"
if [[ -x "$DSS_PY" ]]; then
  "$DSS_PY" scripts/sync-national-team.py
else
  python3 scripts/sync-national-team.py
fi
npm run build
npx wrangler pages deploy ./out --project-name zhibiao-lab --branch main --commit-dirty=true
echo "[daily-fund-flow] done"
