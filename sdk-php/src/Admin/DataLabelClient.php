<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\DataLabel\DataLabelAssignmentListResponse;
use HaakCo\Custd\Admin\DataLabel\DataLabelCatalogueResponse;
use HaakCo\Custd\Admin\DataLabel\DataLabelDefinition;
use HaakCo\Custd\Admin\DataLabel\DataLabelDefinitionCreateRequest;
use HaakCo\Custd\Admin\DataLabel\DataLabelDefinitionListResponse;
use HaakCo\Custd\Admin\DataLabel\DataLabelDefinitionUpdateRequest;
use HaakCo\Custd\Admin\DataLabel\DataLabelUsageListResponse;
use HaakCo\Custd\Admin\DataLabel\DataLabelValue;
use HaakCo\Custd\Admin\DataLabel\DataLabelValueCreateRequest;
use HaakCo\Custd\Admin\DataLabel\DataLabelValueUpdateRequest;
use HaakCo\Custd\Admin\DataLabel\EventTypeDataLabelDefaultRequest;
use HaakCo\Custd\Admin\DataLabel\SchemaFieldDataLabelAssignmentRequest;

/**
 * DataLabelClient keeps the tenant's data label definitions and values, their defaults on event types and their
 * assignments to schema fields, and reads the label catalogue and usage. A system administrator names the tenant
 * with companySlug.
 */
final class DataLabelClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List data labels.
     */
    public function list(?bool $includeDisabled = null, ?string $companySlug = null): DataLabelDefinitionListResponse
    {
        return DataLabelDefinitionListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/data-labels', ['includeDisabled' => $includeDisabled, 'companySlug' => $companySlug], null));
    }

    /**
     * Get data-label catalogue.
     */
    public function catalogue(?bool $includeDisabled = null, ?string $companySlug = null): DataLabelCatalogueResponse
    {
        return DataLabelCatalogueResponse::fromPayload($this->http->object('GET', '/api/v1/admin/data-labels/catalogue', ['includeDisabled' => $includeDisabled, 'companySlug' => $companySlug], null));
    }

    /**
     * Get data label.
     */
    public function get(string $definitionUuid, ?bool $includeDisabled = null, ?string $companySlug = null): DataLabelDefinition
    {
        return DataLabelDefinition::fromPayload($this->http->object('GET', '/api/v1/admin/data-labels/' . rawurlencode($definitionUuid), ['includeDisabled' => $includeDisabled, 'companySlug' => $companySlug], null));
    }

    /**
     * Create data label.
     */
    public function create(DataLabelDefinitionCreateRequest $request, ?string $companySlug = null): DataLabelDefinition
    {
        return DataLabelDefinition::fromPayload($this->http->object('POST', '/api/v1/admin/data-labels', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Update data label metadata.
     */
    public function update(string $definitionUuid, DataLabelDefinitionUpdateRequest $request, ?string $companySlug = null): DataLabelDefinition
    {
        return DataLabelDefinition::fromPayload($this->http->object('PATCH', '/api/v1/admin/data-labels/' . rawurlencode($definitionUuid), ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Disable data label.
     */
    public function disable(string $definitionUuid, ?string $companySlug = null): void
    {
        $this->http->none('POST', '/api/v1/admin/data-labels/' . rawurlencode($definitionUuid) . '/disable', ['companySlug' => $companySlug], null);
    }

    /**
     * Create data-label value.
     */
    public function createValue(string $definitionUuid, DataLabelValueCreateRequest $request, ?string $companySlug = null): DataLabelValue
    {
        return DataLabelValue::fromPayload($this->http->object('POST', '/api/v1/admin/data-labels/' . rawurlencode($definitionUuid) . '/values', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Update data-label value.
     */
    public function updateValue(string $valueUuid, DataLabelValueUpdateRequest $request, ?string $companySlug = null): DataLabelValue
    {
        return DataLabelValue::fromPayload($this->http->object('PATCH', '/api/v1/admin/data-label-values/' . rawurlencode($valueUuid), ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Disable data-label value.
     */
    public function disableValue(string $valueUuid, ?string $companySlug = null): void
    {
        $this->http->none('POST', '/api/v1/admin/data-label-values/' . rawurlencode($valueUuid) . '/disable', ['companySlug' => $companySlug], null);
    }

    /**
     * List data-label usage.
     */
    public function listUsage(?string $companySlug = null): DataLabelUsageListResponse
    {
        return DataLabelUsageListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/data-labels/usage', ['companySlug' => $companySlug], null));
    }

    /**
     * List data-label assignments.
     */
    public function listAssignments(?string $companySlug = null): DataLabelAssignmentListResponse
    {
        return DataLabelAssignmentListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/data-label-assignments', ['companySlug' => $companySlug], null));
    }

    /**
     * Set event-type data-label default.
     */
    public function setEventTypeDefault(string $slug, string $definitionUuid, EventTypeDataLabelDefaultRequest $request, ?string $companySlug = null): void
    {
        $this->http->none('PUT', '/api/v1/admin/event-types/' . rawurlencode($slug) . '/data-label-defaults/' . rawurlencode($definitionUuid), ['companySlug' => $companySlug], $request->serialise());
    }

    /**
     * Remove event-type data-label default.
     */
    public function removeEventTypeDefault(string $slug, string $definitionUuid, ?string $companySlug = null): void
    {
        $this->http->none('DELETE', '/api/v1/admin/event-types/' . rawurlencode($slug) . '/data-label-defaults/' . rawurlencode($definitionUuid), ['companySlug' => $companySlug], null);
    }

    /**
     * Set schema-field data label.
     */
    public function setSchemaFieldAssignment(string $schemaUuid, SchemaFieldDataLabelAssignmentRequest $request, ?string $companySlug = null): void
    {
        $this->http->none('PUT', '/api/v1/admin/event-schemas/' . rawurlencode($schemaUuid) . '/field-data-labels', ['companySlug' => $companySlug], $request->serialise());
    }

    /**
     * Remove schema-field data label.
     */
    public function removeSchemaFieldAssignment(string $assignmentUuid, ?string $companySlug = null): void
    {
        $this->http->none('DELETE', '/api/v1/admin/data-label-assignments/schema-fields/' . rawurlencode($assignmentUuid), ['companySlug' => $companySlug], null);
    }
}
