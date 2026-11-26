<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Usage\Query;
use HaakCo\Custd\Admin\Usage\Report;

/**
 * SystemUsageClient reads attributed usage across tenants through the system-administrator
 * `/usage` and `/usage/export` routes. A tenant reads its own usage with {@see UsageClient}.
 */
final class SystemUsageClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /** List attributed usage rows and totals; companySlug narrows them to one tenant. */
    public function list(?Query $query = null, ?string $companySlug = null): Report
    {
        return Report::fromPayload($this->http->object('GET', self::path('/api/v1/admin/usage', $query, $companySlug)));
    }

    /** Export the same usage window as {@see list} for reconciliation. */
    public function export(?Query $query = null, ?string $companySlug = null): Report
    {
        return Report::fromPayload($this->http->object('GET', self::path('/api/v1/admin/usage/export', $query, $companySlug)));
    }

    private static function path(string $route, ?Query $query, ?string $companySlug): string
    {
        $path = $route . ($query ?? new Query())->serialise();
        if ($companySlug === null || $companySlug === '') {
            return $path;
        }

        return $path . (str_contains($path, '?') ? '&' : '?') . 'companySlug=' . rawurlencode($companySlug);
    }
}
