#!/usr/bin/env bash
# Walking skeleton: create an app, build and deploy this starter, then run the browser journey
# against the live URL (create a counter, add three measurements, open the share link in a second
# browser and see the forecast). Uses only custdctl and the released SDK.
#
#   scripts/walking-skeleton.sh                # app "s1-walking-skeleton", default custdctl profile
#   APP_NAME=my-app CUSTD_PROFILE=local scripts/walking-skeleton.sh
#
# Re-running is safe: `apps create` replays for the same caller and each deploy is a new release.
set -euo pipefail

APP_NAME="${APP_NAME:-s1-walking-skeleton}"
CUSTDCTL="${CUSTDCTL:-custdctl}"
PROFILE_ARGS=()
if [[ -n "${CUSTD_PROFILE:-}" ]]; then PROFILE_ARGS=(--profile "$CUSTD_PROFILE"); fi

cd "$(dirname "$0")/.."
step=""
run_step() { step="$1"; echo; echo "==> $step"; }
report_failure() { if [[ -n "$step" ]]; then echo "walking-skeleton: FAILED at step: $step" >&2; fi; }
trap report_failure EXIT
fail() { echo "walking-skeleton: $1" >&2; exit 1; }

run_step "check tools"
command -v "$CUSTDCTL" >/dev/null || fail "custdctl not found; install it or set CUSTDCTL=/path/to/custdctl"
command -v pnpm >/dev/null || fail "pnpm not found"
command -v jq >/dev/null || fail "jq not found"
command -v curl >/dev/null || fail "curl not found"

run_step "create app $APP_NAME"
created="$("$CUSTDCTL" apps create "$APP_NAME" --json "${PROFILE_ARGS[@]}")" ||
  fail "custdctl apps create failed; is Custd reachable and is the profile signed in (custdctl login)?"
slug="$(jq -er '.app.slug' <<<"$created")" || fail "apps create answered without .app.slug: $created"
app_url="$(jq -er '.app.url' <<<"$created")" || fail "apps create answered without .app.url: $created"
echo "app=$slug url=$app_url"

run_step "install and build the starter"
pnpm install --frozen-lockfile
pnpm build

run_step "deploy ./dist to $slug"
"$CUSTDCTL" apps deploy ./dist --app "$slug" "${PROFILE_ARGS[@]}"

run_step "wait for $app_url to serve the release"
for _ in $(seq 1 30); do
  if curl -fsS "$app_url/.well-known/custd.json" -o /dev/null && curl -fsS "$app_url/" | grep -q 'id="root"'; then
    served=yes
    break
  fi
  sleep 2
done
[[ "${served:-}" == yes ]] || fail "$app_url did not serve the app and its /.well-known/custd.json within 60 s"

run_step "browser journey against $app_url"
pnpm exec playwright install chromium >/dev/null
APP_URL="$app_url" pnpm exec playwright test e2e/walking-skeleton.spec.ts

step=""
echo
echo "walking-skeleton: PASSED against $app_url"
