#!/bin/bash
# engram-sync.sh - Wrapper para engram-sync.cjs en Linux/Mac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

node "$SCRIPT_DIR/engram-sync.cjs" "$@"
