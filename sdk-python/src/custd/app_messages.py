"""The signed-in user's private message archive under ``/api/v1/app/messages``."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, Literal, NotRequired, TypedDict, TypeVar
from urllib.parse import urlsplit
from uuid import UUID

from . import _wire
from .client import AdminTransport, RequestError, no_redirect_transport
from .version import IDENTITY

_MESSAGES_PATH = "/api/v1/app/messages"
_Response = TypeVar("_Response")

AppMessageSource = Literal["sms", "imessage"]
AppMessageDirection = Literal["incoming", "outgoing"]
AppMessageImportStatus = Literal["accepted", "already_accepted", "invalid"]


class AppMessagesSession(TypedDict):
    companySlug: str
    principalId: str
    importAllowed: bool


class AppMessageInput(TypedDict):
    externalId: str
    threadId: str | None
    sender: str | None
    participants: list[str]
    timestamp: str
    direction: AppMessageDirection
    text: str


class AppMessage(AppMessageInput):
    source: AppMessageSource
    messageUuid: str


class AppMessagesBatchRequest(TypedDict):
    source: AppMessageSource
    messages: list[AppMessageInput]


class AppMessageImportResult(TypedDict):
    externalId: str
    status: AppMessageImportStatus
    messageUuid: NotRequired[str]
    errorCode: NotRequired[str]


class AppMessagesBatchResponse(TypedDict):
    results: list[AppMessageImportResult]


class AppMessagesSearchRequest(TypedDict):
    query: str
    source: NotRequired[AppMessageSource]
    sender: NotRequired[str]
    limit: NotRequired[int]


class AppMessagesSearchResponse(TypedDict):
    messages: list[AppMessage]


class AppMessageReadResponse(TypedDict):
    message: AppMessage


class AppMessagesDeleteSourceResponse(TypedDict):
    source: AppMessageSource
    deletedCount: int


class AppMessagesClient:
    """Use a signed-in user's application bearer token to access their own archive."""

    def __init__(
        self,
        api_base_url: str,
        access_token: str | Callable[[], str],
        *,
        timeout: float = 10.0,
        transport: AdminTransport | None = None,
    ) -> None:
        self.api_base_url = api_base_url.removesuffix("/")
        parsed = urlsplit(self.api_base_url)
        if (
            parsed.scheme != "https"
            or not parsed.hostname
            or parsed.username is not None
            or self.api_base_url != f"https://{parsed.netloc}"
            or any(character.isspace() or character == "\\" for character in self.api_base_url)
        ):
            raise ValueError("custd: app messages requires an HTTPS API origin")
        self._access_token = access_token
        self.timeout = timeout
        self._transport = transport or no_redirect_transport

    def session(self) -> AppMessagesSession:
        """Read the archive identity and whether it admits imports."""
        return self._request(AppMessagesSession, "GET", "/session")

    def import_batch(self, request: AppMessagesBatchRequest) -> AppMessagesBatchResponse:
        """Import one source batch and return the outcome for each external ID."""
        return self._request(AppMessagesBatchResponse, "POST", "/batch", dict(request))

    def search(self, request: AppMessagesSearchRequest) -> AppMessagesSearchResponse:
        """Search this archive using text and optional sender or source filters."""
        return self._request(AppMessagesSearchResponse, "POST", "/search", dict(request))

    def get_message(self, message_uuid: str) -> AppMessageReadResponse:
        """Read one message directly within this private archive."""
        try:
            safe_id = UUID(message_uuid)
        except ValueError:
            raise ValueError("custd: app message ID must be a UUID") from None
        return self._request(AppMessageReadResponse, "GET", f"/{safe_id}")

    def delete_source(self, source: AppMessageSource) -> AppMessagesDeleteSourceResponse:
        """Delete the authorized archive's messages for one source."""
        if source not in ("sms", "imessage"):
            raise ValueError("custd: app message source is unknown")
        return self._request(AppMessagesDeleteSourceResponse, "DELETE", f"/sources/{source}")

    def _request(
        self, dto: type[_Response], method: str, suffix: str, body: dict[str, Any] | None = None
    ) -> _Response:
        token = self._access_token() if callable(self._access_token) else self._access_token
        if not token or any(character.isspace() for character in token):
            raise ValueError("custd: application access token is required")
        path = _MESSAGES_PATH + suffix
        headers = {"Accept": "application/json", "Authorization": f"Bearer {token}", "X-Custd-Sdk": IDENTITY}
        if body is not None:
            headers["Content-Type"] = "application/json"

        try:
            result = self._transport(method, self.api_base_url + path, body, headers, self.timeout)
            status = int(result["status"])
            if not 200 <= status < 300:
                # Error bodies can contain private archive content.
                raise RequestError(f"custd: app messages request failed with status {status}", status=status)
            value = _wire.answer(status, result.get("body"), path)
        except ValueError:
            raise ValueError("custd: invalid app messages response") from None
        return _wire.decode(dto, value)
