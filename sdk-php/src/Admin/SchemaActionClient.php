<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SchemaAction\SchemaActionDryRunRequest;
use HaakCo\Custd\Admin\SchemaAction\SchemaActionDryRunResult;
use HaakCo\Custd\Admin\SchemaAction\SchemaActionEnableRequest;
use HaakCo\Custd\Admin\SchemaAction\SchemaActionRegisterRequest;
use HaakCo\Custd\Admin\SchemaAction\SchemaActionValidateRequest;
use HaakCo\Custd\Admin\SchemaAction\SchemaActionValidateResult;
use HaakCo\Custd\Admin\SchemaAction\SchemaAuditResponse;

/**
 * SchemaActionClient audits, validates, dry-runs, registers and enables a tenant's event schema versions.
 */
final class SchemaActionClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Audit active tenant schemas.
     */
    public function audit(string $tenantSlug): SchemaAuditResponse
    {
        return SchemaAuditResponse::fromPayload($this->http->object('GET', '/api/v1/admin/schema/audit', ['tenantSlug' => $tenantSlug], null));
    }

    /**
     * Validate a candidate schema.
     */
    public function validate(SchemaActionValidateRequest $request): SchemaActionValidateResult
    {
        return SchemaActionValidateResult::fromPayload($this->http->object('POST', '/api/v1/admin/schema/validate', [], $request->serialise()));
    }

    /**
     * Dry-run a candidate schema against sample events.
     */
    public function dryRun(string $tenantSlug, string $eventType, SchemaActionDryRunRequest $request): SchemaActionDryRunResult
    {
        return SchemaActionDryRunResult::fromPayload($this->http->object('POST', '/api/v1/admin/schema/' . rawurlencode($tenantSlug) . '/' . rawurlencode($eventType) . '/dry-run', [], $request->serialise()));
    }

    /**
     * Enable a registered schema version.
     */
    public function enableVersion(string $tenantSlug, string $eventType, SchemaActionEnableRequest $request): void
    {
        $this->http->none('POST', '/api/v1/admin/schema/' . rawurlencode($tenantSlug) . '/' . rawurlencode($eventType) . '/enable', [], $request->serialise());
    }

    /**
     * Register a schema version.
     */
    public function registerVersion(string $tenantSlug, string $eventType, SchemaActionRegisterRequest $request): void
    {
        $this->http->none('POST', '/api/v1/admin/schema/' . rawurlencode($tenantSlug) . '/' . rawurlencode($eventType) . '/register', [], $request->serialise());
    }
}
