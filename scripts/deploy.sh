#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-47.237.216.32}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_SOURCE_DIR="${REMOTE_SOURCE_DIR:-/var/www/x32-source}"
REMOTE_WEB_DIR="${REMOTE_WEB_DIR:-/var/www/x32}"
SKIP_LOCAL_BUILD="${SKIP_LOCAL_BUILD:-0}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
SSH_OPTIONS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)

log() {
  printf "\n[deploy] %s\n" "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf "Missing required command: %s\n" "$1" >&2
    exit 1
  fi
}

require_command ssh
require_command rsync

if [ "$SKIP_LOCAL_BUILD" != "1" ]; then
  require_command npm
  log "Running local build check"
  (cd "$ROOT_DIR" && npm run build)
else
  log "Skipping local build check"
fi

log "Preparing remote directories on ${REMOTE}"
ssh "${SSH_OPTIONS[@]}" "$REMOTE" \
  "mkdir -p '$REMOTE_SOURCE_DIR' '$REMOTE_WEB_DIR'"

log "Syncing source to ${REMOTE}:${REMOTE_SOURCE_DIR}"
rsync -az --delete \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.astro' \
  --exclude '.git' \
  "$ROOT_DIR"/ "$REMOTE:$REMOTE_SOURCE_DIR"/

log "Building and publishing on remote server"
ssh "${SSH_OPTIONS[@]}" "$REMOTE" \
  "REMOTE_SOURCE_DIR='$REMOTE_SOURCE_DIR' REMOTE_WEB_DIR='$REMOTE_WEB_DIR' bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

if ! command -v npm >/dev/null 2>&1; then
  printf "Remote server is missing npm.\n" >&2
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  printf "Remote server is missing nginx.\n" >&2
  exit 1
fi

cd "$REMOTE_SOURCE_DIR"
npm ci
npm run build
rsync -a --delete dist/ "${REMOTE_WEB_DIR}/"
nginx -t
systemctl reload nginx
REMOTE_SCRIPT

log "Deployment complete"
printf "Site: https://x32studio.com\n"
