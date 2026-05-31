set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

test: test-go test-js test-python test-php

check: test lint-workflows lint-markdown diff-check

diff-check:
  git diff --check

lint-workflows:
  actionlint

lint-markdown:
  markdownlint-cli2 '**/*.md' '#node_modules' '#sdk-js/node_modules' '#sdk-php/vendor'

test-go:
  cd sdk-go && go test ./...

test-js:
  pnpm -C sdk-js install --frozen-lockfile
  pnpm -C sdk-js test
  pnpm -C sdk-js run build

test-python:
  cd sdk-python && python3 -m unittest discover -s tests

test-php:
  composer install
  composer test
