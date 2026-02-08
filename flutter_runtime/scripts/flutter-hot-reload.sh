#!/usr/bin/env bash
set -euo pipefail

# Flutter hot reload automation via named pipe + inotifywait
# Usage: cd flutter_runtime && bash scripts/flutter-hot-reload.sh
#
# Environment variables:
#   FLUTTER_PORT     - Web server port (default: 6175)
#   FLUTTER_HOST     - Web server hostname (default: 0.0.0.0)
#   GO_SERVER_URL    - Go server URL for --dart-define (default: http://localhost:3000)
#   API_BASE_URL     - API base URL for --dart-define (default: http://localhost:3000/api/v1)
#   POLL_MODE        - Use polling instead of inotifywait (default: false)
#   DEBOUNCE_SECS    - Debounce interval in seconds (default: 2)

PORT="${FLUTTER_PORT:-6175}"
HOST="${FLUTTER_HOST:-0.0.0.0}"
GO_URL="${GO_SERVER_URL:-http://localhost:3000}"
API_URL="${API_BASE_URL:-${GO_URL}/api/v1}"
POLL="${POLL_MODE:-false}"
DEBOUNCE="${DEBOUNCE_SECS:-2}"

PIPE="/tmp/flutter_stdin_pipe_$$"
FLUTTER_PID=""
WATCHER_PID=""

cleanup() {
  echo "[hot-reload] Shutting down..."
  [ -n "$WATCHER_PID" ] && kill "$WATCHER_PID" 2>/dev/null || true
  [ -n "$FLUTTER_PID" ] && kill "$FLUTTER_PID" 2>/dev/null || true
  [ -p "$PIPE" ] && rm -f "$PIPE"
  exit 0
}
trap cleanup EXIT INT TERM

# Create named pipe for flutter stdin
mkfifo "$PIPE"

echo "[hot-reload] Starting flutter web on $HOST:$PORT"
echo "[hot-reload] GO_SERVER_URL=$GO_URL"
echo "[hot-reload] API_BASE_URL=$API_URL"

# Start flutter with stdin from the named pipe
# Keep the pipe open for writing by opening a persistent fd
flutter run -d web-server \
  --web-port="$PORT" \
  --web-hostname="$HOST" \
  --dart-define="GO_SERVER_URL=$GO_URL" \
  --dart-define="API_BASE_URL=$API_URL" \
  < "$PIPE" &
FLUTTER_PID=$!

# Keep the write end of the pipe open (prevents EOF when writing 'r')
exec 3>"$PIPE"

# Wait a moment for flutter to initialize
sleep 5

echo "[hot-reload] Watching lib/ for .dart changes (debounce=${DEBOUNCE}s)..."

if [ "$POLL" = "true" ]; then
  # Polling fallback for environments without inotifywait (e.g., macOS Docker Desktop)
  echo "[hot-reload] Using polling mode"
  LAST_HASH=""
  while true; do
    HASH=$(find lib/ -name '*.dart' -exec stat -c '%Y' {} + 2>/dev/null | md5sum | cut -d' ' -f1)
    if [ -n "$LAST_HASH" ] && [ "$HASH" != "$LAST_HASH" ]; then
      echo "[hot-reload] Change detected, triggering hot restart..."
      echo "R" >&3
    fi
    LAST_HASH="$HASH"
    sleep "$DEBOUNCE"
  done &
  WATCHER_PID=$!
else
  # inotifywait mode (Linux / Docker)
  if ! command -v inotifywait &>/dev/null; then
    echo "[hot-reload] ERROR: inotifywait not found. Install inotify-tools or set POLL_MODE=true"
    exit 1
  fi
  (
    LAST_TRIGGER=0
    while true; do
      inotifywait -r -e modify,create,delete --include '\.dart$' lib/ 2>/dev/null
      NOW=$(date +%s)
      ELAPSED=$((NOW - LAST_TRIGGER))
      if [ "$ELAPSED" -ge "$DEBOUNCE" ]; then
        echo "[hot-reload] Change detected, triggering hot restart..."
        echo "R" >&3
        LAST_TRIGGER=$NOW
      fi
    done
  ) &
  WATCHER_PID=$!
fi

# Wait for flutter process
wait "$FLUTTER_PID"
