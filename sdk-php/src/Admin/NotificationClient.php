<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Notification\NotificationDeliveryReplayRequest;
use HaakCo\Custd\Admin\Notification\NotificationDeliveryStatus;
use HaakCo\Custd\Admin\Notification\NotificationWebhookCreateRequest;
use HaakCo\Custd\Admin\Notification\NotificationWebhookEnabledRequest;
use HaakCo\Custd\Admin\Notification\NotificationWebhookListResponse;
use HaakCo\Custd\Admin\Notification\NotificationWebhookSecret;
use HaakCo\Custd\Admin\Notification\NotificationWebhookSubscription;
use HaakCo\Custd\Admin\Notification\TenantDestination;
use HaakCo\Custd\Admin\Notification\TenantDestinationRequest;
use HaakCo\Custd\Admin\Notification\NotificationDestinationEvent;

/**
 * NotificationClient keeps the tenant's notification webhooks and destinations and replays deliveries.
 */
final class NotificationClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List notification webhooks.
     */
    public function listWebhooks(): NotificationWebhookListResponse
    {
        return NotificationWebhookListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/notification-webhooks', [], null));
    }

    /**
     * Create notification webhook.
     */
    public function createWebhook(NotificationWebhookCreateRequest $request): NotificationWebhookSecret
    {
        return NotificationWebhookSecret::fromPayload($this->http->object('POST', '/api/v1/admin/notification-webhooks', [], $request->serialise()));
    }

    /**
     * Update notification webhook.
     */
    public function updateWebhook(string $uuid, NotificationWebhookEnabledRequest $request, ?string $companySlug = null): NotificationWebhookSubscription
    {
        return NotificationWebhookSubscription::fromPayload($this->http->object('PATCH', '/api/v1/admin/notification-webhooks/' . rawurlencode($uuid), ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Delete notification webhook.
     */
    public function deleteWebhook(string $uuid): void
    {
        $this->http->none('DELETE', '/api/v1/admin/notification-webhooks/' . rawurlencode($uuid), [], null);
    }

    /**
     * Rotate notification webhook secret.
     */
    public function rotateWebhookSecret(string $uuid, ?string $companySlug = null): NotificationWebhookSecret
    {
        return NotificationWebhookSecret::fromPayload($this->http->object('POST', '/api/v1/admin/notification-webhooks/' . rawurlencode($uuid) . '/rotate-secret', ['companySlug' => $companySlug], null));
    }

    /**
     * Get notification delivery.
     */
    public function getDelivery(string $uuid, ?string $companySlug = null): NotificationDeliveryStatus
    {
        return NotificationDeliveryStatus::fromPayload($this->http->object('GET', '/api/v1/admin/notification-deliveries/' . rawurlencode($uuid), ['companySlug' => $companySlug], null));
    }

    /**
     * Replay notification delivery.
     */
    public function replayDelivery(string $uuid, NotificationDeliveryReplayRequest $request, ?string $companySlug = null): void
    {
        $this->http->none('POST', '/api/v1/admin/notification-deliveries/' . rawurlencode($uuid) . '/replay', ['companySlug' => $companySlug], $request->serialise());
    }

    /**
     * Get where one event is sent for the tenant.
     *
     * @param NotificationDestinationEvent::* $eventSlug
     */
    public function getDestination(string $eventSlug, ?string $companySlug = null): TenantDestination
    {
        return TenantDestination::fromPayload($this->http->object('GET', '/api/v1/notification-destinations/' . rawurlencode($eventSlug), ['companySlug' => $companySlug], null));
    }

    /**
     * Set where one event is sent for the tenant.
     *
     * @param NotificationDestinationEvent::* $eventSlug
     */
    public function putDestination(string $eventSlug, TenantDestinationRequest $request, ?string $companySlug = null): TenantDestination
    {
        return TenantDestination::fromPayload($this->http->object('PUT', '/api/v1/notification-destinations/' . rawurlencode($eventSlug), ['companySlug' => $companySlug], $request->serialise()));
    }
}
