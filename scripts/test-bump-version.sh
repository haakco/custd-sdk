#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

mkdir -p "$tmpdir/sdk-go" "$tmpdir/sdk-js/src" "$tmpdir/sdk-react" "$tmpdir/sdk-python/src/custd" \
  "$tmpdir/sdk-php/src" "$tmpdir/wordpress-plugin"
cp "$repo_root/VERSION" "$tmpdir/VERSION"
cp "$repo_root/sdk-go/VERSION" "$tmpdir/sdk-go/VERSION"
cp "$repo_root/sdk-go/version.go" "$tmpdir/sdk-go/version.go"
cp "$repo_root/sdk-js/package.json" "$tmpdir/sdk-js/package.json"
cp "$repo_root/sdk-js/src/version.ts" "$tmpdir/sdk-js/src/version.ts"
cp "$repo_root/sdk-react/package.json" "$tmpdir/sdk-react/package.json"
cp "$repo_root/sdk-python/pyproject.toml" "$tmpdir/sdk-python/pyproject.toml"
cp "$repo_root/sdk-python/src/custd/version.py" "$tmpdir/sdk-python/src/custd/version.py"
cp "$repo_root/sdk-php/composer.json" "$tmpdir/sdk-php/composer.json"
cp "$repo_root/sdk-php/src/CustdClient.php" "$tmpdir/sdk-php/src/CustdClient.php"
cp "$repo_root/wordpress-plugin/custd.php" "$tmpdir/wordpress-plugin/custd.php"

REPO_ROOT="$tmpdir" "$repo_root/scripts/bump-version.sh" 9.8.7

grep -qx '9.8.7' "$tmpdir/VERSION"
grep -qx '9.8.7' "$tmpdir/sdk-go/VERSION"
grep -q '"version": "9.8.7"' "$tmpdir/sdk-js/package.json"
grep -q '"version": "9.8.7"' "$tmpdir/sdk-react/package.json"
grep -q 'version = "9.8.7"' "$tmpdir/sdk-python/pyproject.toml"
grep -q '"version": "9.8.7"' "$tmpdir/sdk-php/composer.json"
grep -q 'Version: 9.8.7' "$tmpdir/wordpress-plugin/custd.php"
# The X-Custd-Sdk identity constants must move with the version, or a release
# ships a client that reports the wrong release to Custd.
grep -q 'const Version = "9.8.7"' "$tmpdir/sdk-go/version.go"
grep -q 'public const VERSION = "9.8.7";' "$tmpdir/sdk-php/src/CustdClient.php"
grep -q 'export const SDK_VERSION = "9.8.7";' "$tmpdir/sdk-js/src/version.ts"
grep -qx 'VERSION = "9.8.7"' "$tmpdir/sdk-python/src/custd/version.py"
