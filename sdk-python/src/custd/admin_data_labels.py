from __future__ import annotations

from typing import NotRequired, TypedDict, cast

from .client import AdminClient, quote_path


class DataLabelValue(TypedDict):
    uuid: str
    value: str
    displayName: str
    description: str
    enabled: bool
    createdAt: str
    updatedAt: str


class DataLabelDefinition(TypedDict):
    uuid: str
    authority: str
    key: str
    displayName: str
    description: str
    allowedScopes: list[str]
    sensitivity: str
    intendedUse: str
    synonyms: list[str]
    propagationPolicy: str
    enabled: bool
    createdAt: str
    updatedAt: str
    values: list[DataLabelValue]


class DataLabelDefinitionCreateRequest(TypedDict):
    key: str
    displayName: str
    description: str
    allowedScopes: list[str]
    sensitivity: str
    intendedUse: str
    synonyms: list[str]
    propagationPolicy: str


class DataLabelDefinitionUpdateRequest(TypedDict):
    displayName: str
    description: str
    allowedScopes: list[str]
    sensitivity: str
    intendedUse: str
    synonyms: list[str]
    propagationPolicy: str


class DataLabelValueCreateRequest(TypedDict):
    value: str
    displayName: str
    description: str


class DataLabelValueUpdateRequest(TypedDict):
    displayName: str
    description: str


class EventTypeDataLabelDefaultRequest(TypedDict):
    valueUuid: str


class SchemaFieldDataLabelAssignmentRequest(TypedDict):
    fieldPath: str
    definitionUuid: str
    valueUuid: str


class DataLabelDefinitionListResponse(TypedDict):
    definitions: list[DataLabelDefinition]


class DataLabelUsage(TypedDict):
    definitionUuid: str
    valueUuid: str
    eventTypeDefaults: int
    schemaFieldAssignments: int
    total: int


class DataLabelUsageListResponse(TypedDict):
    usage: list[DataLabelUsage]


class EventTypeDataLabelDefault(TypedDict):
    eventTypeSlug: str
    definitionUuid: str
    valueUuid: str


class SchemaFieldDataLabelAssignment(TypedDict):
    assignmentUuid: str
    schemaUuid: str
    fieldPath: str
    definitionUuid: str
    valueUuid: str


class DataLabelAssignmentListResponse(TypedDict):
    eventTypeDefaults: list[EventTypeDataLabelDefault]
    schemaFieldAssignments: list[SchemaFieldDataLabelAssignment]


class DescriptiveDataLabel(TypedDict):
    definitionUuid: str
    key: str
    displayName: str
    description: NotRequired[str]
    sensitivity: NotRequired[str]
    intendedUse: NotRequired[str]
    synonyms: NotRequired[list[str]]
    enabled: bool


class DataLabelCatalogue(TypedDict):
    labels: list[DescriptiveDataLabel]


class DataLabelCatalogueAssignment(TypedDict):
    scope: str
    eventTypeSlug: NotRequired[str]
    schemaUuid: NotRequired[str]
    fieldPath: NotRequired[str]
    definitionUuid: str
    valueUuid: str


class DataLabelCatalogueDataset(TypedDict):
    displayName: str
    unit: NotRequired[str]
    definitionUuid: NotRequired[str]
    valueUuids: NotRequired[list[str]]


class DataLabelCataloguePack(TypedDict):
    displayName: str
    enabled: bool
    datasets: list[DataLabelCatalogueDataset]


class DataLabelCatalogueResponse(TypedDict):
    catalogue: DataLabelCatalogue
    assignments: list[DataLabelCatalogueAssignment]
    reportingPacks: list[DataLabelCataloguePack]
    fingerprint: str


class DataLabelAdminClient:
    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    @staticmethod
    def _include_disabled(include: bool) -> str:
        return "?includeDisabled=true" if include else ""

    def list(self, include_disabled: bool = False) -> DataLabelDefinitionListResponse:
        return cast(
            DataLabelDefinitionListResponse,
            self._admin.request("GET", "/data-labels" + self._include_disabled(include_disabled)),
        )

    def catalogue(self, include_disabled: bool = False) -> DataLabelCatalogueResponse:
        return cast(
            DataLabelCatalogueResponse,
            self._admin.request("GET", "/data-labels/catalogue" + self._include_disabled(include_disabled)),
        )

    def get(self, uuid: str, include_disabled: bool = False) -> DataLabelDefinition:
        return cast(
            DataLabelDefinition,
            self._admin.request("GET", f"/data-labels/{quote_path(uuid)}{self._include_disabled(include_disabled)}"),
        )

    def create(self, body: DataLabelDefinitionCreateRequest) -> DataLabelDefinition:
        return cast(DataLabelDefinition, self._admin.request("POST", "/data-labels", dict(body)))

    def update(self, uuid: str, body: DataLabelDefinitionUpdateRequest) -> DataLabelDefinition:
        return cast(DataLabelDefinition, self._admin.request("PATCH", f"/data-labels/{quote_path(uuid)}", dict(body)))

    def disable(self, uuid: str) -> None:
        self._admin.request("POST", f"/data-labels/{quote_path(uuid)}/disable")

    def create_value(self, definition_uuid: str, body: DataLabelValueCreateRequest) -> DataLabelValue:
        return cast(
            DataLabelValue,
            self._admin.request("POST", f"/data-labels/{quote_path(definition_uuid)}/values", dict(body)),
        )

    def update_value(self, value_uuid: str, body: DataLabelValueUpdateRequest) -> DataLabelValue:
        return cast(
            DataLabelValue, self._admin.request("PATCH", f"/data-label-values/{quote_path(value_uuid)}", dict(body))
        )

    def disable_value(self, value_uuid: str) -> None:
        self._admin.request("POST", f"/data-label-values/{quote_path(value_uuid)}/disable")

    def list_usage(self) -> DataLabelUsageListResponse:
        return cast(DataLabelUsageListResponse, self._admin.request("GET", "/data-labels/usage"))

    def list_assignments(self) -> DataLabelAssignmentListResponse:
        return cast(DataLabelAssignmentListResponse, self._admin.request("GET", "/data-label-assignments"))

    def set_event_type_default(self, slug: str, definition_uuid: str, body: EventTypeDataLabelDefaultRequest) -> None:
        self._admin.request(
            "PUT", f"/event-types/{quote_path(slug)}/data-label-defaults/{quote_path(definition_uuid)}", dict(body)
        )

    def remove_event_type_default(self, slug: str, definition_uuid: str) -> None:
        self._admin.request(
            "DELETE", f"/event-types/{quote_path(slug)}/data-label-defaults/{quote_path(definition_uuid)}"
        )

    def set_schema_field_assignment(self, schema_uuid: str, body: SchemaFieldDataLabelAssignmentRequest) -> None:
        self._admin.request("PUT", f"/event-schemas/{quote_path(schema_uuid)}/field-data-labels", dict(body))

    def remove_schema_field_assignment(self, assignment_uuid: str) -> None:
        self._admin.request("DELETE", f"/data-label-assignments/schema-fields/{quote_path(assignment_uuid)}")
