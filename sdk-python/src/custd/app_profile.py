"""The signed-in end user's own profile in a hosted application, under ``/api/v1/app/profile``.

Every call carries the user's application access token (with the application's profile scope) as
``Authorization: Bearer``; no Site key is involved. A photo is PNG or WebP of at most 256 KiB.
"""

from __future__ import annotations

import json
import re
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, NotRequired, TypedDict, cast
from urllib.parse import urlsplit

from .client import AdminTransport, RequestError, default_admin_transport, no_redirect_transport, problem_request_error
from .version import IDENTITY

CURRENT_APP_PROFILE_PATH = "/api/v1/app/profile"
CURRENT_APP_PROFILE_PHOTO_PATH = CURRENT_APP_PROFILE_PATH + "/photo"
CURRENT_APP_PROFILE_PHOTO_TYPES = ("image/png", "image/webp")
MAX_CURRENT_APP_PROFILE_PHOTO_BYTES = 256 * 1024
APP_SETTINGS_ENTRY_PATH = "/settings/entry"
MAX_APP_ACCOUNT_RETURN_PATH_BYTES = 512
# 32 bytes as strict unpadded base64url: the last character carries only two data bits.
_APP_ACCOUNT_ENTRY_TICKET = re.compile(r"[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]")
# A lowercase DNS name or a bracketed IPv6 literal; the URL parser alone admits other host bytes.
_ORIGIN_HOST = re.compile(r"[a-z0-9.-]+|\[[0-9a-f:.]+\]")
_INVALID_APP_ACCOUNT_ENTRY_RESPONSE = "custd: invalid app account entry response"


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


@dataclass(frozen=True, slots=True)
class AppAccountEntryRequest:
    """Binds a hosted settings ticket to a registered application origin.

    Take ``issuer`` and ``application_origin`` from trusted deployment configuration.
    ``return_path`` is the page on the application origin that hosted settings links back to,
    such as ``"/mine"``; empty links to the application's home.
    """

    issuer: str
    application_origin: str
    return_path: str = ""


@dataclass(frozen=True, slots=True)
class AppAccountEntry:
    """For a same-tab form POST to ``action_url``.

    The ticket is a short-lived, one-use credential: keep it out of URLs and logs.
    """

    action_url: str
    ticket: str = field(repr=False)


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
        # The issuer must not forward the bearer to another host through a redirect.
        self._entry_transport = transport or no_redirect_transport

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

    def create_account_entry(self, request: AppAccountEntryRequest) -> AppAccountEntry:
        """Obtain a hosted settings ticket for the signed-in user's application session."""
        token = self._token()
        issuer = _account_entry_origin(request.issuer.removesuffix("/"))
        body: dict[str, Any] = {"applicationOrigin": _account_entry_origin(request.application_origin)}
        if request.return_path:
            if not _valid_account_return_path(request.return_path):
                raise ValueError("custd: app account return path must be a path on the application origin")
            body["returnPath"] = request.return_path
        action = issuer + APP_SETTINGS_ENTRY_PATH
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json", "X-Custd-Sdk": IDENTITY}
        result = self._entry_transport("POST", action + "/ticket", body, headers, self.timeout)
        status = int(result["status"])
        # Status only: an issuer error body could carry ticket material.
        if not 200 <= status < 300:
            raise RequestError(f"custd: app account entry request failed with status {status}", status=status)
        try:
            decoded = json.loads(result.get("body") or "")
        except (TypeError, ValueError):
            raise ValueError(_INVALID_APP_ACCOUNT_ENTRY_RESPONSE) from None
        if not isinstance(decoded, dict) or decoded.get("actionUrl") != action:
            raise ValueError(_INVALID_APP_ACCOUNT_ENTRY_RESPONSE)
        ticket = decoded.get("ticket")
        if not isinstance(ticket, str) or not _APP_ACCOUNT_ENTRY_TICKET.fullmatch(ticket):
            raise ValueError(_INVALID_APP_ACCOUNT_ENTRY_RESPONSE)
        return AppAccountEntry(action_url=action, ticket=ticket)

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
        headers = {**headers, "Authorization": f"Bearer {self._token()}"}
        result = self._transport(method, self.api_base_url + path, body, headers, self.timeout)
        status = int(result["status"])
        if status >= 400:
            raise problem_request_error(status, result.get("body"), "current app profile")
        return result

    def _token(self) -> str:
        token = self._access_token() if callable(self._access_token) else self._access_token
        if not token or any(character.isspace() for character in token):
            raise ValueError("custd: application access token is required")
        return token


def _account_entry_origin(raw: str) -> str:
    """Return ``raw`` when it is already a serialized HTTPS origin: no path, credentials or ``:443``."""
    try:
        parts = urlsplit(raw)
        port = parts.port
    except ValueError:
        parts, port = None, None
    if (
        parts is None
        or parts.scheme != "https"
        or not _ORIGIN_HOST.fullmatch(parts.netloc.rsplit(":", 1)[0] if port is not None else parts.netloc)
        or port == 443
        or "https://" + parts.netloc != raw
    ):
        raise ValueError("custd: app account entry requires a serialized HTTPS origin")
    return raw


def _valid_account_return_path(path: str) -> bool:
    """Mirror the issuer: an absolute path with an optional query and no fragment."""
    return (
        len(path.encode("utf-8")) <= MAX_APP_ACCOUNT_RETURN_PATH_BYTES
        and path.startswith("/")
        and not path.startswith("//")
        and not any(character in "\\#" or character <= " " or character == "\x7f" for character in path)
    )
