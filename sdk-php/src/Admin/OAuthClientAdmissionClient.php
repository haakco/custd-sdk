<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\OAuth\OAuthClientAdmissionApproveRequest;
use HaakCo\Custd\Admin\OAuth\OAuthClientAdmissionListResponse;
use HaakCo\Custd\Admin\OAuth\OAuthClientAdmissionMutationResponse;
use HaakCo\Custd\Admin\OAuth\OAuthClientAdmissionReviewRequest;
use HaakCo\Custd\Admin\OAuth\OAuthClientAdmissionReviewResponse;
use HaakCo\Custd\Admin\OAuth\OAuthClientAdmissionRevokeRequest;

/**
 * OAuthClientAdmissionClient reviews, approves and revokes the OAuth client admissions awaiting a tenant
 * administrator.
 */
final class OAuthClientAdmissionClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List external application admissions.
     */
    public function list(string $companySlug): OAuthClientAdmissionListResponse
    {
        return OAuthClientAdmissionListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/oauth-client-admissions', ['companySlug' => $companySlug], null));
    }

    /**
     * Approve reviewed external application access.
     */
    public function approve(string $admissionUuid, OAuthClientAdmissionApproveRequest $request): OAuthClientAdmissionMutationResponse
    {
        return OAuthClientAdmissionMutationResponse::fromPayload($this->http->object('POST', '/api/v1/admin/oauth-client-admissions/' . rawurlencode($admissionUuid) . '/approve', [], $request->serialise()));
    }

    /**
     * Review external application access.
     */
    public function review(string $admissionUuid, OAuthClientAdmissionReviewRequest $request): OAuthClientAdmissionReviewResponse
    {
        return OAuthClientAdmissionReviewResponse::fromPayload($this->http->object('POST', '/api/v1/admin/oauth-client-admissions/' . rawurlencode($admissionUuid) . '/review', [], $request->serialise()));
    }

    /**
     * Revoke external application access.
     */
    public function revoke(string $admissionUuid, OAuthClientAdmissionRevokeRequest $request): OAuthClientAdmissionMutationResponse
    {
        return OAuthClientAdmissionMutationResponse::fromPayload($this->http->object('POST', '/api/v1/admin/oauth-client-admissions/' . rawurlencode($admissionUuid) . '/revoke', [], $request->serialise()));
    }
}
