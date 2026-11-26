#!/usr/bin/env bash
set -euo pipefail

# Prints a commit whose tree is the installable JavaScript package in
# PACKAGE_DIRECTORY at HEAD: its checked-in dist/, README.md and a package.json
# without the monorepo-only scripts and devDependencies (which hold a pnpm
# workspace: reference no consumer can resolve). Consumers install the mirror
# with github:haakco/<mirror>#v<VERSION>, which Dependabot can bump.
#
# The commit is built with plumbing from tracked files, so the working tree is
# untouched, and its dates come from HEAD, so the same source yields the same
# commit on every run.

if [[ "$#" -ne 1 ]]; then
  printf 'usage: bash scripts/build-js-mirror-commit.sh PACKAGE_DIRECTORY\n' >&2
  exit 2
fi

package="${1%/}"
repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

if ! git cat-file -e "HEAD:$package/package.json" 2>/dev/null; then
  printf 'not a tracked JavaScript package: %s\n' "$package" >&2
  exit 1
fi
if [[ -z "$(git ls-tree -r --name-only HEAD -- "$package/dist")" ]]; then
  printf 'package has no checked-in dist: %s\n' "$package" >&2
  exit 1
fi

tmp_index="$(mktemp)"
trap 'rm -f "$tmp_index"' EXIT
rm -f "$tmp_index"

add_blob() {
  GIT_INDEX_FILE="$tmp_index" git update-index --add --cacheinfo "100644,$1,$2"
}

while IFS= read -r path; do
  add_blob "$(git rev-parse "HEAD:$path")" "${path#"$package"/}"
done < <(git ls-tree -r --name-only HEAD -- "$package/dist" "$package/README.md")

manifest_blob="$(git show "HEAD:$package/package.json" | node -e '
  let source = "";
  process.stdin.on("data", (chunk) => { source += chunk; });
  process.stdin.on("end", () => {
    const manifest = JSON.parse(source);
    delete manifest.scripts;
    delete manifest.devDependencies;
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  });
' | git hash-object -w --stdin)"
add_blob "$manifest_blob" package.json

tree="$(GIT_INDEX_FILE="$tmp_index" git write-tree)"
date="$(git show -s --format=%cI HEAD)"
GIT_AUTHOR_NAME=custd-sdk-ci GIT_AUTHOR_EMAIL=ci@haak.co \
  GIT_COMMITTER_NAME=custd-sdk-ci GIT_COMMITTER_EMAIL=ci@haak.co \
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" \
  git commit-tree "$tree" -m "chore: publish ${package} package"
