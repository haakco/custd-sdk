"""Operator schema actions on the admin API.

``client.admin.schema_actions`` validates, dry-runs, registers and enables a tenant's event
schema versions through ``/api/v1/admin/schema`` and audits the tenant's registered schemas. The
tenant's own registry calls live on ``client.admin.schemas``.
"""

from __future__ import annotations

from typing import Any, TypedDict

from ._wire import decode, request
from .client import AdminClient, quote_path


class SchemaExampleValidationSummary(TypedDict):
    deltas: int
    discovered: int
    issueCodes: list[str]
    run: int
    sameAccept: int
    sameReject: int


class SchemaCompileResult(TypedDict):
    issues: list[str]
    valid: bool


SchemaAuditResult = TypedDict(
    "SchemaAuditResult",
    {
        "class": str,
        "dialect": str,
        "eventTypeSlug": str,
        "exampleValidation": SchemaExampleValidationSummary,
        "issueCodes": list[str],
        "legacyCompile": SchemaCompileResult,
        "recommendedAction": str,
        "schemaChecksum": str,
        "sharedCompile": SchemaCompileResult,
        "tenantSlug": str,
        "version": str,
    },
)


class SchemaAuditSummary(TypedDict):
    blocked: int
    compatible: int
    needsMigration: int
    total: int


class SchemaAuditResponse(TypedDict):
    schemas: list[SchemaAuditResult]
    summary: SchemaAuditSummary


class AdminSchemaValidateRequest(TypedDict):
    dialect: str
    eventTypeSlug: str
    schemaJson: str
    tenantSlug: str


class AdminSchemaIssue(TypedDict):
    code: str
    message: str
    path: str


class AdminSchemaValidateResult(TypedDict):
    issues: list[AdminSchemaIssue]
    suggestedAction: str
    valid: bool


class AdminSchemaDryRunRequest(TypedDict):
    dialect: str
    eventTypeSlug: str
    samples: list[Any]
    schemaJson: str
    tenantSlug: str


class AdminSchemaDryRunResult(TypedDict):
    failed: int
    issues: list[AdminSchemaIssue]
    passed: int


class AdminSchemaEnableRequest(TypedDict):
    enabledAt: str
    eventTypeSlug: str
    tenantSlug: str
    version: str


class AdminSchemaRegister(TypedDict):
    checksum: str
    dialect: str
    enabled: bool
    eventTypeSlug: str
    schemaJson: str
    tenantSlug: str
    version: str


class SchemaActionAdminClient:
    """Validates, registers, enables and audits a tenant's event schemas as an operator."""

    def __init__(self, admin: AdminClient) -> None:
        self._admin = admin

    def audit(self, tenant_slug: str) -> SchemaAuditResponse:
        """Audit active tenant schemas."""
        return decode(
            SchemaAuditResponse,
            request(self._admin, "GET", "/api/v1/admin/schema/audit", query={"tenantSlug": tenant_slug}),
        )

    def validate(self, body: AdminSchemaValidateRequest) -> AdminSchemaValidateResult:
        """Validate a candidate schema."""
        return decode(
            AdminSchemaValidateResult, request(self._admin, "POST", "/api/v1/admin/schema/validate", body=dict(body))
        )

    def dry_run(self, tenant_slug: str, event_type: str, body: AdminSchemaDryRunRequest) -> AdminSchemaDryRunResult:
        """Dry-run a candidate schema against sample events."""
        return decode(
            AdminSchemaDryRunResult,
            request(
                self._admin,
                "POST",
                f"/api/v1/admin/schema/{quote_path(tenant_slug)}/{quote_path(event_type)}/dry-run",
                body=dict(body),
            ),
        )

    def enable_version(self, tenant_slug: str, event_type: str, body: AdminSchemaEnableRequest) -> None:
        """Enable a registered schema version."""
        request(
            self._admin,
            "POST",
            f"/api/v1/admin/schema/{quote_path(tenant_slug)}/{quote_path(event_type)}/enable",
            body=dict(body),
        )

    def register(self, tenant_slug: str, event_type: str, body: AdminSchemaRegister) -> None:
        """Register a schema version."""
        request(
            self._admin,
            "POST",
            f"/api/v1/admin/schema/{quote_path(tenant_slug)}/{quote_path(event_type)}/register",
            body=dict(body),
        )
