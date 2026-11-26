<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\OAuth\OAuthClientCreateRequest;
use HaakCo\Custd\Admin\OAuth\OAuthClientCreateResponse;
use HaakCo\Custd\Admin\OAuth\OAuthClientListResponse;
use HaakCo\Custd\Admin\OAuth\OAuthClientRecord;
use HaakCo\Custd\Admin\OAuth\OAuthClientSecretResponse;
use HaakCo\Custd\Admin\OAuth\OAuthClientUpdateScopesRequest;

/**
 * OAuthClient creates, lists, rotates and retires the tenant's OAuth clients and changes their scopes.
 */
final class OAuthClient
{
    /**
     * The purpose of a credential that manages one existing Site's Site Insights domains. Pass it
     * as purposeProfile together with siteUuid to create().
     */
    public const PURPOSE_SITE_INSIGHTS = 'site_insights';

    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Create an OAuth client.
     */
    public function create(OAuthClientCreateRequest $request, string $idempotencyKey): OAuthClientCreateResponse
    {
        return OAuthClientCreateResponse::fromPayload($this->http->object('POST', '/api/v1/admin/oauth-clients', [], $request->serialise(), $idempotencyKey));
    }

    /**
     * List visible OAuth clients.
     */
    public function list(): OAuthClientListResponse
    {
        return OAuthClientListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/oauth-clients', [], null));
    }

    /**
     * Get an OAuth client.
     */
    public function get(string $clientId): OAuthClientRecord
    {
        return OAuthClientRecord::fromPayload($this->http->object('GET', '/api/v1/admin/oauth-clients/' . rawurlencode($clientId), [], null));
    }

    /**
     * Delete an OAuth client.
     */
    public function delete(string $clientId): void
    {
        $this->http->none('DELETE', '/api/v1/admin/oauth-clients/' . rawurlencode($clientId), [], null);
    }

    /**
     * Rotate an OAuth client secret.
     */
    public function rotateSecret(string $clientId, string $idempotencyKey): OAuthClientSecretResponse
    {
        return OAuthClientSecretResponse::fromPayload($this->http->object('POST', '/api/v1/admin/oauth-clients/' . rawurlencode($clientId) . '/rotate-secret', [], null, $idempotencyKey));
    }

    /**
     * Update OAuth client scopes.
     */
    public function updateScopes(string $clientId, OAuthClientUpdateScopesRequest $request): OAuthClientRecord
    {
        return OAuthClientRecord::fromPayload($this->http->object('PATCH', '/api/v1/admin/oauth-clients/' . rawurlencode($clientId) . '/scopes', [], $request->serialise()));
    }

    /**
     * Replace an OAuth client secret after unknown delivery.
     */
    public function replaceUnknownSecret(string $clientId, string $idempotencyKey): OAuthClientSecretResponse
    {
        return OAuthClientSecretResponse::fromPayload($this->http->object('POST', '/api/v1/admin/oauth-clients/' . rawurlencode($clientId) . '/replace-unknown-secret', [], null, $idempotencyKey));
    }
}
