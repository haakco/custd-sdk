#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: scripts/bump-version.sh <major.minor.patch>" >&2
  exit 2
fi

version="$1"
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "version must be bare semver, for example 1.5.12" >&2
  exit 2
fi

repo_root="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)}"

VERSION="$version" REPO_ROOT="$repo_root" python3 - <<'PY'
import json
import os
import re
from pathlib import Path

repo_root = Path(os.environ["REPO_ROOT"])
version = os.environ["VERSION"]


def write_text(relative_path: str, content: str) -> None:
    path = repo_root / relative_path
    path.write_text(content, encoding="utf-8")


def update_json_version(relative_path: str) -> None:
    path = repo_root / relative_path
    data = json.loads(path.read_text(encoding="utf-8"))
    data["version"] = version
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def replace_once(relative_path: str, pattern: str, replacement: str) -> None:
    path = repo_root / relative_path
    content = path.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, content, count=1, flags=re.MULTILINE)
    if count != 1:
        raise SystemExit(f"expected exactly one version replacement in {relative_path}, found {count}")
    path.write_text(updated, encoding="utf-8")


write_text("VERSION", f"{version}\n")
write_text("sdk-go/VERSION", f"{version}\n")
update_json_version("sdk-js/package.json")
update_json_version("sdk-php/composer.json")
replace_once("sdk-python/pyproject.toml", r'^version = "[0-9]+\.[0-9]+\.[0-9]+"$', f'version = "{version}"')
replace_once("wordpress-plugin/custd.php", r'^ \* Version: [0-9]+\.[0-9]+\.[0-9]+$', f" * Version: {version}")
PY
