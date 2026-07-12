#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
publisher="$repo_root/scripts/publish-release-mirror.sh"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

git init --bare --quiet "$tmp_dir/mirror.git"
git init --quiet "$tmp_dir/source"
git -C "$tmp_dir/source" config user.name test
git -C "$tmp_dir/source" config user.email test@example.invalid

commit_content() {
  local content="$1"
  printf '%s\n' "$content" > "$tmp_dir/source/release.txt"
  git -C "$tmp_dir/source" add release.txt
  git -C "$tmp_dir/source" commit --quiet -m "$content"
  git -C "$tmp_dir/source" rev-parse HEAD
}

remote_ref() {
  git --git-dir="$tmp_dir/mirror.git" rev-parse "$1"
}

old_sha="$(commit_content old)"
(cd "$tmp_dir/source" && "$publisher" "$tmp_dir/mirror.git" "$old_sha" v1.0.0 test-package)
old_main="$(remote_ref refs/heads/main)"
test "$(remote_ref refs/tags/v1.0.0)" = "$old_main"

(cd "$tmp_dir/source" && "$publisher" "$tmp_dir/mirror.git" "$old_sha" v1.0.0 test-package)
test "$(remote_ref refs/heads/main)" = "$old_main"

new_sha="$(commit_content new)"
(cd "$tmp_dir/source" && "$publisher" "$tmp_dir/mirror.git" "$new_sha" v1.1.0 test-package)
new_main="$(remote_ref refs/heads/main)"
test "$new_main" != "$old_main"
git --git-dir="$tmp_dir/mirror.git" merge-base --is-ancestor "$old_main" "$new_main"
test "$(remote_ref refs/tags/v1.1.0)" = "$new_main"

(cd "$tmp_dir/source" && "$publisher" "$tmp_dir/mirror.git" "$old_sha" v1.0.0 test-package)
test "$(remote_ref refs/heads/main)" = "$new_main"
test "$(remote_ref refs/tags/v1.0.0)" = "$old_main"

if (cd "$tmp_dir/source" && "$publisher" "$tmp_dir/mirror.git" "$new_sha" v1.0.0 test-package); then
  echo "publisher accepted an existing tag with a different tree" >&2
  exit 1
fi
test "$(remote_ref refs/heads/main)" = "$new_main"

echo "release mirror publication tests passed"
