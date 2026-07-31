"""Load lifecycle contract fixtures shipped with the Python SDK."""
import json
from importlib import resources
from typing import Any


def read_lifecycle_fixture(namespace: str, name: str) -> dict[str, Any]:
    """Return one JSON lifecycle fixture, failing loudly when absent."""
    filename = f"{namespace}--{name}"
    try:
        data = resources.files("custd.lifecycle_fixtures").joinpath(filename).read_text(encoding="utf-8")
    except (AttributeError, FileNotFoundError):
        import pkgutil
        raw = pkgutil.get_data("custd.lifecycle_fixtures", filename)
        if raw is None:
            raise FileNotFoundError(f"lifecycle fixture {namespace}/{name} not found") from None
        data = raw.decode("utf-8")
    value = json.loads(data)
    if not isinstance(value, dict):
        raise ValueError(f"lifecycle fixture {namespace}/{name} must be an object")
    return value
