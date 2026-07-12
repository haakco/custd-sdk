#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 4 ]; then
  echo "usage: scripts/publish-release-mirror.sh <mirror-url> <split-sha> <tag> <prefix>" >&2
  exit 2
fi

mirror_url="$1"
split_sha="$2"
tag="$3"
prefix="$4"

remote_git() {
  if [ -n "${GIT_AUTH_HEADER:-}" ]; then
    git -c "http.https://github.com/.extraheader=$GIT_AUTH_HEADER" "$@"
  else
    git "$@"
  fi
}

split_tree="$(git rev-parse "${split_sha}^{tree}")"
tag_refs="$(remote_git ls-remote "$mirror_url" "refs/tags/${tag}" "refs/tags/${tag}^{}")"
if [ -n "$tag_refs" ]; then
  tag_sha="$(printf '%s\n' "$tag_refs" | awk '$2 ~ /\^\{\}$/ { print $1; found=1 } END { if (!found) print first } NR == 1 { first=$1 }')"
  remote_git fetch --no-tags "$mirror_url" "$tag_sha"
  tag_tree="$(git rev-parse "${tag_sha}^{tree}")"
  if [ "$tag_tree" != "$split_tree" ]; then
    echo "release tag ${tag} already exists with different content" >&2
    exit 1
  fi
  echo "release tag ${tag} already publishes the requested content"
  exit 0
fi

remote_main="$(remote_git ls-remote "$mirror_url" refs/heads/main | cut -f1)"
publish_sha="$split_sha"
if [ -n "$remote_main" ]; then
  remote_git fetch --no-tags "$mirror_url" "$remote_main"
  remote_tree="$(git rev-parse "${remote_main}^{tree}")"
  if [ "$split_tree" = "$remote_tree" ]; then
    publish_sha="$remote_main"
  else
    src_date="$(git show -s --format=%cI "$split_sha")"
    publish_sha="$(GIT_AUTHOR_NAME=custd-sdk-ci GIT_AUTHOR_EMAIL=ci@haak.co \
      GIT_COMMITTER_NAME=custd-sdk-ci GIT_COMMITTER_EMAIL=ci@haak.co \
      GIT_AUTHOR_DATE="$src_date" GIT_COMMITTER_DATE="$src_date" \
      git commit-tree "$split_tree" -p "$remote_main" \
      -m "chore: publish ${prefix} subtree")"
  fi
fi

remote_git push --atomic "$mirror_url" \
  "${publish_sha}:refs/heads/main" \
  "${publish_sha}:refs/tags/${tag}"
