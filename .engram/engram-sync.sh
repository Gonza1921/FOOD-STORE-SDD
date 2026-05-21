#!/bin/bash
# engram-sync.sh - Wrapper para engram-sync.js en Linux/Mac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

node "$SCRIPT_DIR/engram-sync.js" "$@"
