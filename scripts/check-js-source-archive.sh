#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

missing=0
while IFS= read -r exported_path; do
  tracked_path="sdk-js/dist/${exported_path#./}"
  if ! git ls-files --error-unmatch "$tracked_path" >/dev/null 2>&1; then
    printf 'untracked JS distribution export: %s\n' "$tracked_path" >&2
    missing=1
  fi
done < <(sed -nE 's/^export .* from "([^"]+)";.*/\1/p' sdk-js/dist/index.js)

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi
echo "JS source archive exports are tracked"
