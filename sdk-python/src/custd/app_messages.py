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
    whatsappSourceGeneration: NotRequired[int]


AppMessageConnectorState = Literal["active", "paused", "stale", "disconnected"]
AppMessageConnectorConnection = Literal["connecting", "importing_history", "syncing", "offline", "pair_again"]


class AppMessageConnectorControl(TypedDict):
    action: Literal["pause", "resume", "disconnect"]


class AppMessageConnectorReport(TypedDict):
    connectionState: AppMessageConnectorConnection
    pendingMedia: int


class AppMessageConnectorStatus(TypedDict):
    state: AppMessageConnectorState
    grantId: NotRequired[str]
    sourceGeneration: NotRequired[int]
    createdAt: NotRequired[str]
    updatedAt: NotRequired[str]
    lastReportAt: NotRequired[str]
    pendingMedia: NotRequired[int]
    connectionState: NotRequired[AppMessageConnectorConnection]


class AppMessageConnectorEnrollment(TypedDict):
    status: AppMessageConnectorStatus
    bearerToken: str


class AppMessageMutation(TypedDict):
    externalId: str
    operationId: str
    kind: Literal["edit", "revoke"]
    revision: int
    text: NotRequired[str]


class AppMessageMutationBatch(TypedDict):
    source: Literal["whatsapp"]
    mutations: list[AppMessageMutation]
    sourceGeneration: int


class AppMessageMutationResult(TypedDict):
    externalId: str
    operationId: str
    status: str
    errorCode: NotRequired[str]


class AppMessageMutationBatchResponse(TypedDict):
    results: list[AppMessageMutationResult]


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
    sourceGeneration: NotRequired[int]


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
    sourceGeneration: NotRequired[int]


class AppMessageMediaUpload(TypedDict):
    messageUuid: str
    image: bytes
    sourceGeneration: NotRequired[int]


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

    def get_connector(self) -> AppMessageConnectorStatus:
        """Read the signed-in archive owner's connector status."""
        return self._request(AppMessageConnectorStatus, "GET", "/connector")

    def enroll_connector(self) -> AppMessageConnectorEnrollment:
        """Use a human tenant administrator token. The connector bearer is returned once."""
        return self._request(AppMessageConnectorEnrollment, "POST", "/connector/enroll")

    def control_connector(self, request: AppMessageConnectorControl) -> AppMessageConnectorStatus:
        return self._request(AppMessageConnectorStatus, "POST", "/connector/control", dict(request))

    def connector_session(self) -> AppMessageSession:
        """Verify a connector bearer and read its bound archive generation."""
        return self._request(AppMessageSession, "GET", "/connector/session")

    def report_connector(self, request: AppMessageConnectorReport) -> AppMessageConnectorStatus:
        """Use the connector bearer to report connection state and pending media."""
        return self._request(AppMessageConnectorStatus, "POST", "/connector/report", dict(request))

    def mutate(self, request: AppMessageMutationBatch) -> AppMessageMutationBatchResponse:
        """Apply native message edits or revocations with the connector bearer."""
        return self._request(AppMessageMutationBatchResponse, "POST", "/mutations", dict(request))

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
        generation = upload.get("sourceGeneration")
        if generation is not None and not 0 < generation < (1 << 63):
            raise ValueError("custd: archive source generation must be a positive int64")
        return self._request(AppMessageMediaMetadata, "PUT", path, image, generation=generation)

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
        self,
        dto: type[_DTO],
        method: str,
        path: str,
        payload: dict[str, object] | bytes | None = None,
        *,
        generation: int | None = None,
    ) -> _DTO:
        body = self._send(method, path, payload, generation=generation).get("body")
        return _decode_dto(dto, json.loads(body) if isinstance(body, str) else body)

    def _send(
        self, method: str, path: str, payload: dict[str, object] | bytes | None = None, *, generation: int | None = None
    ) -> TransportResult:
        headers = self._client._headers()
        if isinstance(payload, bytes):
            headers["Content-Type"] = "application/octet-stream"
        if generation is not None:
            headers["X-Custd-Source-Generation"] = str(generation)
        result = self._transport(method, self._client.base_url + ROOT + path, payload, headers, self._client.timeout)
        status = result["status"]
        if not 200 <= status < 300:
            raise problem_request_error(status, result.get("body"), "message archive")
        return result
