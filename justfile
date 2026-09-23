set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

test: infisical-test test-go test-js test-python test-php test-release-mirrors

check: test sdk-version-identity lint-workflows lint-markdown diff-check

# The X-Custd-Sdk identity constants must equal VERSION, or a release ships a
# client that misreports itself.
sdk-version-identity:
  bash scripts/check-sdk-version-identity.sh

diff-check:
  git diff --check

lint-workflows:
  actionlint

lint-markdown:
  pnpm exec markdownlint-cli2 '**/*.md' '#node_modules' '#vendor' '#sdk-js/node_modules' '#sdk-react/node_modules' '#sdk-php/vendor' '#laravel-package/vendor' '#wordpress-plugin/vendor' '#.opencode' '#docs/tmp'

test-go:
  cd sdk-go && go vet ./...
  cd sdk-go && golangci-lint run ./...
  cd sdk-go && go test ./...

test-js:
  pnpm -C sdk-js install --frozen-lockfile
  pnpm -C sdk-js run lint
  pnpm -C sdk-js run typecheck
  pnpm -C sdk-js test
  pnpm -C sdk-js run build
  git diff --exit-code -- sdk-js/dist
  bash scripts/check-js-source-archive.sh
  pnpm -C sdk-react install --frozen-lockfile
  pnpm -C sdk-react run lint
  pnpm -C sdk-react run typecheck
  pnpm -C sdk-react test
  pnpm -C sdk-react run build
  git diff --exit-code -- sdk-react/dist

test-python:
  cd sdk-python && ruff check
  cd sdk-python && mypy
  cd sdk-python && python3 -m unittest discover -s tests

test-php:
  composer install
  cd sdk-php && composer install
  cd sdk-php && composer analyse
  cd sdk-php && composer format-check
  composer test
  # The framework packages resolve haakco/custd-sdk from its released tag, so these
  # suites pass only against a release that carries the classes they use. They run
  # here because leaving them unrunnable is how the Laravel and WordPress packages
  # kept a `haakco/custd-sdk` range that no longer admitted any released version.
  # Their lockfiles are not committed by design, hence `update` rather than install.
  cd laravel-package && composer update --no-interaction --no-progress
  cd laravel-package && composer test
  cd wordpress-plugin && composer update --no-interaction --no-progress
  cd wordpress-plugin && composer test

test-release-mirrors:
  bash scripts/test-publish-release-mirror.sh

# Repository-isolated developer Infisical profile (Docker required).
infisical-login:
    scripts/infisical-docker.sh login

infisical-status:
    scripts/infisical-docker.sh status

infisical-test:
    node --test scripts/test-infisical-docker.mjs
