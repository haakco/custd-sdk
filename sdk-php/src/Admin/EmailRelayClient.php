<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\EmailRelay\EmailRelay;
use HaakCo\Custd\Admin\EmailRelay\EmailRelayTestSendRequest;
use HaakCo\Custd\Admin\EmailRelay\EmailRelayTestSendResult;
use HaakCo\Custd\Admin\EmailRelay\EmailRelayView;
use HaakCo\Custd\Admin\EmailRelay\EmailRelayWriteRequest;

/**
 * EmailRelayClient keeps a tenant's outbound email relay and sends its test message.
 */
final class EmailRelayClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Get a tenant's email relay and effective sender.
     */
    public function get(string $tenantSlug): EmailRelayView
    {
        return EmailRelayView::fromPayload($this->http->object('GET', '/api/v1/admin/email-relay/' . rawurlencode($tenantSlug), [], null));
    }

    /**
     * Create or replace a tenant's email relay.
     */
    public function upsert(string $tenantSlug, EmailRelayWriteRequest $request): EmailRelay
    {
        return EmailRelay::fromPayload($this->http->object('PUT', '/api/v1/admin/email-relay/' . rawurlencode($tenantSlug), [], $request->serialise()));
    }

    /**
     * Clear a tenant's email relay.
     */
    public function delete(string $tenantSlug): void
    {
        $this->http->none('DELETE', '/api/v1/admin/email-relay/' . rawurlencode($tenantSlug), [], null);
    }

    /**
     * Send a test email on a tenant's effective relay.
     */
    public function testSend(string $tenantSlug, EmailRelayTestSendRequest $request): EmailRelayTestSendResult
    {
        return EmailRelayTestSendResult::fromPayload($this->http->object('POST', '/api/v1/admin/email-relay/' . rawurlencode($tenantSlug) . '/test-send', [], $request->serialise()));
    }
}
