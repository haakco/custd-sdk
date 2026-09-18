#!/usr/bin/env bash

set -euo pipefail

readonly image="infisical/cli@sha256:898cac2662546fda63ce3793164c3535db22652663497d0429ad55455b60d175"
readonly config_volume="custd-sdk-infisical"
readonly keyring_volume="custd-sdk-infisical-keyring"
readonly api_url="https://secrets.k8.haak.co/api"

command -v docker >/dev/null 2>&1 || {
  echo "Error: Docker is required for the isolated Infisical profile." >&2
  exit 1
}

ensure_image() {
  if docker image inspect "${image}" >/dev/null 2>&1; then
    return
  fi

  local pull_config
  pull_config="$(mktemp -d)"
  printf '{"auths":{}}\n' >"${pull_config}/config.json"
  if ! docker --config "${pull_config}" pull "${image}"; then
    rm -rf -- "${pull_config}"
    echo "Error: failed to pull the pinned public Infisical CLI image." >&2
    return 1
  fi
  rm -rf -- "${pull_config}"
}

ensure_image

docker_args=(
  run
  --rm
  --env "INFISICAL_API_URL=${api_url}"
  --env "INFISICAL_DISABLE_UPDATE_CHECK=true"
  --mount "type=volume,source=${config_volume},target=/root/.infisical"
  --mount "type=volume,source=${keyring_volume},target=/root/infisical-keyring"
)

if [[ -n "${INFISICAL_TOKEN:-}" ]]; then
  docker_args+=(--env "INFISICAL_TOKEN=${INFISICAL_TOKEN}")
fi

if ! vault_error="$(docker "${docker_args[@]}" "${image}" vault set file --silent 2>&1 >/dev/null)"; then
  echo "Custd SDK Infisical profile: failed to configure the encrypted file vault" >&2
  printf '%s\n' "${vault_error}" >&2
  exit 1
fi

if [[ "${1:-}" == "status" && $# -eq 1 ]]; then
  if docker "${docker_args[@]}" "${image}" login status --silent >/dev/null 2>&1; then
    echo "Custd SDK Infisical profile: authenticated"
    exit 0
  fi
  echo "Custd SDK Infisical profile: not authenticated; run: just infisical-login" >&2
  exit 1
fi

docker_args+=(--interactive)
if [[ -t 0 && -t 1 ]]; then
  docker_args+=(--tty)
fi

if [[ "${1:-}" == "login" ]]; then
  docker_args+=(--network host)
fi

exec docker "${docker_args[@]}" "${image}" "$@"
