<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Site\Site;
use HaakCo\Custd\Admin\Site\SiteCreateRequest;
use HaakCo\Custd\Admin\Site\SiteCreateResponse;
use HaakCo\Custd\Admin\Site\SiteListResponse;
use HaakCo\Custd\Admin\Site\SiteUpdateRequest;
use HaakCo\Custd\Admin\Site\SiteWriteKeyResponse;

/**
 * SiteClient creates, lists, changes and deletes the tenant's Sites and rotates their write keys.
 */
final class SiteClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Update site config.
     */
    public function update(string $siteUuid, SiteUpdateRequest $request): Site
    {
        return Site::fromPayload($this->http->object('PATCH', '/api/v1/admin/sites/' . rawurlencode($siteUuid), [], $request->serialise()));
    }

    /**
     * Create a site.
     */
    public function create(SiteCreateRequest $request): SiteCreateResponse
    {
        return SiteCreateResponse::fromPayload($this->http->object('POST', '/api/v1/admin/sites', [], $request->serialise()));
    }

    /**
     * List sites.
     */
    public function list(): SiteListResponse
    {
        return SiteListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/sites', [], null));
    }

    /**
     * Get a site.
     */
    public function get(string $siteUuid): Site
    {
        return Site::fromPayload($this->http->object('GET', '/api/v1/admin/sites/' . rawurlencode($siteUuid), [], null));
    }

    /**
     * Delete a site.
     */
    public function delete(string $siteUuid): void
    {
        $this->http->none('DELETE', '/api/v1/admin/sites/' . rawurlencode($siteUuid), [], null);
    }

    /**
     * Rotate site write key.
     */
    public function rotateWriteKey(string $siteUuid): SiteWriteKeyResponse
    {
        return SiteWriteKeyResponse::fromPayload($this->http->object('POST', '/api/v1/admin/sites/' . rawurlencode($siteUuid) . '/rotate-write-key', [], null));
    }
}
