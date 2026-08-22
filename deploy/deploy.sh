#!/usr/bin/env bash
# SmartCare — remote deploy script (run on the EC2 instance from the repo root).
#
# Assumes the one-time setup in deploy/ec2-setup.md has been completed:
#   - /srv/smartcare is a git checkout of this repository (pulled via deploy key)
#   - server/.env exists with production values
#   - smartcare-api systemd unit is installed and enabled
#
# Safe to re-run: idempotent, fails loudly before touching the service if the
# build step breaks.
set -euo pipefail

APP_DIR="${DEPLOY_DIR:-/srv/smartcare}"

echo "→ Pulling latest code (${APP_DIR})"
git -C "$APP_DIR" pull --ff-only

echo "→ Installing API dependencies"
npm ci --prefix "$APP_DIR/server"

echo "→ Building PWA"
npm run build --prefix "$APP_DIR/client"

echo "→ Restarting smartcare-api"
sudo systemctl restart smartcare-api
sleep 3

if ! sudo systemctl is-active --quiet smartcare-api; then
  echo "✗ smartcare-api failed to start — recent logs:" >&2
  sudo journalctl -u smartcare-api -n 40 --no-pager >&2
  exit 1
fi

echo "→ Smoke-testing /api/health"
curl -fsS http://localhost:5000/api/health && echo

echo "✓ Deployed"
