from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, fields, is_dataclass

from .client import AdminClient, quote_path

Payload = Mapping[str, object]
_MISSING = object()

_ANNOTATION_TYPES = {"note", "marker", "decision", "action"}
_ANNOTATION_FIELDS = {"text", "markerLabel", "decisionStatus", "assigneeRef", "dueDate", "actionStatus"}
_THRESHOLD_SEVERITIES = {"info", "warning", "critical"}
_ALLOCATION_BASES = {"absolute", "horizon_fraction", "remainder_weight"}
_MAX_THRESHOLD_CUES = 16


def _encode(value: object) -> object:
    if is_dataclass(value):
        return {
            item.name: encoded for item in fields(value) if (encoded := _encode(getattr(value, item.name))) is not None
        }
    if isinstance(value, list):
        return [_encode(item) for item in value]
    if isinstance(value, tuple):
        return [_encode(item) for item in value]
    if isinstance(value, Mapping):
        return {str(key): _encode(item) for key, item in value.items()}
    return value


def _body(value: object) -> dict[str, object]:
    encoded = _encode(value)
    if not isinstance(encoded, dict):
        raise TypeError("time-plan request DTO must encode to an object")
    return encoded


def _payload(value: object) -> Payload:
    if not isinstance(value, Mapping):
        raise ValueError("custd: time-plan response must be a named object DTO")
    return value


def _string(payload: Payload, key: str) -> str:
    value = payload.get(key, _MISSING)
    if value is _MISSING:
        raise ValueError(f"custd: time-plan field {key} is required")
    if not isinstance(value, str):
        raise ValueError(f"custd: time-plan field {key} must be a string")
    return value


def _integer(payload: Payload, key: str) -> int:
    value = payload.get(key, _MISSING)
    if value is _MISSING:
        raise ValueError(f"custd: time-plan field {key} is required")
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"custd: time-plan field {key} must be an integer")
    return value


def _boolean(payload: Payload, key: str) -> bool:
    value = payload.get(key, _MISSING)
    if value is _MISSING:
        raise ValueError(f"custd: time-plan field {key} is required")
    if not isinstance(value, bool):
        raise ValueError(f"custd: time-plan field {key} must be a boolean")
    return value


def _optional_integer(payload: Payload, key: str) -> int | None:
    value = payload.get(key)
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"custd: time-plan field {key} must be an integer")
    return value


def _optional_string(payload: Payload, key: str) -> str | None:
    value = payload.get(key)
    if value is None:
        return None
    return _string(payload, key)


def _nullable_objects(payload: Payload, key: str) -> list[Payload] | None:
    value = payload.get(key, _MISSING)
    if value is _MISSING:
        raise ValueError(f"custd: time-plan field {key} is required")
    if value is None:
        return None
    if not isinstance(value, list):
        raise ValueError(f"custd: time-plan field {key} must be a list")
    return [_payload(item) for item in value]


def _optional_strings(payload: Payload, key: str) -> list[str] | None:
    value = payload.get(key)
    if value is None:
        return None
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ValueError(f"custd: time-plan field {key} must be a list of strings")
    return value


def _validate_enum(values: list[str] | None, allowed: set[str], key: str, max_items: int) -> None:
    if values is None:
        return
    if len(values) > max_items or len(values) != len(set(values)):
        raise ValueError(f"custd: time-plan field {key} contains too many or duplicate values")
    if any(value not in allowed for value in values):
        raise ValueError(f"custd: time-plan field {key} contains an unsupported value")


def _objects_or_empty(payload: Payload, key: str) -> list[Payload]:
    return _nullable_objects(payload, key) or []


@dataclass(frozen=True, slots=True)
class TimePlanDefinitionBlock:
    uuid: str = ""
    semanticKey: str = ""
    title: str = ""
    description: str = ""
    category: str = ""
    tags: list[str] | None = None
    basis: str = ""
    durationMs: int = 0
    numerator: int = 0
    denominator: int = 0
    weight: int = 0

    def __post_init__(self) -> None:
        if self.basis not in _ALLOCATION_BASES:
            raise ValueError("custd: time-plan block basis is invalid")
        if self.tags is not None and (
            not isinstance(self.tags, list) or not all(isinstance(item, str) for item in self.tags)
        ):
            raise ValueError("custd: time-plan tags must be a list of strings")

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanDefinitionBlock:
        tags = payload.get("tags")
        if tags is not None and (not isinstance(tags, list) or not all(isinstance(item, str) for item in tags)):
            raise ValueError("custd: time-plan tags must be a list of strings")
        return cls(
            uuid=_string(payload, "uuid"),
            semanticKey=_string(payload, "semanticKey"),
            title=_string(payload, "title"),
            description=_optional_string(payload, "description") or "",
            category=_optional_string(payload, "category") or "",
            tags=tags,
            basis=_string(payload, "basis"),
            durationMs=_optional_integer(payload, "durationMs") or 0,
            numerator=_optional_integer(payload, "numerator") or 0,
            denominator=_optional_integer(payload, "denominator") or 0,
            weight=_optional_integer(payload, "weight") or 0,
        )


@dataclass(frozen=True, slots=True)
class TimePlanAnnotationSchema:
    allowedTypes: list[str] | None = None
    fields: list[str] | None = None

    def __post_init__(self) -> None:
        _validate_enum(self.allowedTypes, _ANNOTATION_TYPES, "allowedTypes", 4)
        _validate_enum(self.fields, _ANNOTATION_FIELDS, "fields", 6)

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanAnnotationSchema:
        allowed_types = _optional_strings(payload, "allowedTypes")
        fields = _optional_strings(payload, "fields")
        return cls(allowedTypes=allowed_types, fields=fields)


@dataclass(frozen=True, slots=True)
class TimePlanThresholdCue:
    remainingFractionBps: int | None = None
    remainingMs: int | None = None
    severity: str = ""

    def __post_init__(self) -> None:
        for value, key in (
            (self.remainingFractionBps, "remainingFractionBps"),
            (self.remainingMs, "remainingMs"),
        ):
            if value is not None and (isinstance(value, bool) or not isinstance(value, int)):
                raise ValueError(f"custd: time-plan {key} must be an integer")
        if self.severity not in _THRESHOLD_SEVERITIES:
            raise ValueError("custd: time-plan threshold cue severity is invalid")
        if self.remainingFractionBps is None and self.remainingMs is None:
            raise ValueError("custd: time-plan threshold cue needs a remaining threshold")
        if self.remainingFractionBps is not None and not 0 <= self.remainingFractionBps <= 10_000:
            raise ValueError("custd: time-plan remainingFractionBps is out of range")
        if self.remainingMs is not None and not 0 <= self.remainingMs <= 2_419_200_000:
            raise ValueError("custd: time-plan remainingMs is out of range")
        if self.remainingFractionBps is not None and self.remainingMs is not None:
            raise ValueError("custd: time-plan threshold cue must have one remaining threshold")

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanThresholdCue:
        return cls(
            remainingFractionBps=_optional_integer(payload, "remainingFractionBps"),
            remainingMs=_optional_integer(payload, "remainingMs"),
            severity=_string(payload, "severity"),
        )


@dataclass(frozen=True, slots=True)
class TimePlanDefinition:
    horizonMs: int = 0
    defaultStartsAt: str | None = None
    defaultEndsAt: str | None = None
    redistributionMode: str = ""
    autoAdvance: bool = False
    annotationSchema: TimePlanAnnotationSchema | None = None
    thresholdCues: list[TimePlanThresholdCue] | None = None
    blocks: list[TimePlanDefinitionBlock] | None = None

    def __post_init__(self) -> None:
        if self.annotationSchema is not None and not isinstance(self.annotationSchema, TimePlanAnnotationSchema):
            raise TypeError("custd: annotationSchema must be a TimePlanAnnotationSchema")
        if self.thresholdCues is not None and (
            not isinstance(self.thresholdCues, list)
            or not all(isinstance(item, TimePlanThresholdCue) for item in self.thresholdCues)
        ):
            raise TypeError("custd: thresholdCues must be a list of TimePlanThresholdCue")
        if self.thresholdCues is not None:
            if len(self.thresholdCues) > _MAX_THRESHOLD_CUES:
                raise ValueError("custd: time-plan thresholdCues cannot contain more than 16 values")
            seen_triggers: set[tuple[str, int]] = set()
            for cue in self.thresholdCues:
                if cue.remainingMs is not None:
                    trigger = ("ms", cue.remainingMs)
                elif cue.remainingFractionBps is not None:
                    trigger = ("bps", cue.remainingFractionBps)
                else:
                    raise ValueError("custd: time-plan threshold cue needs a remaining threshold")
                if trigger in seen_triggers:
                    raise ValueError("custd: time-plan thresholdCues must not contain duplicate triggers")
                seen_triggers.add(trigger)
        if self.blocks is not None and (
            not isinstance(self.blocks, list)
            or not all(isinstance(item, TimePlanDefinitionBlock) for item in self.blocks)
        ):
            raise TypeError("custd: blocks must be a list of TimePlanDefinitionBlock")

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanDefinition:
        annotation_schema = payload.get("annotationSchema")
        if annotation_schema is not None and not isinstance(annotation_schema, Mapping):
            raise ValueError("custd: time-plan annotationSchema must be an object")
        parsed_annotation_schema = (
            TimePlanAnnotationSchema.from_payload(annotation_schema) if annotation_schema is not None else None
        )
        threshold_cues = payload.get("thresholdCues")
        if threshold_cues is not None and not isinstance(threshold_cues, list):
            raise ValueError("custd: time-plan thresholdCues must be a list")
        parsed_threshold_cues = (
            [TimePlanThresholdCue.from_payload(_payload(item)) for item in threshold_cues]
            if threshold_cues is not None
            else None
        )
        return cls(
            horizonMs=_integer(payload, "horizonMs"),
            defaultStartsAt=_optional_string(payload, "defaultStartsAt"),
            defaultEndsAt=_optional_string(payload, "defaultEndsAt"),
            redistributionMode=_string(payload, "redistributionMode"),
            autoAdvance=_boolean(payload, "autoAdvance"),
            annotationSchema=parsed_annotation_schema,
            thresholdCues=parsed_threshold_cues,
            blocks=[TimePlanDefinitionBlock.from_payload(item) for item in _objects_or_empty(payload, "blocks")],
        )


@dataclass(frozen=True, slots=True)
class TimePlanDraftRequest:
    planKey: str
    name: str
    definition: TimePlanDefinition
    description: str = ""

    def __post_init__(self) -> None:
        if not self.planKey.strip() or not self.name.strip():
            raise ValueError("custd: time-plan planKey and name are required")


@dataclass(frozen=True, slots=True)
class TimePlanDraftRevisionRequest:
    expectedRevision: int
    planKey: str
    name: str
    definition: TimePlanDefinition
    description: str = ""

    def __post_init__(self) -> None:
        if self.expectedRevision <= 0 or not self.planKey.strip() or not self.name.strip():
            raise ValueError("custd: time-plan revision request is invalid")


@dataclass(frozen=True, slots=True)
class TimePlanRevisionRequest:
    expectedRevision: int

    def __post_init__(self) -> None:
        if self.expectedRevision <= 0:
            raise ValueError("custd: expectedRevision must be positive")


@dataclass(frozen=True, slots=True)
class TimePlanRunRequest:
    planUuid: str
    versionUuid: str | None = None
    scheduledStartsAt: str | None = None
    scheduledEndsAt: str | None = None

    def __post_init__(self) -> None:
        if not self.planUuid.strip():
            raise ValueError("custd: planUuid is required")


@dataclass(frozen=True, slots=True)
class TimePlanCorrectedCommand:
    type: str
    effectiveAt: str
    blockId: str = ""
    boundaryEndsAt: str | None = None
    startPolicy: str = ""


@dataclass(frozen=True, slots=True)
class TimePlanCommandRequest:
    commandId: str
    idempotencyKey: str
    expectedVersion: int
    type: str
    blockId: str = ""
    clientOccurredAt: str | None = None
    boundaryEndsAt: str | None = None
    scheduledStartsAt: str | None = None
    scheduledEndsAt: str | None = None
    startPolicy: str = ""
    reason: str = ""
    supersedesTransitionUuid: str | None = None
    corrected: TimePlanCorrectedCommand | None = None

    def __post_init__(self) -> None:
        if not self.commandId.strip() or not self.idempotencyKey.strip() or not self.type.strip():
            raise ValueError("custd: commandId, idempotencyKey, and type are required")


@dataclass(frozen=True, slots=True)
class TimePlanAnnotationInput:
    type: str
    runBlockUuid: str = ""
    text: str = ""
    markerLabel: str = ""
    decisionStatus: str = ""
    assigneeRef: str = ""
    dueDate: str | None = None
    actionStatus: str = ""

    def __post_init__(self) -> None:
        if not self.type.strip():
            raise ValueError("custd: annotation type is required")


@dataclass(frozen=True, slots=True)
class TimePlanRedactionRequest:
    reason: str

    def __post_init__(self) -> None:
        if not self.reason.strip():
            raise ValueError("custd: redaction reason is required")


@dataclass(frozen=True, slots=True)
class TimePlanAllocation:
    blockId: str = ""
    sequence: int = 0
    durationMs: int = 0

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanAllocation:
        return cls(_string(payload, "blockId"), _integer(payload, "sequence"), _integer(payload, "durationMs"))


@dataclass(frozen=True, slots=True)
class TimePlan:
    uuid: str = ""
    planKey: str = ""
    name: str = ""
    description: str = ""
    status: str = ""
    draftRevision: int = 0
    definition: TimePlanDefinition = TimePlanDefinition()
    updatedAt: str = ""

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlan:
        return cls(
            uuid=_string(payload, "uuid"),
            planKey=_string(payload, "planKey"),
            name=_string(payload, "name"),
            description=_optional_string(payload, "description") or "",
            status=_string(payload, "status"),
            draftRevision=_integer(payload, "draftRevision"),
            definition=TimePlanDefinition.from_payload(_payload(payload.get("definition", {}))),
            updatedAt=_string(payload, "updatedAt"),
        )


@dataclass(frozen=True, slots=True)
class TimePlanListResponse:
    plans: list[TimePlan]

    @classmethod
    def from_payload(cls, payload: object) -> TimePlanListResponse:
        root = _payload(payload)
        return cls([TimePlan.from_payload(item) for item in _objects_or_empty(root, "plans")])


@dataclass(frozen=True, slots=True)
class TimePlanVersion:
    uuid: str = ""
    planUuid: str = ""
    versionNumber: int = 0
    definitionHash: str = ""
    publishedAt: str = ""

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanVersion:
        return cls(
            _string(payload, "uuid"),
            _string(payload, "planUuid"),
            _integer(payload, "versionNumber"),
            _string(payload, "definitionHash"),
            _string(payload, "publishedAt"),
        )


@dataclass(frozen=True, slots=True)
class TimePlanCreatedRun:
    uuid: str = ""
    planUuid: str = ""
    versionUuid: str = ""
    status: str = ""
    baselineHorizonMs: int = 0
    blockAllocations: list[TimePlanAllocation] | None = None
    createdAt: str = ""

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanCreatedRun:
        return cls(
            uuid=_string(payload, "uuid"),
            planUuid=_string(payload, "planUuid"),
            versionUuid=_string(payload, "versionUuid"),
            status=_string(payload, "status"),
            baselineHorizonMs=_integer(payload, "baselineHorizonMs"),
            blockAllocations=[
                TimePlanAllocation.from_payload(item) for item in _objects_or_empty(payload, "blockAllocations")
            ],
            createdAt=_string(payload, "createdAt"),
        )


@dataclass(frozen=True, slots=True)
class TimePlanRunBlock:
    uuid: str = ""
    sequence: int = 0
    status: str = ""
    baselineMs: int = 0
    currentMs: int = 0
    allocatedAtStartMs: int | None = None
    actualActiveMs: int = 0
    wallStartedAt: str | None = None
    wallEndedAt: str | None = None
    outcomeCensored: bool = False

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanRunBlock:
        return cls(
            uuid=_string(payload, "uuid"),
            sequence=_integer(payload, "sequence"),
            status=_string(payload, "status"),
            baselineMs=_integer(payload, "baselineMs"),
            currentMs=_integer(payload, "currentMs"),
            allocatedAtStartMs=_optional_integer(payload, "allocatedAtStartMs"),
            actualActiveMs=_integer(payload, "actualActiveMs"),
            wallStartedAt=_optional_string(payload, "wallStartedAt"),
            wallEndedAt=_optional_string(payload, "wallEndedAt"),
            outcomeCensored=_boolean(payload, "outcomeCensored"),
        )


@dataclass(frozen=True, slots=True)
class TimePlanRun:
    uuid: str = ""
    planUuid: str = ""
    status: str = ""
    streamVersion: int = 0
    scheduledStartsAt: str | None = None
    scheduledEndsAt: str | None = None
    effectiveStartsAt: str | None = None
    effectiveEndsAt: str | None = None
    startPolicy: str = ""
    baselineHorizonMs: int = 0
    executableHorizonMs: int | None = None
    lostMs: int = 0
    unusedMs: int = 0
    overrunMs: int = 0
    currentBlockUuid: str = ""
    blocks: list[TimePlanRunBlock] | None = None

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanRun:
        executable = payload.get("executableHorizonMs")
        return cls(
            uuid=_string(payload, "uuid"),
            planUuid=_string(payload, "planUuid"),
            status=_string(payload, "status"),
            streamVersion=_integer(payload, "streamVersion"),
            scheduledStartsAt=_optional_string(payload, "scheduledStartsAt"),
            scheduledEndsAt=_optional_string(payload, "scheduledEndsAt"),
            effectiveStartsAt=_optional_string(payload, "effectiveStartsAt"),
            effectiveEndsAt=_optional_string(payload, "effectiveEndsAt"),
            startPolicy=_optional_string(payload, "startPolicy") or "",
            baselineHorizonMs=_integer(payload, "baselineHorizonMs"),
            executableHorizonMs=(
                executable if isinstance(executable, int) and not isinstance(executable, bool) else None
            ),
            lostMs=_integer(payload, "lostMs"),
            unusedMs=_integer(payload, "unusedMs"),
            overrunMs=_integer(payload, "overrunMs"),
            currentBlockUuid=_optional_string(payload, "currentBlockUuid") or "",
            blocks=[TimePlanRunBlock.from_payload(item) for item in _objects_or_empty(payload, "blocks")],
        )


@dataclass(frozen=True, slots=True)
class TimePlanCalculationChange:
    blockId: str = ""
    fromMs: int = 0
    toMs: int = 0

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanCalculationChange:
        return cls(_string(payload, "blockId"), _integer(payload, "fromMs"), _integer(payload, "toMs"))


@dataclass(frozen=True, slots=True)
class TimePlanCalculationReceipt:
    allocatorVersion: str = ""
    reason: str = ""
    summary: str = ""
    source: list[TimePlanAllocation] | None = None
    result: list[TimePlanAllocation] | None = None
    changes: list[TimePlanCalculationChange] | None = None

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanCalculationReceipt:
        return cls(
            allocatorVersion=_string(payload, "allocatorVersion"),
            reason=_string(payload, "reason"),
            summary=_string(payload, "summary"),
            source=[TimePlanAllocation.from_payload(item) for item in _objects_or_empty(payload, "source")],
            result=[TimePlanAllocation.from_payload(item) for item in _objects_or_empty(payload, "result")],
            changes=[TimePlanCalculationChange.from_payload(item) for item in _objects_or_empty(payload, "changes")],
        )


@dataclass(frozen=True, slots=True)
class TimePlanCommandResult:
    transitionUuid: str = ""
    projection: TimePlanRun = TimePlanRun()
    receipt: TimePlanCalculationReceipt = TimePlanCalculationReceipt()
    duplicate: bool = False

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanCommandResult:
        return cls(
            transitionUuid=_string(payload, "transitionUuid"),
            projection=TimePlanRun.from_payload(_payload(payload.get("projection", {}))),
            receipt=TimePlanCalculationReceipt.from_payload(_payload(payload.get("receipt", {}))),
            duplicate=_boolean(payload, "duplicate"),
        )


@dataclass(frozen=True, slots=True)
class TimePlanTransition:
    uuid: str = ""
    runUuid: str = ""
    streamVersion: int = 0
    commandId: str = ""
    type: str = ""
    actorKind: str = ""
    actorRef: str = ""
    serverReceivedAt: str = ""
    clientOccurredAt: str | None = None
    reason: str = ""
    previousStatus: str = ""
    currentStatus: str = ""
    allocatorVersion: str = ""
    schemaVersion: str = ""
    supersedesTransitionUuid: str = ""
    receipt: TimePlanCalculationReceipt = TimePlanCalculationReceipt()

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanTransition:
        return cls(
            uuid=_string(payload, "uuid"),
            runUuid=_string(payload, "runUuid"),
            streamVersion=_integer(payload, "streamVersion"),
            commandId=_string(payload, "commandId"),
            type=_string(payload, "type"),
            actorKind=_string(payload, "actorKind"),
            actorRef=_string(payload, "actorRef"),
            serverReceivedAt=_string(payload, "serverReceivedAt"),
            clientOccurredAt=_optional_string(payload, "clientOccurredAt"),
            reason=_optional_string(payload, "reason") or "",
            previousStatus=_optional_string(payload, "previousStatus") or "",
            currentStatus=_string(payload, "currentStatus"),
            allocatorVersion=_string(payload, "allocatorVersion"),
            schemaVersion=_string(payload, "schemaVersion"),
            supersedesTransitionUuid=_optional_string(payload, "supersedesTransitionUuid") or "",
            receipt=TimePlanCalculationReceipt.from_payload(_payload(payload.get("receipt", {}))),
        )


@dataclass(frozen=True, slots=True)
class TimePlanHistoryResponse:
    transitions: list[TimePlanTransition]

    @classmethod
    def from_payload(cls, payload: object) -> TimePlanHistoryResponse:
        root = _payload(payload)
        return cls([TimePlanTransition.from_payload(item) for item in _objects_or_empty(root, "transitions")])


@dataclass(frozen=True, slots=True)
class TimePlanAnnotation:
    uuid: str = ""
    runUuid: str = ""
    runBlockUuid: str = ""
    type: str = ""
    text: str = ""
    markerLabel: str = ""
    decisionStatus: str = ""
    assigneeRef: str = ""
    dueDate: str | None = None
    actionStatus: str = ""
    supersedesUuid: str = ""
    recordedAt: str = ""
    actorKind: str = ""
    actorRef: str = ""
    redactedAt: str | None = None
    redactionReason: str = ""

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanAnnotation:
        return cls(
            uuid=_string(payload, "uuid"),
            runUuid=_string(payload, "runUuid"),
            runBlockUuid=_optional_string(payload, "runBlockUuid") or "",
            type=_string(payload, "type"),
            text=_optional_string(payload, "text") or "",
            markerLabel=_optional_string(payload, "markerLabel") or "",
            decisionStatus=_optional_string(payload, "decisionStatus") or "",
            assigneeRef=_optional_string(payload, "assigneeRef") or "",
            dueDate=_optional_string(payload, "dueDate"),
            actionStatus=_optional_string(payload, "actionStatus") or "",
            supersedesUuid=_optional_string(payload, "supersedesUuid") or "",
            recordedAt=_string(payload, "recordedAt"),
            actorKind=_string(payload, "actorKind"),
            actorRef=_string(payload, "actorRef"),
            redactedAt=_optional_string(payload, "redactedAt"),
            redactionReason=_optional_string(payload, "redactionReason") or "",
        )


@dataclass(frozen=True, slots=True)
class TimePlanAnnotationListResponse:
    annotations: list[TimePlanAnnotation]

    @classmethod
    def from_payload(cls, payload: object) -> TimePlanAnnotationListResponse:
        root = _payload(payload)
        return cls([TimePlanAnnotation.from_payload(item) for item in _objects_or_empty(root, "annotations")])


@dataclass(frozen=True, slots=True)
class TimePlanAllocationPreview:
    allocatorVersion: str = ""
    horizonMs: int = 0
    allocations: list[TimePlanAllocation] | None = None

    @classmethod
    def from_payload(cls, payload: Payload) -> TimePlanAllocationPreview:
        return cls(
            _string(payload, "allocatorVersion"),
            _integer(payload, "horizonMs"),
            [TimePlanAllocation.from_payload(item) for item in _objects_or_empty(payload, "allocations")],
        )


class TimePlanAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def list(self, company_slug: str, limit: int | None = None) -> TimePlanListResponse:
        path = self._collection("/time-plans", company_slug, limit)
        return TimePlanListResponse.from_payload(self._admin.request("GET", path))

    def get(self, company_slug: str, plan_uuid: str) -> TimePlan:
        path = self._resource(f"/time-plans/{plan_uuid}", company_slug)
        return TimePlan.from_payload(_payload(self._admin.request("GET", path)))

    def create(self, company_slug: str, body: TimePlanDraftRequest) -> TimePlan:
        path = self._collection("/time-plans", company_slug)
        return TimePlan.from_payload(_payload(self._admin.request("POST", path, _body(body))))

    def preview(self, company_slug: str, definition: TimePlanDefinition) -> TimePlanAllocationPreview:
        path = self._collection("/time-plans/preview", company_slug)
        return TimePlanAllocationPreview.from_payload(_payload(self._admin.request("POST", path, _body(definition))))

    def revise(self, company_slug: str, plan_uuid: str, body: TimePlanDraftRevisionRequest) -> TimePlan:
        path = self._resource(f"/time-plans/{plan_uuid}", company_slug)
        return TimePlan.from_payload(_payload(self._admin.request("PATCH", path, _body(body))))

    def publish(self, company_slug: str, plan_uuid: str, body: TimePlanRevisionRequest) -> TimePlanVersion:
        path = self._resource(f"/time-plans/{plan_uuid}/publish", company_slug)
        return TimePlanVersion.from_payload(_payload(self._admin.request("POST", path, _body(body))))

    def retire(self, company_slug: str, plan_uuid: str) -> TimePlan:
        path = self._resource(f"/time-plans/{plan_uuid}/retire", company_slug)
        return TimePlan.from_payload(_payload(self._admin.request("POST", path)))

    def create_run(self, company_slug: str, body: TimePlanRunRequest) -> TimePlanCreatedRun:
        path = self._collection("/time-plans/runs", company_slug)
        return TimePlanCreatedRun.from_payload(_payload(self._admin.request("POST", path, _body(body))))

    def get_run(self, company_slug: str, run_uuid: str) -> TimePlanRun:
        path = self._resource(f"/time-plans/runs/{run_uuid}", company_slug)
        return TimePlanRun.from_payload(_payload(self._admin.request("GET", path)))

    def history(self, company_slug: str, run_uuid: str, limit: int | None = None) -> TimePlanHistoryResponse:
        path = self._resource(f"/time-plans/runs/{run_uuid}/history", company_slug, limit)
        return TimePlanHistoryResponse.from_payload(self._admin.request("GET", path))

    def execute(self, company_slug: str, run_uuid: str, body: TimePlanCommandRequest) -> TimePlanCommandResult:
        path = self._resource(f"/time-plans/runs/{run_uuid}/commands", company_slug)
        return TimePlanCommandResult.from_payload(_payload(self._admin.request("POST", path, _body(body))))

    def create_annotation(self, company_slug: str, run_uuid: str, body: TimePlanAnnotationInput) -> TimePlanAnnotation:
        path = self._resource(f"/time-plans/runs/{run_uuid}/annotations", company_slug)
        return TimePlanAnnotation.from_payload(_payload(self._admin.request("POST", path, _body(body))))

    def list_annotations(
        self, company_slug: str, run_uuid: str, limit: int | None = None
    ) -> TimePlanAnnotationListResponse:
        path = self._resource(f"/time-plans/runs/{run_uuid}/annotations", company_slug, limit)
        return TimePlanAnnotationListResponse.from_payload(self._admin.request("GET", path))

    def correct_annotation(
        self, company_slug: str, run_uuid: str, annotation_uuid: str, body: TimePlanAnnotationInput
    ) -> TimePlanAnnotation:
        path = self._resource(f"/time-plans/runs/{run_uuid}/annotations/{annotation_uuid}/corrections", company_slug)
        return TimePlanAnnotation.from_payload(_payload(self._admin.request("POST", path, _body(body))))

    def redact_annotation(
        self, company_slug: str, run_uuid: str, annotation_uuid: str, request: TimePlanRedactionRequest
    ) -> None:
        self._admin.request(
            "POST",
            self._resource(f"/time-plans/runs/{run_uuid}/annotations/{annotation_uuid}/redact", company_slug),
            _body(request),
        )

    @staticmethod
    def _collection(path: str, company_slug: str, limit: int | None = None) -> str:
        query = f"companySlug={quote_path(company_slug)}"
        if limit is not None:
            query += f"&limit={limit}"
        return f"{path}?{query}"

    @classmethod
    def _resource(cls, path: str, company_slug: str, limit: int | None = None) -> str:
        segments = path.split("/")
        encoded = "/".join(segment if index == 0 else quote_path(segment) for index, segment in enumerate(segments))
        return cls._collection(encoded, company_slug, limit)
