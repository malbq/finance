#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
UNIT_FILE="$SCRIPT_DIR/finance.service"
ABS_UNIT_FILE="$(readlink -f "$UNIT_FILE")"
sudo systemctl daemon-reload
sudo systemctl enable --now "$ABS_UNIT_FILE"

# Useful commands:

# systemctl status finance | cat
# journalctl -u finance -n 200 -f | cat
# sudo systemctl restart finance
# sudo systemctl disable --now finance