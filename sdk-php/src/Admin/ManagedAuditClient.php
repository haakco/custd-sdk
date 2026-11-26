<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * ManagedAuditClient provisions the tenant's managed audit producer.
 */
final class ManagedAuditClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Provision the tenant's managed audit producer.
     */
    public function provisionProducer(): void
    {
        $this->http->none('POST', '/api/v1/managed-audit/provision', [], null);
    }
}
