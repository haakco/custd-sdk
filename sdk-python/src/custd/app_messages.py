"""The signed-in tenant user's private message archive."""

from __future__ import annotations

import json
from typing import Literal, NotRequired, TypedDict, TypeVar, cast

from .client import AdminTransport, CustdClient, TransportResult, _decode_dto, problem_request_error, quote_path

ROOT = "/api/v1/app/messages"
MAX_MEDIA_BYTES = 10 * 1024 * 1024

AppMessageSource = Literal["sms", "imessage", "whatsapp"]


class AppMessageSession(TypedDict):
    companySlug: str
    principalId: str
    importAllowed: bool


class AppMessageInput(TypedDict):
    externalId: str
    threadId: str | None
    sender: str | None
    participants: list[str]
    timestamp: str
    direction: str
    text: str


class AppMessageBatchRequest(TypedDict):
    source: AppMessageSource
    messages: list[AppMessageInput]


class AppMessageImportResult(TypedDict):
    externalId: str
    status: str
    messageUuid: NotRequired[str]
    errorCode: NotRequired[str]


class AppMessageBatchResponse(TypedDict):
    results: list[AppMessageImportResult]


AppMessageSearchRequest = TypedDict(
    "AppMessageSearchRequest",
    {
        "query": str,
        "sender": str,
        "source": AppMessageSource,
        "threadId": str,
        "from": str,
        "to": str,
        "limit": int,
        "cursor": str,
    },
    total=False,
)


class AppMessageMediaMetadata(TypedDict):
    mediaUuid: str
    contentType: str
    byteCount: int
    ocrStatus: str
    ocrText: NotRequired[str]


class AppMessage(TypedDict):
    messageUuid: str
    source: str
    externalId: str
    threadId: str
    sender: str
    participants: list[str]
    timestamp: str
    direction: str
    text: str
    media: NotRequired[list[AppMessageMediaMetadata]]


class AppMessageSearchResponse(TypedDict):
    messages: list[AppMessage]
    nextCursor: NotRequired[str]


class AppMessageReadResponse(TypedDict):
    message: AppMessage


class AppMessageDeleteSourceResponse(TypedDict):
    source: str
    deletedCount: int


class AppMessageMediaUpload(TypedDict):
    messageUuid: str
    image: bytes


class AppMessageMediaRef(TypedDict):
    messageUuid: str
    mediaUuid: str


AppMessageImageType = Literal["image/jpeg", "image/png"]


class AppMessageMedia(TypedDict):
    contentType: AppMessageImageType
    image: bytes


_DTO = TypeVar("_DTO")


class AppMessageClient:
    def __init__(self, client: CustdClient, transport: AdminTransport) -> None:
        self._client = client
        self._transport = transport

    def session(self) -> AppMessageSession:
        return self._request(AppMessageSession, "GET", "/session")

    def import_batch(self, request: AppMessageBatchRequest) -> AppMessageBatchResponse:
        return self._request(AppMessageBatchResponse, "POST", "/batch", dict(request))

    def search(self, request: AppMessageSearchRequest) -> AppMessageSearchResponse:
        return self._request(AppMessageSearchResponse, "POST", "/search", dict(request))

    def get(self, message_uuid: str) -> AppMessageReadResponse:
        return self._request(AppMessageReadResponse, "GET", f"/{quote_path(message_uuid)}")

    def delete_source(self, source: AppMessageSource) -> AppMessageDeleteSourceResponse:
        return self._request(AppMessageDeleteSourceResponse, "DELETE", f"/sources/{quote_path(source)}")

    def upload_media(self, upload: AppMessageMediaUpload) -> AppMessageMediaMetadata:
        image = upload["image"]
        if not 0 < len(image) <= MAX_MEDIA_BYTES:
            raise ValueError("custd: archive image must contain 1 byte to 10 MiB")
        path = f"/{quote_path(upload['messageUuid'])}/media"
        return self._request(AppMessageMediaMetadata, "PUT", path, image)

    def download_media(self, ref: AppMessageMediaRef) -> AppMessageMedia:
        path = f"/{quote_path(ref['messageUuid'])}/media/{quote_path(ref['mediaUuid'])}"
        result = self._send("GET", path)
        image = result.get("body")
        headers = result.get("headers") or {}
        content_type = next((value for key, value in headers.items() if key.lower() == "content-type"), "")
        if (
            not isinstance(image, bytes)
            or not 0 < len(image) <= MAX_MEDIA_BYTES
            or content_type not in ("image/jpeg", "image/png")
        ):
            raise ValueError("custd: archive image must be JPEG or PNG and contain 1 byte to 10 MiB")
        return {"contentType": cast(AppMessageImageType, content_type), "image": image}

    def _request(
        self, dto: type[_DTO], method: str, path: str, payload: dict[str, object] | bytes | None = None
    ) -> _DTO:
        body = self._send(method, path, payload).get("body")
        return _decode_dto(dto, json.loads(body) if isinstance(body, str) else body)

    def _send(self, method: str, path: str, payload: dict[str, object] | bytes | None = None) -> TransportResult:
        headers = self._client._headers()
        if isinstance(payload, bytes):
            headers["Content-Type"] = "application/octet-stream"
        result = self._transport(method, self._client.base_url + ROOT + path, payload, headers, self._client.timeout)
        status = result["status"]
        if not 200 <= status < 300:
            raise problem_request_error(status, result.get("body"), "message archive")
        return result
