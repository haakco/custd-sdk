<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\ClientSetup\ApplyResponse;
use HaakCo\Custd\Admin\ClientSetup\BootstrapStatus;
use HaakCo\Custd\Admin\ClientSetup\ClientBootstrapSubmitRequest;
use HaakCo\Custd\Admin\ClientSetup\Manifest;
use HaakCo\Custd\Admin\ClientSetup\ReadinessResponse;

/**
 * ClientSetupClient runs a client's first setup: the bootstrap checklist and the declarative tenant manifest
 * with its readiness.
 */
final class ClientSetupClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Get client bootstrap status.
     */
    public function bootstrapStatus(): BootstrapStatus
    {
        return BootstrapStatus::fromPayload($this->http->object('GET', '/api/v1/admin/bootstrap', [], null));
    }

    /**
     * Submit client bootstrap payload.
     */
    public function submitBootstrap(ClientBootstrapSubmitRequest $request = new ClientBootstrapSubmitRequest()): BootstrapStatus
    {
        return BootstrapStatus::fromPayload($this->http->object('POST', '/api/v1/admin/bootstrap', [], $request->serialise()));
    }

    /**
     * Apply tenant desired state.
     */
    public function apply(string $tenantSlug, Manifest $request, string $idempotencyKey): ApplyResponse
    {
        return ApplyResponse::fromPayload($this->http->object('PUT', '/api/v1/admin/tenant-manifest/' . rawurlencode($tenantSlug), [], $request->serialise(), $idempotencyKey));
    }

    /**
     * Read tenant desired-state readiness.
     */
    public function readiness(string $tenantSlug): ReadinessResponse
    {
        return ReadinessResponse::fromPayload($this->http->object('GET', '/api/v1/admin/tenant-manifest/' . rawurlencode($tenantSlug) . '/readiness', [], null));
    }
}
