#!/usr/bin/env python3
"""Compare each SDK's proven route coverage with the Custd operation snapshot.

Each SDK's route conformance test owns contract-fixtures/api/coverage/<sdk>.json: the operation IDs
its table calls through the fake transport, asserting method and path. This check fails when a
coverage file names an unknown or excluded operation; with --complete it also fails while any
required operation is missing from any SDK.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SDKS = ("go", "js", "python", "php", "rust")
API = Path(__file__).resolve().parent.parent / "contract-fixtures" / "api"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--complete", action="store_true", help="fail while any required operation is missing")
    parser.add_argument("--missing", choices=SDKS, help="list the missing operation IDs of one SDK")
    args = parser.parse_args()

    snapshot = json.loads((API / "operations.json").read_text(encoding="utf-8"))
    required = {o["id"] for o in snapshot["operations"] if o["sdk"] == "required"}
    known = {o["id"] for o in snapshot["operations"]}
    failures: list[str] = []
    missing_total = 0

    print(f"{'sdk':8} {'covered':>8} {'missing':>8}  of {len(required)} required")
    for sdk in SDKS:
        path = API / "coverage" / f"{sdk}.json"
        covered = set(json.loads(path.read_text(encoding="utf-8"))["operations"]) if path.exists() else set()
        unknown = sorted(covered - known)
        excluded = sorted((covered & known) - required)
        failures += [f"{sdk}: {op} is not in operations.json" for op in unknown]
        failures += [f"{sdk}: {op} is excluded and must not be covered" for op in excluded]
        missing = sorted(required - covered)
        missing_total += len(missing)
        print(f"{sdk:8} {len(covered & required):>8} {len(missing):>8}")
        if args.missing == sdk:
            print("\n".join(missing))

    for failure in failures:
        print(f"FAIL {failure}", file=sys.stderr)
    if args.complete and missing_total:
        print(f"FAIL {missing_total} required operations are missing across the SDKs", file=sys.stderr)
        return 1
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
