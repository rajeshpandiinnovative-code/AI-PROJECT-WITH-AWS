#!/usr/bin/env bash
# Daily loop: attach to tmux session running Next dev server (WSL canonical tree).
# Usage: bash scripts/wsl-dev.sh [repo_dir] [session_name]
set -euo pipefail

REPO="${1:-$HOME/code/ai-academy-pro}"
SESSION="${2:-ai-academy}"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi

if ! command -v tmux >/dev/null 2>&1; then
  echo "Install tmux first: sudo apt update && sudo apt install -y tmux" >&2
  exit 1
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
  exec tmux attach -t "$SESSION"
fi

tmux new-session -s "$SESSION" -c "$REPO" bash -lc \
  'export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; exec npm run dev'
