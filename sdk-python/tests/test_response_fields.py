"""Field conformance of every response DTO against the Custd operation snapshot's maximal example.

For each route case whose operation has an example, the public method's declared return type is
resolved and walked alongside the maximal example, which carries every field the server sends. A
key the server sends that the DTO lacks fails, and so does a DTO field the server never sends, or a
Literal that does not admit the value the server sends. An untyped value (``Any``, ``object`` or
``dict[str, Any]``) over a structured object fails unless it is a genuinely free-form map named in
FREE_FORM. The walk fails closed: a row whose method or
return type cannot be resolved, or whose shape does not line up, is reported, never skipped.
"""

import dataclasses
import json
import pathlib
import sys
import types
import typing
import unittest
from typing import Any

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import test_surface_conformance as surface

# Values whose keys are data, not fields: the server types them as map[string]any. Keyed by
# "<DTO>.<field>".
FREE_FORM: dict[str, str] = {
    "AuditEvent.details": "dto.AuditEventDetails.Details is map[string]any: per-action context",
    "AnalyticsEventQueryResponse.results": "service.EventRow is map[string]any: one Parquet row's columns",
    "AnalyticsEventRangeQueryResponse.rows": "service.EventRow is map[string]any: one Parquet row's columns",
}

# DTO fields the server sends that the maximal example cannot show. Each is reported to the
# coordinator so the snapshot can be refreshed or the server contract corrected.
UNSHOWN_FIELDS: dict[str, str] = {
    "TimePlanThresholdCue.remainingFractionBps": (
        "a cue carries remainingMs or remainingFractionBps, never both; the example shows remainingMs"
    ),
}

# Literal fields whose example value the SDK rightly does not admit. Keyed by "<DTO>.<field>".
LITERAL_EXAMPLES: dict[str, str] = {
    "SiteAITenantUsage.period": "the tenant read is always the current month; the shared enum also has day",
}

# Operations whose example is not the body the SDK method decodes. Each is reported to the owner.
UNCHECKED_BODY: dict[str, str] = {
    "admin-api GET /api/v1/admin/audit/events/export": (
        "the method streams the raw download (format=csv or json) into a writer, not a decoded page"
    ),
}

# Example bodies a method's own validation rightly refuses: the snapshot omits per-row results the
# SDK requires. The test asserts the refusal.
_ROW_RESULTS = "the SDK requires one result per submitted row; the minimal example has none"
REFUSED_EXAMPLES: dict[tuple[str, str], str] = {
    ("admin-api POST /api/v1/app/item/measurements", "minimal"): _ROW_RESULTS,
    ("admin-api POST /api/v1/app/item/measurements/csv", "minimal"): _ROW_RESULTS,
    ("admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:bulk", "minimal"): _ROW_RESULTS,
    ("admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:csv", "minimal"): _ROW_RESULTS,
}

ROOT = "$"
# The snapshot writes one "key" entry for a map (additionalProperties) and named fields otherwise.
MAP_KEY = "key"


class Drift(typing.NamedTuple):
    path: str
    problem: str


def sdk_hints(owner: Any, own_names: dict[str, Any]) -> dict[str, Any]:
    """Annotations that may name types the owning module imports only for type checking."""
    names: dict[str, Any] = {}
    for name, module in list(sys.modules.items()):
        if name == "custd" or name.startswith("custd."):
            names.update(vars(module))
    names.update(own_names)
    return typing.get_type_hints(owner, globalns=names, localns=names)


def called_method(case: surface.RouteCase) -> Any:
    """Return the SDK function the route case's lambda calls last: the public operation."""
    entry = case.call.__code__
    called: list[tuple[str, str]] = []

    def profile(frame: types.FrameType, event: str, _: object) -> None:
        caller = frame.f_back
        if event == "call" and caller is not None and caller.f_code is entry:
            module = frame.f_globals.get("__name__", "")
            if module == "custd" or module.startswith("custd."):
                called.append((module, frame.f_code.co_qualname))

    sys.setprofile(profile)
    try:
        surface.send(case)
    finally:
        sys.setprofile(None)
    if not called:
        raise LookupError("no SDK method was called")
    module, qualname = called[-1]
    target: Any = sys.modules[module]
    for part in qualname.split("."):
        target = getattr(target, part)
    return target


def is_structured(hint: Any) -> bool:
    return isinstance(hint, type) and (typing.is_typeddict(hint) or dataclasses.is_dataclass(hint))


def structured_fields(hint: type) -> dict[str, Any]:
    hints = sdk_hints(hint, vars(sys.modules[hint.__module__]))
    if dataclasses.is_dataclass(hint):
        return {field.name: hints[field.name] for field in dataclasses.fields(hint)}
    return hints


def is_untyped(hint: Any) -> bool:
    return hint in (Any, object) or (typing.get_origin(hint) is dict and typing.get_args(hint)[1] in (Any, object))


def response_hint(method: Any) -> Any:
    hint = sdk_hints(method, method.__globals__).get("return")
    origin = typing.get_origin(hint)
    if origin is not None and getattr(origin, "__name__", "") == "AppConditionalRead":
        # The SDK wraps a conditional read; the wire body is the wrapped DTO.
        return typing.get_args(hint)[0]
    return hint


class FieldWalk:
    def __init__(self) -> None:
        self.drifts: list[Drift] = []
        self.exemptions_used: set[str] = set()

    def report(self, path: str, problem: str) -> None:
        self.drifts.append(Drift(path, problem))

    def walk(self, hint: Any, value: Any, path: str, owner: str = "") -> None:
        origin = typing.get_origin(hint)
        if value is None:
            return
        if origin in (typing.Union, types.UnionType):
            self.walk_union(hint, value, path, owner)
        elif origin in (typing.NotRequired, typing.Required, typing.Annotated):
            self.walk(typing.get_args(hint)[0], value, path, owner)
        elif is_untyped(hint):
            self.walk_untyped(value, path, owner)
        elif origin is list:
            self.walk_list(typing.get_args(hint)[0], value, path, owner)
        elif origin is dict:
            self.walk_map(typing.get_args(hint)[1], value, path, owner)
        elif is_structured(hint) or (origin is not None and is_structured(origin)):
            self.walk_object(origin or hint, value, path)
        elif origin is typing.Literal and value not in typing.get_args(hint):
            if owner in LITERAL_EXAMPLES:
                self.exemptions_used.add(owner)
            else:
                self.report(path, f"declared {hint!r} but the server sends {value!r}")
        elif isinstance(value, dict | list):
            self.report(path, f"declared {hint!r} but the server sends a {type(value).__name__}")

    def walk_union(self, hint: Any, value: Any, path: str, owner: str) -> None:
        members = [member for member in typing.get_args(hint) if member is not type(None)]
        if len(members) == 1:
            self.walk(members[0], value, path, owner)
            return
        if isinstance(value, dict):
            matches = [m for m in members if is_structured(m) or typing.get_origin(m) is dict or is_untyped(m)]
        elif isinstance(value, list):
            matches = [m for m in members if typing.get_origin(m) is list]
        else:
            return
        if len(matches) != 1:
            self.report(path, f"ambiguous union {hint!r} for a {type(value).__name__}")
            return
        self.walk(matches[0], value, path, owner)

    def walk_untyped(self, value: Any, path: str, owner: str) -> None:
        if isinstance(value, dict) and value:
            if owner in FREE_FORM:
                self.exemptions_used.add(owner)
            else:
                self.report(path, f"untyped value over structured object with keys {sorted(value)}")
        if isinstance(value, list):
            for item in value:
                self.walk_untyped(item, path + "[]", owner)

    def walk_list(self, item: Any, value: Any, path: str, owner: str) -> None:
        if not isinstance(value, list):
            self.report(path, f"declared a list but the server sends a {type(value).__name__}")
            return
        for child in value:
            self.walk(item, child, path + "[]", owner)

    def walk_map(self, item: Any, value: Any, path: str, owner: str) -> None:
        if not isinstance(value, dict):
            self.report(path, f"declared a map but the server sends a {type(value).__name__}")
            return
        if value and set(value) != {MAP_KEY}:
            self.report(path, f"declared a map but the server sends an object with fields {sorted(value)}")
        for child in value.values():
            self.walk(item, child, path + "{}", owner)

    def walk_object(self, hint: type, value: Any, path: str) -> None:
        if not isinstance(value, dict):
            self.report(path, f"declared {hint.__qualname__} but the server sends a {type(value).__name__}")
            return
        fields = structured_fields(hint)
        for key in sorted(set(value) - set(fields)):
            self.report(f"{path}.{key}", f"sent by the server but missing from {hint.__qualname__}")
        for key in sorted(set(fields) - set(value)):
            owner = f"{hint.__qualname__}.{key}"
            if owner in UNSHOWN_FIELDS:
                self.exemptions_used.add(owner)
            else:
                self.report(f"{path}.{key}", f"declared in {hint.__qualname__} but never sent by the server")
        for key in sorted(set(fields) & set(value)):
            self.walk(fields[key], value[key], f"{path}.{key}", f"{hint.__qualname__}.{key}")


def example_rows() -> dict[str, dict[str, Any]]:
    operations = surface.load_operations()
    return {
        operation_id: operations[operation_id]
        for operation_id in surface.ROUTES
        if operations[operation_id].get("example") and operation_id not in UNCHECKED_BODY
    }


def load_example(operation: dict[str, Any]) -> dict[str, Any]:
    return dict(json.loads((surface.API / operation["example"]).read_text(encoding="utf-8")))


class ResponseFieldConformanceTest(unittest.TestCase):
    def test_response_dtos_carry_exactly_the_fields_the_server_sends(self) -> None:
        used: set[str] = set()
        for operation_id, operation in example_rows().items():
            with self.subTest(operation_id):
                hint = response_hint(called_method(surface.ROUTES[operation_id]))
                typed = (is_structured(hint) or typing.get_origin(hint) is not None) and not is_untyped(hint)
                self.assertTrue(typed, f"untyped return {hint!r}")
                walk = FieldWalk()
                walk.walk(hint, load_example(operation)["maximal"], ROOT)
                self.assertEqual([], walk.drifts)
                used |= walk.exemptions_used
        self.assertEqual(set(FREE_FORM) | set(UNSHOWN_FIELDS) | set(LITERAL_EXAMPLES), used, "an exemption is stale")

    def test_every_method_decodes_the_server_examples(self) -> None:
        for operation_id, operation in example_rows().items():
            example = load_example(operation)
            for variant in ("minimal", "maximal"):
                with self.subTest(operation_id, variant=variant):
                    case = surface.ROUTES[operation_id]
                    if (operation_id, variant) in REFUSED_EXAMPLES:
                        with self.assertRaises((ValueError, surface.RequestError)):
                            surface.decode(case, example[variant])
                    else:
                        surface.decode(case, example[variant])

    def test_unchecked_bodies_name_live_operations(self) -> None:
        operations = surface.load_operations()
        for operation_id in UNCHECKED_BODY:
            self.assertIn(operation_id, surface.ROUTES)
            self.assertTrue(operations[operation_id].get("example"))


if __name__ == "__main__":
    unittest.main()
