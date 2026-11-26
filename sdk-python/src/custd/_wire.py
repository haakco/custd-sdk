"""Request and decode helpers shared by the typed operation clients.

``request`` sends one call to a full ``/api/v1/...`` path through the client's admin
transport and turns an RFC 9457 problem into a ``RequestError``. ``decode`` checks that a
response is a JSON object and, guided by the named response DTO, replaces every JSON null
list with an empty list so callers never branch on null.
"""

from __future__ import annotations

import functools
import json
import types
import typing
import urllib.parse
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar, Union, cast

from .client import problem_request_error, with_acting_company

if TYPE_CHECKING:
    from .client import AdminClient, AdminRequestOptions

T = TypeVar("T")

QueryValue = str | int | bool | None


def request(
    admin: AdminClient,
    method: str,
    path: str,
    *,
    query: Mapping[str, QueryValue] | None = None,
    body: dict[str, Any] | None = None,
    options: AdminRequestOptions | None = None,
    headers: Mapping[str, str] | None = None,
) -> object:
    """Send one authenticated request to ``path`` and return the decoded JSON body, or None."""
    url = admin._client.base_url + with_acting_company(admin._client, path + query_string(query))
    sent = admin._option_headers(options)
    sent.update(headers or {})
    result = admin._transport(method, url, body, sent, admin._client.timeout)
    return answer(int(result["status"]), result.get("body"), path)


def answer(status: int, body: object, path: str) -> object:
    """Decode a JSON answer; an error status becomes a RequestError."""
    if status >= 400:
        raise problem_request_error(status, body, path)
    if status == 204 or body in (None, "", b""):
        return None
    if isinstance(body, bytes):
        body = body.decode("utf-8")
    return json.loads(body) if isinstance(body, str) else body


def query_string(query: Mapping[str, QueryValue] | None) -> str:
    """Encode the present query values; None and empty strings are omitted."""
    present = {
        key: ("true" if value else "false") if isinstance(value, bool) else str(value)
        for key, value in (query or {}).items()
        if value is not None and value != ""
    }
    return "?" + urllib.parse.urlencode(present) if present else ""


def require_idempotency(options: AdminRequestOptions) -> AdminRequestOptions:
    """Reject a mutation whose retry identity is missing before anything is sent."""
    key = options.get("idempotency_key")
    if not isinstance(key, str) or not key.strip():
        raise ValueError("custd: this operation requires an idempotency_key")
    return options


def decode(dto: type[T], value: object) -> T:
    """Return ``value`` as the named response DTO, with every JSON null list made empty."""
    if not isinstance(value, dict):
        raise ValueError(f"custd: {dto.__name__} response must be a JSON object")
    _fill(dto, value)
    return cast(T, value)


def _fill(hint: object, value: object) -> object:
    """Walk ``value`` along ``hint`` and return it with null lists replaced by empty ones."""
    origin = typing.get_origin(hint)
    if origin in (Union, types.UnionType):
        members = [member for member in typing.get_args(hint) if member is not type(None)]
        return _fill(members[0], value) if len(members) == 1 else value
    if origin is list:
        if value is None:
            return []
        (item,) = typing.get_args(hint)
        if isinstance(value, list):
            value[:] = [_fill(item, child) for child in value]
        return value
    if origin is dict:
        item = typing.get_args(hint)[1]
        if isinstance(value, dict):
            for key, child in value.items():
                value[key] = _fill(item, child)
        return value
    from_payload = getattr(hint, "from_payload", None)
    if callable(from_payload) and isinstance(value, dict):
        # A dataclass DTO (the time-plan run views) validates and builds itself.
        return from_payload(value)
    if isinstance(hint, type) and typing.is_typeddict(hint) and isinstance(value, dict):
        for key, field in _fields(hint).items():
            if key in value:
                value[key] = _fill(field, value[key])
            elif typing.get_origin(field) is list and key in _required(hint):
                value[key] = []
    return value


@functools.cache
def _fields(dto: type) -> dict[str, Any]:
    return typing.get_type_hints(dto)


@functools.cache
def _required(dto: type) -> frozenset[str]:
    return cast(frozenset[str], getattr(dto, "__required_keys__", frozenset()))
