#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${RKM_DEPLOY_ENV_FILE:-${ROOT_DIR}/.env.deploy.local}"

if [[ ! -f "${ENV_FILE}" && -f "${ROOT_DIR}/.env" ]]; then
  ENV_FILE="${ROOT_DIR}/.env"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy .env.deploy.example and add the project's Fly token." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

if [[ -z "${RKM_FLY_API_TOKEN:-}" ]]; then
  echo "RKM_FLY_API_TOKEN is empty in ${ENV_FILE}." >&2
  exit 1
fi

exec flyctl --access-token "${RKM_FLY_API_TOKEN}" "$@"
