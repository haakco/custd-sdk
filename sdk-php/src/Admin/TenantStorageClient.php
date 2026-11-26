<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\TenantStorage\TenantStorageLocationCreateBody;
use HaakCo\Custd\Admin\TenantStorage\TenantStorageLocationListResponse;
use HaakCo\Custd\Admin\TenantStorage\TenantStorageLocationView;

/**
 * TenantStorageClient registers, reads and revokes the tenant's storage locations. Custd generates a location's
 * routing, identity, prefix and write state, so create() sends an empty body. The tenant comes from the
 * credential.
 */
final class TenantStorageClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List tenant storage locations.
     */
    public function list(): TenantStorageLocationListResponse
    {
        return TenantStorageLocationListResponse::fromPayload($this->http->object('GET', '/api/v1/tenant-storage-locations', [], null));
    }

    /**
     * Create a tenant storage location.
     */
    public function create(TenantStorageLocationCreateBody $request = new TenantStorageLocationCreateBody()): TenantStorageLocationView
    {
        return TenantStorageLocationView::fromPayload($this->http->object('POST', '/api/v1/tenant-storage-locations', [], $request->serialise()));
    }

    /**
     * Get a tenant storage location.
     */
    public function get(int $id): TenantStorageLocationView
    {
        return TenantStorageLocationView::fromPayload($this->http->object('GET', '/api/v1/tenant-storage-locations/' . rawurlencode((string) $id), [], null));
    }

    /**
     * Revoke a tenant storage location.
     */
    public function revoke(int $id): void
    {
        $this->http->none('DELETE', '/api/v1/tenant-storage-locations/' . rawurlencode((string) $id), [], null);
    }
}
