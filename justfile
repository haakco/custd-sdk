set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

test: test-go test-js test-python test-php

test-go:
  cd sdk-go && go test ./...

test-js:
  pnpm -C sdk-js install --frozen-lockfile
  pnpm -C sdk-js test
  pnpm -C sdk-js run build

test-python:
  cd sdk-python && python3 -m unittest discover -s tests

test-php:
  cd sdk-php && composer install
  cd sdk-php && composer test
