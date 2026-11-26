<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\EventConfig\EventCategoryConfigListResponse;
use HaakCo\Custd\Admin\EventConfig\EventCategoryConfigUpdateRequest;
use HaakCo\Custd\Admin\EventConfig\EventTypeConfigListResponse;
use HaakCo\Custd\Admin\EventConfig\EventTypeConfigUpdateRequest;

/**
 * EventConfigClient lists and changes the tenant's event categories and event types.
 */
final class EventConfigClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * List event categories.
     */
    public function listCategories(): EventCategoryConfigListResponse
    {
        return EventCategoryConfigListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/event-categories', [], null));
    }

    /**
     * Update event category.
     */
    public function updateCategory(string $slug, EventCategoryConfigUpdateRequest $request): void
    {
        $this->http->none('PATCH', '/api/v1/admin/event-categories/' . rawurlencode($slug), [], $request->serialise());
    }

    /**
     * List event types.
     */
    public function listTypes(): EventTypeConfigListResponse
    {
        return EventTypeConfigListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/event-types', [], null));
    }

    /**
     * Update event type.
     */
    public function updateType(string $slug, EventTypeConfigUpdateRequest $request): void
    {
        $this->http->none('PATCH', '/api/v1/admin/event-types/' . rawurlencode($slug), [], $request->serialise());
    }
}
