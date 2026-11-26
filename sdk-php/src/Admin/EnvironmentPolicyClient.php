<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\EnvironmentPolicy\EnvironmentPolicy;
use HaakCo\Custd\Admin\EnvironmentPolicy\EnvironmentPolicyUpdateRequest;

/**
 * EnvironmentPolicyClient reads and changes which event environments the tenant accepts.
 */
final class EnvironmentPolicyClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Get the environment policy.
     */
    public function get(?string $companySlug = null): EnvironmentPolicy
    {
        return EnvironmentPolicy::fromPayload($this->http->object('GET', '/api/v1/admin/environment-policy', ['companySlug' => $companySlug], null));
    }

    /**
     * Update the environment policy.
     */
    public function update(EnvironmentPolicyUpdateRequest $request, ?string $companySlug = null): EnvironmentPolicy
    {
        return EnvironmentPolicy::fromPayload($this->http->object('PATCH', '/api/v1/admin/environment-policy', ['companySlug' => $companySlug], $request->serialise()));
    }
}
