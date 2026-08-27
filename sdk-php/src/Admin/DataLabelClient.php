<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

final class DataLabelClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /** @return array<string, mixed> */
    public function list(bool $includeDisabled = false): array
    {
        $query = $includeDisabled ? "?includeDisabled=true" : "";
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/data-labels{$query}") ?? ["definitions" => []];
    }

    /** @return array<string, mixed> */
    public function catalogue(bool $includeDisabled = false): array
    {
        $query = $includeDisabled ? "?includeDisabled=true" : "";
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/data-labels/catalogue{$query}") ?? [];
    }

    /** @return array<string, mixed> */
    public function get(string $uuid, bool $includeDisabled = false): array
    {
        $query = $includeDisabled ? "?includeDisabled=true" : "";
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/data-labels/" . rawurlencode($uuid) . $query) ?? [];
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function create(array $body): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "POST", "/data-labels", $body) ?? [];
    }
    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function update(string $uuid, array $body): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "PATCH", "/data-labels/" . rawurlencode($uuid), $body) ?? [];
    }
    public function disable(string $uuid): void
    {
        Http::request($this->baseUrl, $this->token, $this->transport, "POST", "/data-labels/" . rawurlencode($uuid) . "/disable");
    }
    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function createValue(string $uuid, array $body): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "POST", "/data-labels/" . rawurlencode($uuid) . "/values", $body) ?? [];
    }
    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function updateValue(string $uuid, array $body): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "PATCH", "/data-label-values/" . rawurlencode($uuid), $body) ?? [];
    }
    public function disableValue(string $uuid): void
    {
        Http::request($this->baseUrl, $this->token, $this->transport, "POST", "/data-label-values/" . rawurlencode($uuid) . "/disable");
    }
    /** @return array<string, mixed> */
    public function listUsage(): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/data-labels/usage") ?? ["usage" => []];
    }
    /** @return array<string, mixed> */
    public function listAssignments(): array
    {
        return Http::request($this->baseUrl, $this->token, $this->transport, "GET", "/data-label-assignments") ?? ["eventTypeDefaults" => [], "schemaFieldAssignments" => []];
    }
    /** @param array<string, mixed> $body */
    public function setEventTypeDefault(string $slug, string $definitionUuid, array $body): void
    {
        Http::request($this->baseUrl, $this->token, $this->transport, "PUT", "/event-types/" . rawurlencode($slug) . "/data-label-defaults/" . rawurlencode($definitionUuid), $body);
    }
    public function removeEventTypeDefault(string $slug, string $definitionUuid): void
    {
        Http::request($this->baseUrl, $this->token, $this->transport, "DELETE", "/event-types/" . rawurlencode($slug) . "/data-label-defaults/" . rawurlencode($definitionUuid));
    }
    /** @param array<string, mixed> $body */
    public function setSchemaFieldAssignment(string $schemaUuid, array $body): void
    {
        Http::request($this->baseUrl, $this->token, $this->transport, "PUT", "/event-schemas/" . rawurlencode($schemaUuid) . "/field-data-labels", $body);
    }
    public function removeSchemaFieldAssignment(string $assignmentUuid): void
    {
        Http::request($this->baseUrl, $this->token, $this->transport, "DELETE", "/data-label-assignments/schema-fields/" . rawurlencode($assignmentUuid));
    }
}
