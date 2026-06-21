set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

test: test-go test-js test-python test-php

check: test lint-workflows lint-markdown diff-check

diff-check:
  git diff --check

lint-workflows:
  actionlint

lint-markdown:
  pnpm exec markdownlint-cli2 '**/*.md' '#node_modules' '#vendor' '#sdk-js/node_modules' '#sdk-php/vendor' '#laravel-package/vendor' '#wordpress-plugin/vendor'

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
