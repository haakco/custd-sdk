#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 1 ]]; then
  printf 'usage: bash scripts/pack-js-release.sh OUTPUT_DIRECTORY\n' >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
version="$(tr -d '[:space:]' < "$repo_root/VERSION")"
mkdir -p "$1"
destination="$(cd "$1" && pwd -P)/custd-sdk-$version.tgz"
pack_dir="$(mktemp -d)"
trap 'rm -rf "$pack_dir"' EXIT

bash "$repo_root/scripts/check-sdk-version-identity.sh" >&2
bash "$repo_root/scripts/check-js-source-archive.sh" >&2
(
  cd "$repo_root/sdk-js"
  npm pack --loglevel=error --ignore-scripts --pack-destination "$pack_dir" >/dev/null
)
mv "$pack_dir/haakco-custd-sdk-$version.tgz" "$destination"
printf '%s\n' "$destination"
