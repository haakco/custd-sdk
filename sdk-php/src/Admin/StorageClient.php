<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Storage\StorageAlertEventListResponse;
use HaakCo\Custd\Admin\Storage\StorageAlertRule;
use HaakCo\Custd\Admin\Storage\StorageAlertRuleCreateRequest;
use HaakCo\Custd\Admin\Storage\StorageAlertRuleListResponse;
use HaakCo\Custd\Admin\Storage\StorageUsageSummary;
use HaakCo\Custd\Admin\Storage\TenantStorageUsage;

/**
 * StorageClient reads attributed storage usage and keeps a tenant's storage alert rules.
 */
final class StorageClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List tenant storage usage.
     */
    public function listUsage(): StorageUsageSummary
    {
        return StorageUsageSummary::fromPayload($this->http->object('GET', '/api/v1/admin/storage-usage', [], null));
    }

    /**
     * Get current tenant storage usage.
     */
    public function currentUsage(): TenantStorageUsage
    {
        return TenantStorageUsage::fromPayload($this->http->object('GET', '/api/v1/admin/storage-usage/me', [], null));
    }

    /**
     * List a tenant's storage alert rules.
     */
    public function listAlertRules(string $tenantSlug): StorageAlertRuleListResponse
    {
        return StorageAlertRuleListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/storage/alerts/' . rawurlencode($tenantSlug), [], null));
    }

    /**
     * Create a tenant storage alert rule.
     */
    public function createAlertRule(string $tenantSlug, StorageAlertRuleCreateRequest $request): StorageAlertRule
    {
        return StorageAlertRule::fromPayload($this->http->object('POST', '/api/v1/admin/storage/alerts/' . rawurlencode($tenantSlug), [], $request->serialise()));
    }

    /**
     * Delete a tenant storage alert rule.
     */
    public function deleteAlertRule(string $tenantSlug, string $ruleId): void
    {
        $this->http->none('DELETE', '/api/v1/admin/storage/alerts/' . rawurlencode($tenantSlug) . '/' . rawurlencode($ruleId), [], null);
    }

    /**
     * List recent storage alert events for a tenant.
     */
    public function listAlertEvents(string $tenantSlug): StorageAlertEventListResponse
    {
        return StorageAlertEventListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/storage/alerts/' . rawurlencode($tenantSlug) . '/events', [], null));
    }
}
