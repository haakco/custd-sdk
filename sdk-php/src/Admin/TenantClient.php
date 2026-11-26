<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Offboarding\TenantOffboardingReceipt;
use HaakCo\Custd\Admin\Tenant\DataSpaceEntitlementState;
use HaakCo\Custd\Admin\Tenant\DataSpaceEntitlementUpdateRequest;
use HaakCo\Custd\Admin\Tenant\StorageLimit;
use HaakCo\Custd\Admin\Tenant\StorageLimitUpdateRequest;
use HaakCo\Custd\Admin\Tenant\Tenant;
use HaakCo\Custd\Admin\Tenant\TenantCreateRequest;
use HaakCo\Custd\Admin\Tenant\TenantListResponse;

/**
 * TenantClient creates, reads and retires tenants and sets their storage limit and data-space entitlement.
 */
final class TenantClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Create a tenant.
     */
    public function create(TenantCreateRequest $request): Tenant
    {
        return Tenant::fromPayload($this->http->object('POST', '/api/v1/admin/tenants', [], $request->serialise()));
    }

    /**
     * List tenants.
     */
    public function list(): TenantListResponse
    {
        return TenantListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/tenants', [], null));
    }

    /**
     * Get a tenant.
     */
    public function get(string $slug): Tenant
    {
        return Tenant::fromPayload($this->http->object('GET', '/api/v1/admin/tenants/' . rawurlencode($slug), [], null));
    }

    /**
     * Delete a tenant.
     */
    public function delete(string $slug): void
    {
        $this->http->none('DELETE', '/api/v1/admin/tenants/' . rawurlencode($slug), [], null);
    }

    /**
     * Finalize a cleaned tenant.
     */
    public function finalize(string $slug, int $companyId): void
    {
        $this->http->none('POST', '/api/v1/admin/tenants/' . rawurlencode($slug) . '/finalize', ['companyId' => $companyId], null);
    }

    /**
     * Run a deleted tenant's historical cleanup; repeat the same Idempotency-Key to retry one cleanup.
     */
    public function historicalCleanup(string $slug, int $companyId, string $idempotencyKey): TenantOffboardingReceipt
    {
        return TenantOffboardingReceipt::fromPayload($this->http->object('POST', '/api/v1/admin/tenants/' . rawurlencode($slug) . '/historical-cleanup', ['companyId' => $companyId], null, $idempotencyKey));
    }

    /**
     * Get tenant data space entitlement.
     */
    public function getDataSpaceEntitlement(string $slug): DataSpaceEntitlementState
    {
        return DataSpaceEntitlementState::fromPayload($this->http->object('GET', '/api/v1/admin/tenants/' . rawurlencode($slug) . '/data-space-entitlement', [], null));
    }

    /**
     * Update tenant data space entitlement.
     */
    public function updateDataSpaceEntitlement(string $slug, DataSpaceEntitlementUpdateRequest $request): DataSpaceEntitlementState
    {
        return DataSpaceEntitlementState::fromPayload($this->http->object('PUT', '/api/v1/admin/tenants/' . rawurlencode($slug) . '/data-space-entitlement', [], $request->serialise()));
    }

    /**
     * Update tenant storage limit.
     */
    public function updateStorageLimit(string $slug, StorageLimitUpdateRequest $request): StorageLimit
    {
        return StorageLimit::fromPayload($this->http->object('PUT', '/api/v1/admin/tenants/' . rawurlencode($slug) . '/storage-limit', [], $request->serialise()));
    }
}
