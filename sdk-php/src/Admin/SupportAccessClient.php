<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SupportAccess\ImpersonationSession;
use HaakCo\Custd\Admin\SupportAccess\ImpersonationSessionCreateRequest;
use HaakCo\Custd\Admin\SupportAccess\ImpersonationSessionListResponse;
use HaakCo\Custd\Admin\SupportAccess\SupportAccessGrant;
use HaakCo\Custd\Admin\SupportAccess\SupportAccessGrantCreateRequest;
use HaakCo\Custd\Admin\SupportAccess\SupportAccessGrantListResponse;

/**
 * SupportAccessClient grants, lists and revokes time-boxed support access and runs the impersonation sessions
 * such a grant allows.
 */
final class SupportAccessClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List support access grants.
     */
    public function listGrants(?string $companySlug = null): SupportAccessGrantListResponse
    {
        return SupportAccessGrantListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/support-access', ['companySlug' => $companySlug], null));
    }

    /**
     * Create support access grant.
     */
    public function createGrant(SupportAccessGrantCreateRequest $request): SupportAccessGrant
    {
        return SupportAccessGrant::fromPayload($this->http->object('POST', '/api/v1/admin/support-access', [], $request->serialise()));
    }

    /**
     * Revoke support access grant.
     */
    public function revokeGrant(string $supportAccessGrantUuid): void
    {
        $this->http->none('POST', '/api/v1/admin/support-access/' . rawurlencode($supportAccessGrantUuid) . '/revoke', [], null);
    }

    /**
     * List impersonation sessions.
     */
    public function listImpersonationSessions(): ImpersonationSessionListResponse
    {
        return ImpersonationSessionListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/impersonation-sessions', [], null));
    }

    /**
     * Start an impersonation session.
     */
    public function startImpersonation(ImpersonationSessionCreateRequest $request): ImpersonationSession
    {
        return ImpersonationSession::fromPayload($this->http->object('POST', '/api/v1/admin/impersonation-sessions', [], $request->serialise()));
    }

    /**
     * End the operator's own impersonation session.
     */
    public function stopImpersonation(string $impersonationSessionUuid): ImpersonationSession
    {
        return ImpersonationSession::fromPayload($this->http->object('POST', '/api/v1/admin/impersonation-sessions/' . rawurlencode($impersonationSessionUuid) . '/stop', [], null));
    }

    /**
     * End another operator's impersonation session.
     */
    public function terminateImpersonation(string $impersonationSessionUuid): ImpersonationSession
    {
        return ImpersonationSession::fromPayload($this->http->object('POST', '/api/v1/admin/impersonation-sessions/' . rawurlencode($impersonationSessionUuid) . '/terminate', [], null));
    }
}
