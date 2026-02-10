#!/usr/bin/env bash
set -euo pipefail

# Flutter web rebuild + static serve automation
# Replaces hot-reload approach with build-and-serve for Docker reliability

PORT="${FLUTTER_PORT:-6175}"
HOST="${FLUTTER_HOST:-0.0.0.0}"
GO_URL="${GO_SERVER_URL:-http://localhost:3000}"
API_URL="${API_BASE_URL:-${GO_URL}/api/v1}"
POLL="${POLL_MODE:-false}"
DEBOUNCE="${DEBOUNCE_SECS:-3}"
BUILD_DIR="build/web"

SERVE_PID=""
WATCHER_PID=""

cleanup() {
  echo "[rebuild] Shutting down..."
  [ -n "$WATCHER_PID" ] && kill "$WATCHER_PID" 2>/dev/null || true
  [ -n "$SERVE_PID" ] && kill "$SERVE_PID" 2>/dev/null || true
  exit 0
}
trap cleanup EXIT INT TERM

do_build() {
  if [ -f /tmp/building.lock ]; then
    echo "[rebuild] Build already in progress, skipping"
    return 0
  fi
  touch /tmp/building.lock
  echo "[rebuild] Building flutter web..."
  if flutter build web \
    --release \
    --pwa-strategy=none \
    --dart-define="GO_SERVER_URL=$GO_URL" \
    --dart-define="API_BASE_URL=$API_URL" 2>&1; then
    # Inject auto-reload poller so connected browsers refresh after rebuilds
    sed -i 's|</body>|<script>var _lm;setInterval(()=>fetch("/main.dart.js",{method:"HEAD"}).then(r=>{var m=r.headers.get("last-modified");if(_lm\&\&m!==_lm)location.reload();_lm=m}).catch(()=>{}),3000)</script></body>|' "$BUILD_DIR/index.html"
    echo "[rebuild] Build complete"
  else
    echo "[rebuild] Build failed, keeping previous build"
  fi
  rm -f /tmp/building.lock
}

# Initial build (pre-warm in Dockerfile means this is fast)
do_build

# Activate and start dhttpd (Dart is guaranteed present in Flutter image)
dart pub global activate dhttpd 2>/dev/null
echo "[rebuild] Serving $BUILD_DIR on $HOST:$PORT"
dart pub global run dhttpd --host="$HOST" --port="$PORT" --path="$BUILD_DIR" --headers="X-Frame-Options=ALLOWALL;Access-Control-Allow-Origin=*;Cache-Control=no-store" &
SERVE_PID=$!

# Give server a moment to bind
sleep 2

echo "[rebuild] Watching lib/ for .dart changes (debounce=${DEBOUNCE}s)..."

if [ "$POLL" = "true" ]; then
  echo "[rebuild] Using polling mode"
  LAST_HASH=""
  while true; do
    HASH=$(find lib/ -name '*.dart' -exec stat -c '%Y' {} + 2>/dev/null | md5sum | cut -d' ' -f1)
    if [ -n "$LAST_HASH" ] && [ "$HASH" != "$LAST_HASH" ]; then
      do_build
    fi
    LAST_HASH="$HASH"
    sleep "$DEBOUNCE"
  done &
  WATCHER_PID=$!
else
  if ! command -v inotifywait &>/dev/null; then
    echo "[rebuild] ERROR: inotifywait not found. Install inotify-tools or set POLL_MODE=true"
    exit 1
  fi
  (
    while true; do
      inotifywait -r -q -e modify,create,delete --include '\.dart$' lib/ 2>/dev/null
      sleep "$DEBOUNCE"
      do_build
    done
  ) &
  WATCHER_PID=$!
fi

wait "$SERVE_PID"