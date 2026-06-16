#!/usr/bin/env bash
# Infisical secrets loader with file-based caching.
# Caches secrets locally so shell startup is always instant.
# Background refresh keeps secrets fresh without blocking.
# Lock file prevents process stampede from parallel mise invocations.
#
# Ported from the custd repo (same shared Infisical project, workspace
# 952c94fb-...). Defaults to the /custd-sdk path so SDK secrets stay
# namespaced within the shared project. Override via INFISICAL_ENV /
# INFISICAL_PATH / INFISICAL_API_URL.

# Recursion guard: if mise is configured to source this script via
# `_.source`, every sub-shell that runs `infisical export` re-activates
# mise and re-sources us — recursive fork bomb. The exported guard env
# var stops the recursion at the first level.
if [ -n "${_HAAKCO_LOADING_INFISICAL:-}" ]; then
  # Return if sourced, exit if executed. shellcheck cannot tell which, so the
  # exit looks unreachable.
  # shellcheck disable=SC2317
  return 0 2>/dev/null || exit 0
fi
export _HAAKCO_LOADING_INFISICAL=1
trap 'unset _HAAKCO_LOADING_INFISICAL' EXIT

_resolve_infisical_bin() {
  local candidate
  local data_dir

  if [ -n "${INFISICAL_BIN:-}" ] && [ -x "$INFISICAL_BIN" ]; then
    printf '%s\n' "$INFISICAL_BIN"
    return 0
  fi

  candidate="$(command -v infisical 2>/dev/null || true)"
  case "$candidate" in
    # `*` spans slashes, so this also covers .local/share/mise/shims/infisical.
    */mise/shims/infisical)
      data_dir="${MISE_DATA_DIR:-$HOME/.local/share/mise}"
      candidate="$(find "$data_dir/installs/infisical" -type f -name infisical -perm -111 2>/dev/null | sort -V | tail -1)"
      ;;
  esac

  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    printf '%s\n' "$candidate"
    return 0
  fi

  return 1
}

INFISICAL_BIN="$(_resolve_infisical_bin)" || exit 0
INFISICAL_API_URL="${INFISICAL_API_URL:-https://secrets.k8.haak.co/api}"
INFISICAL_ENV="${INFISICAL_ENV:-dev}"
INFISICAL_PATH="${INFISICAL_PATH:-/custd-sdk}"

if [ ! -x "$INFISICAL_BIN" ]; then
  exit 0
fi

CACHE_FILE="${MISE_PROJECT_DIR:-.}/.env.infisical.local"
LOCK_FILE="${CACHE_FILE}.lock"
CACHE_TTL=300 # 5 minutes

_infisical_fetch() {
  local output
  output=$(INFISICAL_DISABLE_UPDATE_CHECK=true "$INFISICAL_BIN" export \
    --silent --format=dotenv-export --env="$INFISICAL_ENV" --path="$INFISICAL_PATH" --domain="$INFISICAL_API_URL" 2>/dev/null)
  local rc=$?
  if [ $rc -ne 0 ]; then
    return 1
  fi
  printf '%s' "$output"
  return 0
}

_infisical_cache_age() {
  if [ ! -f "$CACHE_FILE" ]; then
    echo 999999
    return
  fi
  local now mod
  now=$(date +%s)
  if stat -f %m "$CACHE_FILE" >/dev/null 2>&1; then
    mod=$(stat -f %m "$CACHE_FILE")
  else
    mod=$(stat -c %Y "$CACHE_FILE")
  fi
  echo $((now - mod))
}

_infisical_try_lock() {
  # Atomic lock — fails if another process holds it
  # Auto-expire stale locks older than 30s (crashed process)
  if [ -f "$LOCK_FILE" ]; then
    local lock_age
    lock_age=$( (
      now=$(date +%s)
      if stat -f %m "$LOCK_FILE" >/dev/null 2>&1; then
        mod=$(stat -f %m "$LOCK_FILE")
      else
        mod=$(stat -c %Y "$LOCK_FILE")
      fi
      echo $((now - mod))
    ) 2>/dev/null )
    if [ "${lock_age:-0}" -lt 30 ]; then
      return 1 # Lock is fresh — another process is fetching
    fi
    # Stale lock — remove it
    rm -f "$LOCK_FILE"
  fi
  # Create lock (not perfectly atomic but good enough for this use case)
  echo $$ > "$LOCK_FILE"
  return 0
}

_infisical_unlock() {
  rm -f "$LOCK_FILE"
}

_infisical_refresh_bg() {
  if ! _infisical_try_lock; then
    return # Another process is already refreshing
  fi
  (
    if result=$(_infisical_fetch); then
      printf '%s\n' "$result" > "$CACHE_FILE"
    fi
    _infisical_unlock
  ) &
  disown 2>/dev/null
}

cache_age=$(_infisical_cache_age)

if [ -f "$CACHE_FILE" ] && [ "$cache_age" -lt "$CACHE_TTL" ]; then
  # Cache is fresh — use it directly (no network call)
  eval "$(cat "$CACHE_FILE")"
elif [ -f "$CACHE_FILE" ]; then
  # Cache is stale — use it immediately, refresh in background
  eval "$(cat "$CACHE_FILE")"
  _infisical_refresh_bg
else
  # No cache — try to fetch, but only if we can get the lock
  if _infisical_try_lock; then
    if result=$(_infisical_fetch); then
      if [ -n "$result" ]; then
        printf '%s\n' "$result" > "$CACHE_FILE"
        eval "$result"
      fi
      # Empty result with exit 0 = no secrets configured (valid state)
    else
      printf '\e[33mmise: infisical export failed — run: infisical login\e[0m\n' >&2
    fi
    _infisical_unlock
  else
    # Another process is fetching — skip silently (secrets will load next time)
    :
  fi
fi

unset CACHE_FILE LOCK_FILE CACHE_TTL cache_age result INFISICAL_BIN INFISICAL_API_URL INFISICAL_ENV INFISICAL_PATH
unset -f _resolve_infisical_bin _infisical_fetch _infisical_cache_age _infisical_try_lock _infisical_unlock _infisical_refresh_bg
