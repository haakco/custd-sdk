"""The signed-in end user's own profile in a hosted application, under ``/api/v1/app/profile``.

Every call carries the user's application access token (with the application's profile scope) as
``Authorization: Bearer``; no Site key is involved. A photo is PNG or WebP of at most 256 KiB.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any, NotRequired, TypedDict, cast

from .client import AdminTransport, default_admin_transport, problem_request_error

CURRENT_APP_PROFILE_PATH = "/api/v1/app/profile"
CURRENT_APP_PROFILE_PHOTO_PATH = CURRENT_APP_PROFILE_PATH + "/photo"
CURRENT_APP_PROFILE_PHOTO_TYPES = ("image/png", "image/webp")
MAX_CURRENT_APP_PROFILE_PHOTO_BYTES = 256 * 1024


class CurrentAppProfileField(TypedDict):
    """One profile field; ``editableBy`` is an open set owned by Custd."""

    fieldKey: str
    present: bool
    initialized: bool
    required: bool
    editableBy: str
    editable: bool
    value: NotRequired[str]


class CurrentAppProfile(TypedDict):
    fields: list[CurrentAppProfileField]
    managedPhoto: NotRequired[bool]


class CurrentAppProfileValue(TypedDict):
    fieldKey: str
    value: str


class CurrentAppProfileUpdate(TypedDict):
    values: list[CurrentAppProfileValue]


class CurrentAppProfilePhoto(TypedDict):
    contentType: str
    data: bytes


class CurrentAppProfileClient:
    def __init__(
        self,
        api_base_url: str,
        access_token: str | Callable[[], str],
        *,
        timeout: float = 10.0,
        transport: AdminTransport | None = None,
    ) -> None:
        self.api_base_url = api_base_url.rstrip("/")
        self._access_token = access_token
        self.timeout = timeout
        self._transport = transport or default_admin_transport

    def read(self) -> CurrentAppProfile:
        return self._profile("GET", CURRENT_APP_PROFILE_PATH)

    def update(self, update: CurrentAppProfileUpdate) -> CurrentAppProfile:
        return self._profile("PATCH", CURRENT_APP_PROFILE_PATH, dict(update))

    def initialize(self, update: CurrentAppProfileUpdate) -> CurrentAppProfile:
        """Fill only previously uninitialized fields and return the current profile."""
        return self._profile("POST", CURRENT_APP_PROFILE_PATH, dict(update))

    def read_photo(self) -> CurrentAppProfilePhoto:
        result = self._send("GET", CURRENT_APP_PROFILE_PHOTO_PATH, None, {})
        body = result.get("body")
        if not isinstance(body, bytes):
            raise ValueError("custd: app profile photo response must be bytes")
        headers = {str(key).lower(): str(value) for key, value in (result.get("headers") or {}).items()}
        return CurrentAppProfilePhoto(contentType=headers.get("content-type", "").split(";")[0], data=body)

    def upload_photo(self, data: bytes, content_type: str) -> CurrentAppProfile:
        return self._photo("PUT", data, content_type)

    def initialize_photo(self, data: bytes, content_type: str) -> CurrentAppProfile:
        """Fill a previously uninitialized photo and return the current profile."""
        return self._photo("POST", data, content_type)

    def remove_photo(self) -> CurrentAppProfile:
        return self._profile("DELETE", CURRENT_APP_PROFILE_PHOTO_PATH)

    def _photo(self, method: str, data: bytes, content_type: str) -> CurrentAppProfile:
        if content_type not in CURRENT_APP_PROFILE_PHOTO_TYPES or not data:
            raise ValueError("custd: app profile photo must be non-empty PNG or WebP")
        if len(data) > MAX_CURRENT_APP_PROFILE_PHOTO_BYTES:
            raise ValueError("custd: app profile photo must be at most 256 KiB")
        return self._decode(self._send(method, CURRENT_APP_PROFILE_PHOTO_PATH, data, {"Content-Type": content_type}))

    def _profile(self, method: str, path: str, body: dict[str, Any] | None = None) -> CurrentAppProfile:
        headers = {"Content-Type": "application/json"} if body is not None else {}
        return self._decode(self._send(method, path, body, headers))

    def _decode(self, result: dict[str, Any]) -> CurrentAppProfile:
        body = result.get("body")
        decoded = json.loads(body) if isinstance(body, str | bytes) and body else {}
        if not isinstance(decoded, dict):
            raise ValueError("custd: current app profile response must be a JSON object")
        decoded["fields"] = decoded.get("fields") or []
        return cast(CurrentAppProfile, decoded)

    def _send(
        self, method: str, path: str, body: dict[str, Any] | bytes | None, headers: dict[str, str]
    ) -> dict[str, Any]:
        token = self._access_token() if callable(self._access_token) else self._access_token
        if not token or any(character.isspace() for character in token):
            raise ValueError("custd: application access token is required")
        headers = {**headers, "Authorization": f"Bearer {token}"}
        result = self._transport(method, self.api_base_url + path, body, headers, self.timeout)
        status = int(result["status"])
        if status >= 400:
            raise problem_request_error(status, result.get("body"), "current app profile")
        return result
