<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Retention\RetentionPolicy;
use HaakCo\Custd\Admin\Retention\RetentionPolicyListResponse;
use HaakCo\Custd\Admin\Retention\RetentionPolicyUpsertRequest;
use HaakCo\Custd\Admin\Retention\RetentionRunPreview;
use HaakCo\Custd\Admin\Retention\RetentionRunsListResponse;

/**
 * RetentionClient owns per-tenant retention policies. Effective-tenant authority is enforced server-side;
 * wrong-tenant requests return 404. Preview and apply estimates are server-issued: surface them verbatim and never
 * round or re-derive the per-store counts.
 */
final class RetentionClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List bounded retention policies.
     */
    public function list(): RetentionPolicyListResponse
    {
        return RetentionPolicyListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/retention/policies', [], null));
    }

    /**
     * Get a tenant's bounded retention policies.
     */
    public function get(string $tenantSlug): RetentionPolicyListResponse
    {
        return RetentionPolicyListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/retention/policies/' . rawurlencode($tenantSlug), [], null));
    }

    /**
     * Create or replace a tenant's bounded retention policy.
     */
    public function upsert(string $tenantSlug, RetentionPolicyUpsertRequest $request): RetentionPolicy
    {
        return RetentionPolicy::fromPayload($this->http->object('PUT', '/api/v1/admin/retention/policies/' . rawurlencode($tenantSlug), [], $request->serialise()));
    }

    /**
     * Delete a tenant's bounded retention policy.
     */
    public function delete(string $tenantSlug): void
    {
        $this->http->none('DELETE', '/api/v1/admin/retention/policies/' . rawurlencode($tenantSlug), [], null);
    }

    /**
     * Preview a tenant retention run.
     */
    public function preview(string $tenantSlug): RetentionRunPreview
    {
        return RetentionRunPreview::fromPayload($this->http->object('POST', '/api/v1/admin/retention/policies/' . rawurlencode($tenantSlug) . '/preview', [], null));
    }

    /**
     * Apply a tenant retention run.
     */
    public function apply(string $tenantSlug): RetentionRunPreview
    {
        return RetentionRunPreview::fromPayload($this->http->object('POST', '/api/v1/admin/retention/policies/' . rawurlencode($tenantSlug) . '/apply', [], null));
    }

    /**
     * List tenant retention runs.
     */
    public function listRuns(string $tenantSlug, ?int $limit = null, ?int $offset = null): RetentionRunsListResponse
    {
        return RetentionRunsListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/retention/policies/' . rawurlencode($tenantSlug) . '/runs', ['limit' => $limit, 'offset' => $offset], null));
    }
}
