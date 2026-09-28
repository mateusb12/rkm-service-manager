#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLY=("${ROOT_DIR}/scripts/fly-project.sh")

"${FLY[@]}" auth whoami
"${FLY[@]}" status --app rkm-service-manager >/dev/null

exec "${FLY[@]}" deploy \
  --build-arg "VITE_COMMIT_SHA=$(git -C "${ROOT_DIR}" rev-parse --short HEAD)" \
  --config "${ROOT_DIR}/backend/fly.toml"
