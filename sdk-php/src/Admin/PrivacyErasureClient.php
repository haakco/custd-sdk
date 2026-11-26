<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Privacy\PrivacyErasureCreateRequest;
use HaakCo\Custd\Admin\Privacy\PrivacyErasureForceResponse;
use HaakCo\Custd\Admin\Privacy\PrivacyErasureListResponse;
use HaakCo\Custd\Admin\Privacy\PrivacyErasureResponse;

/**
 * PrivacyErasureClient owns per-tenant subject erasure requests. Erasures are forward-only: there is no cancel or
 * retry surface because the server contract has none. force is the bounded operator action. A system
 * administrator names the tenant with companySlug.
 */
final class PrivacyErasureClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Create privacy erasure request.
     */
    public function create(PrivacyErasureCreateRequest $request): PrivacyErasureResponse
    {
        return PrivacyErasureResponse::fromPayload($this->http->object('POST', '/api/v1/admin/privacy/erasures', [], $request->serialise()));
    }

    /**
     * List privacy erasure requests.
     */
    public function list(?string $companySlug = null): PrivacyErasureListResponse
    {
        return PrivacyErasureListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/privacy/erasures', ['companySlug' => $companySlug], null));
    }

    /**
     * Get privacy erasure request.
     */
    public function get(string $requestUuid, ?string $companySlug = null): PrivacyErasureResponse
    {
        return PrivacyErasureResponse::fromPayload($this->http->object('GET', '/api/v1/admin/privacy/erasures/' . rawurlencode($requestUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Force privacy erasure request.
     */
    public function force(string $requestUuid, ?string $companySlug = null): PrivacyErasureForceResponse
    {
        return PrivacyErasureForceResponse::fromPayload($this->http->object('POST', '/api/v1/admin/privacy/erasures/' . rawurlencode($requestUuid) . '/force', ['companySlug' => $companySlug], null));
    }
}
