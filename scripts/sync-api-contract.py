#!/usr/bin/env python3
"""Refresh the SDK API contract snapshot from the route list and OpenAPI Custd publishes.

Writes contract-fixtures/api/operations.json (every public operation, its declared query
parameters, and whether the SDKs must cover it) and contract-fixtures/api/examples/<operationId>.json (a minimal and a maximal success
response generated from the OpenAPI schema, for the SDK decode tests).

The source is Custd's published docs directory: https://custd.com/docs/openapi, or a Custd
checkout's packages/frontend/docs-site/static/openapi before it is deployed.

Run: uv run --with pyyaml python scripts/sync-api-contract.py --source https://custd.com/docs/openapi
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import urllib.request
from pathlib import Path

import yaml

SERVICES = ("admin-api", "analytics-api", "billing", "ingest-api", "schema-registry")
OPENAPI = {
    "admin-api": "admin-api.openapi.yaml",
    "analytics-api": "analytics-api.openapi.yaml",
}
OPERATIONS = "api-operations.json"
INFRASTRUCTURE = re.compile(r"^/(debug|internal|metrics|health|healthz|readyz|ready)(/|$)")
METHODS = ("get", "post", "put", "patch", "delete")
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "contract-fixtures" / "api"


def exclusion(method: str, path: str, router_mount: bool = False) -> str | None:
    """The reason an operation is not an SDK call, or None when every SDK must cover it."""
    if router_mount:
        # Custd catalogues a router mount so its validator sees it; nothing is served at that path.
        return "router mount prefix with no operation at this exact path"
    if method == "OPTIONS":
        return "browser CORS preflight"
    if path in ("/mcp", "/mcp/tenant"):
        return "MCP protocol transport; application routes own the SDK calls"
    if INFRASTRUCTURE.match(path) or path == "/api/v1/health":
        return "infrastructure, debug or private internal transport"
    if path.startswith(("/oauth/", "/admin/identities")):
        return "identity-provider callback or gateway hook"
    if path.startswith("/.well-known/oauth"):
        return "OAuth discovery protocol"
    return None


class Examples:
    """Builds example values from OpenAPI schemas; minimal sends required fields with null lists.

    A schema that refers back to itself stops at the repeat: a list of it is empty and an optional
    property of it is left out, the shapes the server sends at the end of a recursive value.
    """

    REPEAT = object()

    def __init__(self, schemas: dict) -> None:
        self.schemas = schemas

    def value(self, schema: dict, minimal: bool, seen: frozenset = frozenset()) -> object:
        if "$ref" in schema:
            name = schema["$ref"].rsplit("/", 1)[-1]
            if name in seen:
                return Examples.REPEAT
            return self.value(self.schemas[name], minimal, seen | {name})
        for union in ("oneOf", "anyOf"):
            if schema.get(union):
                return self.value(schema[union][0], minimal, seen)
        if schema.get("allOf"):
            merged: dict = {"type": "object", "properties": {}, "required": []}
            for part in schema["allOf"]:
                part = self.schemas[part["$ref"].rsplit("/", 1)[-1]] if "$ref" in part else part
                merged["properties"].update(part.get("properties", {}))
                merged["required"] += part.get("required", [])
            return self.value(merged, minimal, seen)
        types = schema.get("type", "object")
        types = types if isinstance(types, list) else [types]
        nullable = "null" in types
        kind = next((t for t in types if t != "null"), "object")
        if minimal and nullable and kind == "array":
            return None
        if "enum" in schema:
            return schema["enum"][0]
        if kind == "object":
            return self.object(schema, minimal, seen)
        if kind == "array":
            item = schema.get("items", {})
            value = [] if minimal else self.value(item, minimal, seen)
            return [] if minimal or value is Examples.REPEAT else [value]
        return self.scalar(kind, schema.get("format"))

    def object(self, schema: dict, minimal: bool, seen: frozenset) -> dict:
        properties = schema.get("properties", {})
        required = set(schema.get("required", []))
        names = [n for n in properties if n != "$schema" and (not minimal or n in required)]
        if not properties and isinstance(schema.get("additionalProperties"), dict) and not minimal:
            return {"key": self.value(schema["additionalProperties"], minimal, seen)}
        values = {n: self.value(properties[n], minimal, seen) for n in names}
        return {n: (None if v is Examples.REPEAT else v) for n, v in values.items()
                if v is not Examples.REPEAT or n in required}

    @staticmethod
    def scalar(kind: str, fmt: str | None) -> object:
        if kind == "integer":
            return 1
        if kind == "number":
            return 1.5
        if kind == "boolean":
            return True
        return {
            "date-time": "2026-11-20T06:00:00Z",
            "date": "2026-11-20",
            "uuid": "0198a3b2-0000-7000-8000-000000000001",
            "uri": "https://example.com/",
            "email": "person@example.com",
        }.get(fmt or "", "example")


def fetch(source: str, name: str) -> bytes:
    """One published file; a missing file or failed request raises, so a run never syncs half a source."""
    with urllib.request.urlopen(f"{source}/{name}", timeout=60) as response:
        return response.read()


def openapi_operations(inputs: dict[str, bytes]) -> tuple[dict, dict]:
    """Maps (service, METHOD, path) to the OpenAPI operation, and the schemas by service."""
    operations, schemas = {}, {}
    for service, name in OPENAPI.items():
        document = yaml.safe_load(inputs[name].decode("utf-8"))
        schemas[service] = document.get("components", {}).get("schemas", {})
        for path, item in document.get("paths", {}).items():
            for method in METHODS:
                if method in item:
                    operations[(service, method.upper(), path)] = item[method]
    return operations, schemas


def query_parameters(operation: dict) -> list[dict]:
    """The query parameters an operation declares, so each SDK can prove it can send them."""
    return [
        {"name": p["name"], "required": bool(p.get("required"))}
        for p in operation.get("parameters", [])
        if p.get("in") == "query"
    ]


def success_schema(operation: dict) -> dict | None:
    for status, response in sorted(operation.get("responses", {}).items()):
        if status.startswith("2"):
            content = response.get("content", {})
            for media in ("application/json", "application/problem+json"):
                if media in content:
                    return content[media].get("schema")
            return None
    return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True,
                        help="published docs URL, or a local directory with the same files")
    source = parser.parse_args().source.rstrip("/")
    if "://" not in source:
        source = Path(source).resolve().as_uri()
    inputs = {name: fetch(source, name) for name in (OPERATIONS, *OPENAPI.values())}
    catalogue = json.loads(inputs[OPERATIONS].decode("utf-8"))
    by_route, schemas = openapi_operations(inputs)

    examples_dir = OUT / "examples"
    shutil.rmtree(examples_dir, ignore_errors=True)
    examples_dir.mkdir(parents=True)

    entries = []
    for op in catalogue["operations"]:
        if op["service"] not in SERVICES:
            continue
        entry = {"id": f"{op['service']} {op['method']} {op['path']}", "service": op["service"],
                 "method": op["method"], "path": op["path"]}
        reason = exclusion(op["method"], op["path"], op.get("routerMount", False))
        entry["sdk"] = "excluded" if reason else "required"
        if reason:
            entry["reason"] = reason
        spec = by_route.get((op["service"], op["method"], op["path"]))
        if spec and spec.get("operationId"):
            entry["operationId"] = spec["operationId"]
            query = query_parameters(spec)
            if query:
                entry["query"] = query
            schema = success_schema(spec)
            if schema and not reason:
                builder = Examples(schemas[op["service"]])
                example = {"minimal": builder.value(schema, True), "maximal": builder.value(schema, False)}
                (examples_dir / f"{spec['operationId']}.json").write_text(
                    json.dumps(example, indent=2, sort_keys=True) + "\n", encoding="utf-8")
                entry["example"] = f"examples/{spec['operationId']}.json"
        entries.append(entry)

    entries.sort(key=lambda e: e["id"])
    snapshot = {
        "source": {
            "apiReviewedAt": catalogue.get("reviewed_at", ""),
            "sha256": {name: hashlib.sha256(data).hexdigest() for name, data in sorted(inputs.items())},
        },
        "operations": entries,
    }
    (OUT / "operations.json").write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    required = sum(e["sdk"] == "required" for e in entries)
    print(f"{len(entries)} operations, {required} required, {len(entries) - required} excluded")


if __name__ == "__main__":
    main()
